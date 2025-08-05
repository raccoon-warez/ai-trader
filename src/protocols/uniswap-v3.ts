import { BaseProtocol } from './base';
import { Pool, Token, TradeStep } from '../types';
import { ethers } from 'ethers';
import axios from 'axios';

const UNISWAP_V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

const UNISWAP_V3_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)'
];

const UNISWAP_V3_QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
];

const UNISWAP_V3_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
];

export class UniswapV3Protocol extends BaseProtocol {
  private factoryAddress: string;
  private routerAddress: string;
  private quoterAddress: string;
  private graphEndpoint?: string;
  private commonFees = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

  constructor(
    rpcUrl: string,
    chainId: number,
    factoryAddress: string,
    routerAddress: string,
    quoterAddress: string,
    graphEndpoint?: string
  ) {
    super(rpcUrl, chainId, 'uniswap_v3');
    this.factoryAddress = factoryAddress;
    this.routerAddress = routerAddress;
    this.quoterAddress = quoterAddress;
    this.graphEndpoint = graphEndpoint;
  }

  async getPools(tokenA: Token, tokenB: Token): Promise<Pool[]> {
    try {
      if (this.graphEndpoint) {
        return await this.getPoolsFromGraph(tokenA, tokenB);
      }
      return await this.getPoolsFromContract(tokenA, tokenB);
    } catch (error) {
      console.error(`Error getting V3 pools for ${tokenA.symbol}/${tokenB.symbol}:`, error);
      return [];
    }
  }

  private async getPoolsFromGraph(tokenA: Token, tokenB: Token): Promise<Pool[]> {
    if (!this.graphEndpoint) return [];

    const query = `
      query GetPools($token0: String!, $token1: String!) {
        pools(where: {
          or: [
            {token0: $token0, token1: $token1},
            {token0: $token1, token1: $token0}
          ]
        }) {
          id
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
          feeTier
          liquidity
          sqrtPrice
          tick
          volumeUSD
        }
      }
    `;

    try {
      const response = await axios.post(this.graphEndpoint, {
        query,
        variables: {
          token0: tokenA.address.toLowerCase(),
          token1: tokenB.address.toLowerCase()
        }
      });

      const pools = response.data.data.pools;
      return pools.map((pool: any) => ({
        id: pool.id,
        protocol: this.name,
        tokenA: {
          address: pool.token0.id,
          symbol: pool.token0.symbol,
          name: pool.token0.name,
          decimals: parseInt(pool.token0.decimals),
          chainId: this.chainId
        },
        tokenB: {
          address: pool.token1.id,
          symbol: pool.token1.symbol,
          name: pool.token1.name,
          decimals: parseInt(pool.token1.decimals),
          chainId: this.chainId
        },
        reserve0: '0', // V3 doesn't use reserves in the same way
        reserve1: '0',
        fee: parseInt(pool.feeTier) / 1000000, // Convert from basis points
        liquidity: pool.liquidity,
        chainId: this.chainId
      }));
    } catch (error) {
      console.error('Error fetching V3 pools from graph:', error);
      return [];
    }
  }

  private async getPoolsFromContract(tokenA: Token, tokenB: Token): Promise<Pool[]> {
    const factory = new ethers.Contract(this.factoryAddress, UNISWAP_V3_FACTORY_ABI, this.provider);
    const pools: Pool[] = [];

    for (const fee of this.commonFees) {
      try {
        const poolAddress = await factory.getPool(tokenA.address, tokenB.address, fee);
        
        if (poolAddress === ethers.ZeroAddress) {
          continue;
        }

        const poolContract = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, this.provider);
        const [slot0, liquidity, token0Address, token1Address] = await Promise.all([
          poolContract.slot0(),
          poolContract.liquidity(),
          poolContract.token0(),
          poolContract.token1()
        ]);

        const [token0, token1] = token0Address.toLowerCase() === tokenA.address.toLowerCase() 
          ? [tokenA, tokenB] 
          : [tokenB, tokenA];

        pools.push({
          id: poolAddress,
          protocol: this.name,
          tokenA: token0,
          tokenB: token1,
          reserve0: '0',
          reserve1: '0',
          fee: fee / 1000000,
          liquidity: liquidity.toString(),
          chainId: this.chainId
        });
      } catch (error) {
        console.error(`Error getting V3 pool for fee ${fee}:`, error);
        continue;
      }
    }

    return pools;
  }

  async getQuote(tokenIn: Token, tokenOut: Token, amountIn: string, pool: Pool): Promise<string> {
    try {
      const quoter = new ethers.Contract(this.quoterAddress, UNISWAP_V3_QUOTER_ABI, this.provider);
      const fee = Math.round(pool.fee * 1000000); // Convert back to basis points
      
      const amountOut = await quoter.quoteExactInputSingle.staticCall(
        tokenIn.address,
        tokenOut.address,
        fee,
        amountIn,
        0
      );
      
      return amountOut.toString();
    } catch (error) {
      console.error('Error getting V3 quote:', error);
      return '0';
    }
  }

  async executeTrade(tradeStep: TradeStep, privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const router = new ethers.Contract(this.routerAddress, UNISWAP_V3_ROUTER_ABI, wallet);
    
    try {
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
      const fee = Math.round(tradeStep.pool.fee * 1000000);
      
      const params = {
        tokenIn: tradeStep.tokenIn.address,
        tokenOut: tradeStep.tokenOut.address,
        fee: fee,
        recipient: wallet.address,
        deadline: deadline,
        amountIn: tradeStep.amountIn,
        amountOutMinimum: tradeStep.amountOutMin,
        sqrtPriceLimitX96: 0
      };
      
      const tx = await router.exactInputSingle(params);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error executing V3 trade:', error);
      throw error;
    }
  }

  async estimateGas(tradeStep: TradeStep): Promise<string> {
    try {
      const router = new ethers.Contract(this.routerAddress, UNISWAP_V3_ROUTER_ABI, this.provider);
      const deadline = Math.floor(Date.now() / 1000) + 1200;
      const fee = Math.round(tradeStep.pool.fee * 1000000);
      
      const params = {
        tokenIn: tradeStep.tokenIn.address,
        tokenOut: tradeStep.tokenOut.address,
        fee: fee,
        recipient: ethers.ZeroAddress,
        deadline: deadline,
        amountIn: tradeStep.amountIn,
        amountOutMinimum: tradeStep.amountOutMin,
        sqrtPriceLimitX96: 0
      };
      
      const gasEstimate = await router.exactInputSingle.estimateGas(params);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating V3 gas:', error);
      return '250000';
    }
  }
}