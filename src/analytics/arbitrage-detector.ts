import { EventEmitter } from 'events';
import { ArbitrageOpportunity, Token, Pool, TradeStep, PriceData } from '../types';
import { ProtocolManager } from '../protocols';
import { PriceMonitor } from '../monitoring/price-monitor';
import CONFIG from '../config';
import { ethers } from 'ethers';

export class ArbitrageDetector extends EventEmitter {
  private protocolManager: ProtocolManager;
  private priceMonitor: PriceMonitor;
  private scanningTokens: Token[] = [];
  private scanInterval: NodeJS.Timeout | null = null;
  private lastScanTime: number = 0;

  constructor(protocolManager: ProtocolManager, priceMonitor: PriceMonitor) {
    super();
    this.protocolManager = protocolManager;
    this.priceMonitor = priceMonitor;
  }

  async startScanning(tokens: Token[]): Promise<void> {
    console.log(`Starting arbitrage scanning for ${tokens.length} tokens`);
    this.scanningTokens = tokens;

    // Start continuous scanning
    this.scanInterval = setInterval(async () => {
      await this.scanForOpportunities();
    }, 2000); // Scan every 2 seconds

    // Initial scan
    await this.scanForOpportunities();
    this.emit('scanning-started', { tokenCount: tokens.length });
  }

  private async scanForOpportunities(): Promise<void> {
    const startTime = Date.now();
    const opportunities: ArbitrageOpportunity[] = [];

    try {
      // Generate all token pairs for scanning
      for (let i = 0; i < this.scanningTokens.length; i++) {
        for (let j = i + 1; j < this.scanningTokens.length; j++) {
          const tokenA = this.scanningTokens[i];
          const tokenB = this.scanningTokens[j];

          const pairOpportunities = await this.scanTokenPair(tokenA, tokenB);
          opportunities.push(...pairOpportunities);
        }
      }

      // Filter and sort opportunities
      const validOpportunities = opportunities
        .filter(opp => opp.profitPercentage >= CONFIG.trading.minProfitThreshold)
        .sort((a, b) => b.profitPercentage - a.profitPercentage);

      this.lastScanTime = Date.now();
      
      if (validOpportunities.length > 0) {
        console.log(`Found ${validOpportunities.length} arbitrage opportunities`);
        validOpportunities.forEach(opp => {
          this.emit('opportunity-found', opp);
        });
      }

      this.emit('scan-completed', {
        opportunitiesFound: validOpportunities.length,
        scanTime: Date.now() - startTime,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error during arbitrage scanning:', error);
      this.emit('scan-error', error);
    }
  }

  private async scanTokenPair(tokenA: Token, tokenB: Token): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];

    try {
      // Get all pools for this token pair across protocols
      const allPools: { protocol: string; pools: Pool[] }[] = [];
      
      const protocols = this.protocolManager.getProtocolsByChain(tokenA.chainId);
      
      for (const protocol of protocols) {
        const pools = await protocol.getPools(tokenA, tokenB);
        if (pools.length > 0) {
          allPools.push({ protocol: protocol.getName(), pools });
        }
      }

      if (allPools.length < 2) {
        return opportunities; // Need at least 2 pools for arbitrage
      }

      // Compare prices across all pool combinations
      for (let i = 0; i < allPools.length; i++) {
        for (let j = i + 1; j < allPools.length; j++) {
          const poolsA = allPools[i].pools;
          const poolsB = allPools[j].pools;

          for (const poolA of poolsA) {
            for (const poolB of poolsB) {
              const opportunity = await this.calculateArbitrage(tokenA, tokenB, poolA, poolB);
              if (opportunity) {
                opportunities.push(opportunity);
              }
            }
          }
        }
      }

    } catch (error) {
      console.error(`Error scanning pair ${tokenA.symbol}/${tokenB.symbol}:`, error);
    }

    return opportunities;
  }

