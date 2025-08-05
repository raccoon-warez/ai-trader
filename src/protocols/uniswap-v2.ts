import { BaseProtocol } from './base';
import { Pool, Token, TradeStep } from '../types';
import { ethers } from 'ethers';
import axios from 'axios';

const UNISWAP_V2_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint256)'
];

const UNISWAP_V2_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)'
];

export class UniswapV2Protocol extends BaseProtocol {
  private factoryAddress: string;
  private routerAddress: string;
  private graphEndpoint?: string;

  constructor(
    rpcUrl: string,
    chainId: number,
    factoryAddress: string,
    routerAddress: string,
    graphEndpoint?: string
  ) {
    super(rpcUrl, chainId, 'uniswap_v2');
    this.factoryAddress = factoryAddress;
    this.routerAddress = routerAddress;
    this.graphEndpoint = graphEndpoint;
  }

  async getPools(tokenA: Token, tokenB: Token): Promise<Pool[]> {
    try {
      if (this.graphEndpoint) {
        return await this.getPoolsFromGraph(tokenA, tokenB);
      }
      return await this.getPoolsFromContract(tokenA, tokenB);
    } catch (error) {
      console.error(`Error getting pools for ${tokenA.symbol}/${tokenB.symbol}:`, error);
      return [];
    }
  }

  private async getPoolsFromGraph(tokenA: Token, tokenB: Token): Promise<Pool[]> {
    if (!this.graphEndpoint) return [];

    const query = `
      query GetPairs($token0: String!, $token1: String!) {
        pairs(where: {
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
          reserve0
          reserve1
          totalSupply
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

      const pairs = response.data.data.pairs;
      return pairs.map((pair: any) => ({
        id: pair.id,
        protocol: this.name,
        tokenA: {
          address: pair.token0.id,
          symbol: pair.token0.symbol,
          name: pair.token0.name,
          decimals: parseInt(pair.token0.decimals),
          chainId: this.chainId
        },
        tokenB: {
          address: pair.token1.id,
          symbol: pair.token1.symbol,
          name: pair.token1.name,
          decimals: parseInt(pair.token1.decimals),
          chainId: this.chainId
        },
        reserve0: pair.reserve0,
        reserve1: pair.reserve1,
        fee: 0.003,
        liquidity: pair.totalSupply,
        chainId: this.chainId
      }));
    } catch (error) {
      console.error('Error fetching from graph:', error);
      return [];
    }
  }

  private async getPoolsFromContract(tokenA: Token, tokenB: Token): Promise<Pool[]> {
    const factory = new ethers.Contract(this.factoryAddress, UNISWAP_V2_FACTORY_ABI, this.provider);
    
    try {
      const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
      
      if (pairAddress === ethers.ZeroAddress) {
        return [];
      }

      const pairContract = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, this.provider);
      const [reserves, token0Address, token1Address, totalSupply] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
        pairContract.token1()
      ]);

      const [token0, token1] = token0Address.toLowerCase() === tokenA.address.toLowerCase() 
        ? [tokenA, tokenB] 
        : [tokenB, tokenA];

      return [{
        id: pairAddress,
        protocol: this.name,
        tokenA: token0,
        tokenB: token1,
        reserve0: reserves[0].toString(),
        reserve1: reserves[1].toString(),
        fee: 0.003,
        liquidity: totalSupply?.toString() || '0',
        chainId: this.chainId
      }];
    } catch (error) {
      console.error('Error getting pool from contract:', error);
      return [];
    }
  }

  async getQuote(tokenIn: Token, tokenOut: Token, amountIn: string, pool: Pool): Promise<string> {
    try {
      const router = new ethers.Contract(this.routerAddress, UNISWAP_V2_ROUTER_ABI, this.provider);
      const path = [tokenIn.address, tokenOut.address];
      
      const amounts = await router.getAmountsOut(amountIn, path);
      return amounts[1].toString();
    } catch (error) {
      console.error('Error getting quote:', error);
      return '0';
    }
  }

  async executeTrade(tradeStep: TradeStep, privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const router = new ethers.Contract(this.routerAddress, UNISWAP_V2_ROUTER_ABI, wallet);
    
    try {
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
      
      const tx = await router.swapExactTokensForTokens(
        tradeStep.amountIn,
        tradeStep.amountOutMin,
        tradeStep.route,
        wallet.address,
        deadline
      );
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  async estimateGas(tradeStep: TradeStep): Promise<string> {
    try {
      const router = new ethers.Contract(this.routerAddress, UNISWAP_V2_ROUTER_ABI, this.provider);
      const deadline = Math.floor(Date.now() / 1000) + 1200;
      
      const gasEstimate = await router.swapExactTokensForTokens.estimateGas(
        tradeStep.amountIn,
        tradeStep.amountOutMin,
        tradeStep.route,
        ethers.ZeroAddress,
        deadline
      );
      
      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      return '200000';
    }
  }
}