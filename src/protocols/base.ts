import { Pool, Token, TradeStep } from '../types';
import { ethers } from 'ethers';

export abstract class BaseProtocol {
  protected provider: ethers.JsonRpcProvider;
  protected chainId: number;
  protected name: string;

  constructor(rpcUrl: string, chainId: number, name: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.chainId = chainId;
    this.name = name;
  }

  abstract getPools(tokenA: Token, tokenB: Token): Promise<Pool[]>;
  abstract getQuote(tokenIn: Token, tokenOut: Token, amountIn: string, pool: Pool): Promise<string>;
  abstract executeTrade(tradeStep: TradeStep, privateKey: string): Promise<string>;
  abstract estimateGas(tradeStep: TradeStep): Promise<string>;
  
  protected async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    if (tokenAddress === ethers.ZeroAddress) {
      return await this.provider.getBalance(walletAddress).then(b => b.toString());
    }
    
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );
    
    const balance = await tokenContract.balanceOf(walletAddress);
    return balance.toString();
  }

  protected calculatePriceImpact(amountIn: string, reserve0: string, reserve1: string): number {
    const amountInBN = BigInt(amountIn);
    const reserve0BN = BigInt(reserve0);
    const reserve1BN = BigInt(reserve1);
    
    const k = reserve0BN * reserve1BN;
    const newReserve0 = reserve0BN + amountInBN;
    const newReserve1 = k / newReserve0;
    
    const priceImpact = Number((reserve1BN - newReserve1) * 10000n / reserve1BN) / 100;
    return priceImpact;
  }

  getName(): string {
    return this.name;
  }

  getChainId(): number {
    return this.chainId;
  }
}