  private async calculateArbitrage(
    tokenA: Token,
    tokenB: Token,
    poolA: Pool,
    poolB: Pool
  ): Promise<ArbitrageOpportunity | null> {
    try {
      const testAmount = ethers.parseUnits('1', tokenA.decimals).toString();
      
      // Get quotes from both pools
      const protocolA = this.protocolManager.getProtocol(poolA.protocol, tokenA.chainId);
      const protocolB = this.protocolManager.getProtocol(poolB.protocol, tokenA.chainId);

      if (!protocolA || !protocolB) {
        return null;
      }

      // Direction 1: Buy on poolA, sell on poolB
      const quoteA_to_B = await protocolA.getQuote(tokenA, tokenB, testAmount, poolA);
      const quoteB_back = await protocolB.getQuote(tokenB, tokenA, quoteA_to_B, poolB);

      const profit1 = BigInt(quoteB_back) - BigInt(testAmount);
      const profitPercent1 = Number(profit1 * 10000n / BigInt(testAmount)) / 100;

      // Direction 2: Buy on poolB, sell on poolA
      const quoteB_to_A = await protocolB.getQuote(tokenA, tokenB, testAmount, poolB);
      const quoteA_back = await protocolA.getQuote(tokenB, tokenA, quoteB_to_A, poolA);

      const profit2 = BigInt(quoteA_back) - BigInt(testAmount);
      const profitPercent2 = Number(profit2 * 10000n / BigInt(testAmount)) / 100;

      // Choose the more profitable direction
      let buyPool: Pool, sellPool: Pool, profitPercentage: number, profitAmount: string;
      
      if (profitPercent1 > profitPercent2 && profitPercent1 > 0) {
        buyPool = poolA;
        sellPool = poolB;
        profitPercentage = profitPercent1;
        profitAmount = profit1.toString();
      } else if (profitPercent2 > 0) {
        buyPool = poolB;
        sellPool = poolA;
        profitPercentage = profitPercent2;
        profitAmount = profit2.toString();
      } else {
        return null; // No profitable opportunity
      }

      // Estimate gas costs
      const gasEstimateBuy = await protocolA.estimateGas({
        protocol: buyPool.protocol,
        tokenIn: tokenA,
        tokenOut: tokenB,
        amountIn: testAmount,
        amountOutMin: '0',
        pool: buyPool,
        route: [tokenA.address, tokenB.address]
      });

      const gasEstimateSell = await protocolB.estimateGas({
        protocol: sellPool.protocol,
        tokenIn: tokenB,
        tokenOut: tokenA,
        amountIn: quoteA_to_B,
        amountOutMin: '0',
        pool: sellPool,
        route: [tokenB.address, tokenA.address]
      });

      const totalGasEstimate = (BigInt(gasEstimateBuy) + BigInt(gasEstimateSell)).toString();

      // Create execution path
      const executionPath: TradeStep[] = [
        {
          protocol: buyPool.protocol,
          tokenIn: tokenA,
          tokenOut: tokenB,
          amountIn: testAmount,
          amountOutMin: this.calculateMinAmount(quoteA_to_B, CONFIG.trading.maxSlippage),
          pool: buyPool,
          route: [tokenA.address, tokenB.address]
        },
        {
          protocol: sellPool.protocol,
          tokenIn: tokenB,
          tokenOut: tokenA,
          amountIn: quoteA_to_B,
          amountOutMin: this.calculateMinAmount(quoteB_back, CONFIG.trading.maxSlippage),
          pool: sellPool,
          route: [tokenB.address, tokenA.address]
        }
      ];

      // Calculate potential earnings in USD
      const potentialEarningsUSD = await this.estimateEarningsInUSD(tokenA, profitAmount);
      
      return {
        id: `${tokenA.symbol}_${tokenB.symbol}_${Date.now()}`,
        tokenA,
        tokenB,
        buyPool,
        sellPool,
        profitPercentage,
        profitAmount,
        potentialEarningsUSD,
        inputAmount: testAmount,
        confidence: this.calculateConfidence(buyPool, sellPool, profitPercentage),
        timestamp: Date.now(),
        gasEstimate: totalGasEstimate,
        executionPath
      };

    } catch (error) {
      console.error('Error calculating arbitrage:', error);
      return null;
    }
  }

  private calculateMinAmount(amount: string, slippage: number): string {
    const slippageMultiplier = 1 - slippage;
    const minAmount = BigInt(amount) * BigInt(Math.floor(slippageMultiplier * 1000)) / 1000n;
    return minAmount.toString();
  }

  private async estimateEarningsInUSD(token: Token, profitAmount: string): Promise<number> {
    try {
      // Get the current price of the token in USD
      const priceData = this.priceMonitor.getPrice(token.address);
      if (!priceData) {
        return 0;
      }
      
      // Convert profit amount to USD
      const profitInToken = parseFloat(ethers.formatUnits(profitAmount, token.decimals));
      const profitInUSD = profitInToken * priceData.price;
      
      return profitInUSD;
    } catch (error) {
      console.error('Error estimating earnings in USD:', error);
      return 0;
    }
  }

  private calculateConfidence(buyPool: Pool, sellPool: Pool, profitPercentage: number): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for higher liquidity pools
    const buyLiquidity = parseFloat(buyPool.liquidity) || 0;
    const sellLiquidity = parseFloat(sellPool.liquidity) || 0;
    const avgLiquidity = (buyLiquidity + sellLiquidity) / 2;
    
    if (avgLiquidity > 1000000) confidence += 0.2;
    else if (avgLiquidity > 100000) confidence += 0.1;

    // Higher confidence for higher profit margins
    if (profitPercentage > 2) confidence += 0.15;
    else if (profitPercentage > 1) confidence += 0.1;
    else if (profitPercentage > 0.5) confidence += 0.05;

    // Lower confidence for different protocols (higher execution risk)
    if (buyPool.protocol !== sellPool.protocol) confidence -= 0.1;

    return Math.min(Math.max(confidence, 0), 1);
  }

  async optimizeTradeSize(opportunity: ArbitrageOpportunity): Promise<string> {
    // This is a simplified optimization - in practice, you'd want more sophisticated logic
    const maxSize = ethers.parseUnits(CONFIG.trading.maxPositionSize.toString(), opportunity.tokenA.decimals);
    
    // Start with 10% of max position size for safety
    const optimizedSize = maxSize / 10n;
    
    return optimizedSize.toString();
  }

  stopScanning(): void {
    console.log('Stopping arbitrage scanning');
    
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    this.emit('scanning-stopped');
  }

  getScanningStats(): {
    tokensScanned: number;
    lastScanTime: number;
    isScanning: boolean;
  } {
    return {
      tokensScanned: this.scanningTokens.length,
      lastScanTime: this.lastScanTime,
      isScanning: this.scanInterval !== null
    };
  }
}
