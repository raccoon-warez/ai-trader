import { EventEmitter } from 'events';
import { ArbitrageOpportunity, AIModelPrediction } from '../types';
import CONFIG from '../config';

interface RiskAssessment {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  shouldExecute: boolean;
  reasons: string[];
  adjustedPositionSize?: string;
  maxSlippage?: number;
}

interface PositionLimits {
  maxDailyVolume: string;
  maxPositionSize: string;
  maxConcurrentTrades: number;
  cooldownPeriod: number;
}

export class RiskManager extends EventEmitter {
  private dailyVolume: string = '0';
  private dailyTrades: number = 0;
  private activeTrades: number = 0;
  private lastTradeTime: number = 0;
  private dailyResetTime: number = 0;
  private blacklistedTokens: Set<string> = new Set();
  private blacklistedProtocols: Set<string> = new Set();

  constructor() {
    super();
    this.resetDailyLimits();
  }

  private resetDailyLimits(): void {
    const now = Date.now();
    const tomorrow = new Date();
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    
    this.dailyResetTime = tomorrow.getTime();
    this.dailyVolume = '0';
    this.dailyTrades = 0;
  }

  assessRisk(
    opportunity: ArbitrageOpportunity, 
    aiPrediction?: AIModelPrediction
  ): RiskAssessment {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check if daily reset is needed
    if (Date.now() > this.dailyResetTime) {
      this.resetDailyLimits();
    }

    // 1. Token Risk Assessment
    const tokenRisk = this.assessTokenRisk(opportunity);
    riskScore += tokenRisk.score;
    reasons.push(...tokenRisk.reasons);

    // 2. Protocol Risk Assessment
    const protocolRisk = this.assessProtocolRisk(opportunity);
    riskScore += protocolRisk.score;
    reasons.push(...protocolRisk.reasons);

    // 3. Liquidity Risk Assessment
    const liquidityRisk = this.assessLiquidityRisk(opportunity);
    riskScore += liquidityRisk.score;
    reasons.push(...liquidityRisk.reasons);

    // 4. Profit Margin Risk Assessment
    const profitRisk = this.assessProfitRisk(opportunity);
    riskScore += profitRisk.score;
    reasons.push(...profitRisk.reasons);

    // 5. AI Prediction Risk Assessment
    if (aiPrediction) {
      const aiRisk = this.assessAIPredictionRisk(aiPrediction);
      riskScore += aiRisk.score;
      reasons.push(...aiRisk.reasons);
    }

    // 6. Position Size Risk Assessment
    const positionRisk = this.assessPositionSizeRisk(opportunity);
    riskScore += positionRisk.score;
    reasons.push(...positionRisk.reasons);

    // 7. Market Conditions Risk Assessment
    const marketRisk = this.assessMarketConditionsRisk(opportunity);
    riskScore += marketRisk.score;
    reasons.push(...marketRisk.reasons);

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore <= 20) riskLevel = 'LOW';
    else if (riskScore <= 40) riskLevel = 'MEDIUM';
    else if (riskScore <= 70) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    // Determine if trade should be executed
    const shouldExecute = this.shouldExecuteTrade(riskScore, opportunity);

    // Calculate adjusted position size if needed
    const adjustedPositionSize = this.calculateAdjustedPositionSize(
      opportunity, 
      riskScore
    );

    // Calculate adjusted slippage tolerance
    const maxSlippage = this.calculateAdjustedSlippage(riskScore);

    const assessment: RiskAssessment = {
      riskScore,
      riskLevel,
      shouldExecute,
      reasons,
      adjustedPositionSize,
      maxSlippage
    };

    this.emit('risk-assessment', assessment);
    return assessment;
  }

  private assessTokenRisk(opportunity: ArbitrageOpportunity): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Check blacklisted tokens
    if (this.blacklistedTokens.has(opportunity.tokenA.address.toLowerCase()) ||
        this.blacklistedTokens.has(opportunity.tokenB.address.toLowerCase())) {
      score += 100;
      reasons.push('Token is blacklisted');
    }

    // Check token age (newer tokens are riskier)
    // This would require additional data about token deployment dates
    // For now, we'll use a placeholder

    // Check if tokens are well known stablecoins or major tokens
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD'];
    const majorTokens = ['WETH', 'WBTC', 'WMATIC', 'BNB'];
    
    const isStablecoinPair = stablecoins.includes(opportunity.tokenA.symbol) && 
                            stablecoins.includes(opportunity.tokenB.symbol);
    const isMajorTokenPair = majorTokens.includes(opportunity.tokenA.symbol) || 
                            majorTokens.includes(opportunity.tokenB.symbol);

    if (isStablecoinPair) {
      score -= 5; // Lower risk for stablecoin pairs
      reasons.push('Stablecoin pair - reduced risk');
    } else if (isMajorTokenPair) {
      score -= 2; // Slightly lower risk for major tokens
      reasons.push('Major token pair - slightly reduced risk');
    } else {
      score += 10; // Higher risk for unknown tokens
      reasons.push('Unknown token pair - increased risk');
    }

    return { score, reasons };
  }

  private assessProtocolRisk(opportunity: ArbitrageOpportunity): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Check blacklisted protocols
    if (this.blacklistedProtocols.has(opportunity.buyPool.protocol) ||
        this.blacklistedProtocols.has(opportunity.sellPool.protocol)) {
      score += 50;
      reasons.push('Protocol is blacklisted');
    }

    // Assess protocol reputation
    const trustedProtocols = ['uniswap_v2', 'uniswap_v3', 'sushiswap', 'pancakeswap'];
    const buyProtocolTrusted = trustedProtocols.includes(opportunity.buyPool.protocol);
    const sellProtocolTrusted = trustedProtocols.includes(opportunity.sellPool.protocol);

    if (!buyProtocolTrusted || !sellProtocolTrusted) {
      score += 15;
      reasons.push('Using less established protocol');
    }

    // Cross-protocol arbitrage carries additional risk
    if (opportunity.buyPool.protocol !== opportunity.sellPool.protocol) {
      score += 5;
      reasons.push('Cross-protocol arbitrage - additional execution risk');
    }

    return { score, reasons };
  }

  private assessLiquidityRisk(opportunity: ArbitrageOpportunity): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const buyLiquidity = parseFloat(opportunity.buyPool.liquidity) || 0;
    const sellLiquidity = parseFloat(opportunity.sellPool.liquidity) || 0;
    const minLiquidity = Math.min(buyLiquidity, sellLiquidity);
    const positionSize = parseFloat(opportunity.inputAmount) / 1e18; // Simplified

    // Calculate liquidity utilization
    const liquidityUtilization = positionSize / minLiquidity;

    if (minLiquidity < 10000) {
      score += 30;
      reasons.push('Very low liquidity pools');
    } else if (minLiquidity < 100000) {
      score += 15;
      reasons.push('Low liquidity pools');
    }

    if (liquidityUtilization > 0.05) { // Using more than 5% of pool liquidity
      score += 25;
      reasons.push('High liquidity utilization - increased slippage risk');
    } else if (liquidityUtilization > 0.02) {
      score += 10;
      reasons.push('Moderate liquidity utilization');
    }

    return { score, reasons };
  }

  private assessProfitRisk(opportunity: ArbitrageOpportunity): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Very high profit margins might indicate stale data or errors
    if (opportunity.profitPercentage > 5) {
      score += 20;
      reasons.push('Unusually high profit margin - possible stale data');
    } else if (opportunity.profitPercentage > 2) {
      score += 5;
      reasons.push('High profit margin - verify data freshness');
    }

    // Very low profit margins increase execution risk
    if (opportunity.profitPercentage < 0.1) {
      score += 25;
      reasons.push('Very low profit margin - high execution risk');
    } else if (opportunity.profitPercentage < 0.2) {
      score += 10;
      reasons.push('Low profit margin - moderate execution risk');
    }

    return { score, reasons };
  }

  private assessAIPredictionRisk(aiPrediction: AIModelPrediction): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Low AI confidence increases risk
    if (aiPrediction.confidence < 0.5) {
      score += 30;
      reasons.push('Low AI confidence in opportunity');
    } else if (aiPrediction.confidence < 0.7) {
      score += 15;
      reasons.push('Moderate AI confidence');
    } else {
      score -= 5;
      reasons.push('High AI confidence - reduced risk');
    }

    // High AI risk score
    if (aiPrediction.riskScore > 0.8) {
      score += 25;
      reasons.push('AI indicates high risk');
    } else if (aiPrediction.riskScore > 0.6) {
      score += 10;
      reasons.push('AI indicates moderate risk');
    }

    // Low execution probability
    if (aiPrediction.executionProbability < 0.5) {
      score += 20;
      reasons.push('Low execution probability predicted');
    }

    return { score, reasons };
  }

  private assessPositionSizeRisk(opportunity: ArbitrageOpportunity): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const positionSizeUSD = parseFloat(opportunity.inputAmount) / 1e18; // Simplified conversion
    const maxPositionSize = CONFIG.trading.maxPositionSize;

    if (positionSizeUSD > maxPositionSize * 0.5) {
      score += 20;
      reasons.push('Large position size relative to limits');
    }

    // Check daily volume limits
    const newDailyVolume = BigInt(this.dailyVolume) + BigInt(opportunity.inputAmount);
    const dailyVolumeUSD = Number(newDailyVolume) / 1e18;
    
    if (dailyVolumeUSD > maxPositionSize * 10) { // Arbitrary daily limit
      score += 40;
      reasons.push('Would exceed daily volume limits');
    }

    return { score, reasons };
  }

  private assessMarketConditionsRisk(opportunity: ArbitrageOpportunity): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Check if too many trades have been executed recently
    if (this.activeTrades >= 3) {
      score += 15;
      reasons.push('Multiple concurrent trades - increased risk');
    }

    // Check cooldown period
    const timeSinceLastTrade = Date.now() - this.lastTradeTime;
    if (timeSinceLastTrade < 30000 && this.lastTradeTime > 0) { // 30 seconds cooldown
      score += 10;
      reasons.push('Recent trade execution - cooldown period');
    }

    // Check opportunity age
    const opportunityAge = Date.now() - opportunity.timestamp;
    if (opportunityAge > 60000) { // 1 minute old
      score += 15;
      reasons.push('Stale opportunity - data may be outdated');
    } else if (opportunityAge > 30000) { // 30 seconds old
      score += 5;
      reasons.push('Moderately aged opportunity');
    }

    return { score, reasons };
  }

  private shouldExecuteTrade(riskScore: number, opportunity: ArbitrageOpportunity): boolean {
    // Don't execute if risk is critical
    if (riskScore > 70) return false;

    // Check daily limits
    if (this.dailyTrades >= 50) return false; // Daily trade limit

    // Check if we have too many active trades
    if (this.activeTrades >= 3) return false;

    // Check minimum profit after risk adjustment
    const riskAdjustedMinProfit = CONFIG.trading.minProfitThreshold * (1 + riskScore / 100);
    if (opportunity.profitPercentage < riskAdjustedMinProfit) return false;

    return true;
  }

  private calculateAdjustedPositionSize(opportunity: ArbitrageOpportunity, riskScore: number): string {
    const basePositionSize = BigInt(opportunity.inputAmount);
    
    // Reduce position size based on risk
    let sizeMultiplier = 1;
    if (riskScore > 50) sizeMultiplier = 0.5;
    else if (riskScore > 30) sizeMultiplier = 0.7;
    else if (riskScore > 15) sizeMultiplier = 0.85;

    const adjustedSize = basePositionSize * BigInt(Math.floor(sizeMultiplier * 100)) / 100n;
    return adjustedSize.toString();
  }

  private calculateAdjustedSlippage(riskScore: number): number {
    let baseSlippage = CONFIG.trading.maxSlippage;
    
    // Reduce slippage tolerance for higher risk trades
    if (riskScore > 50) baseSlippage *= 0.5;
    else if (riskScore > 30) baseSlippage *= 0.7;
    
    return Math.max(baseSlippage, 0.001); // Minimum 0.1% slippage
  }

  recordTradeStart(): void {
    this.activeTrades++;
    this.dailyTrades++;
    this.lastTradeTime = Date.now();
    this.emit('trade-started', { activeTrades: this.activeTrades });
  }

  recordTradeEnd(inputAmount: string, success: boolean): void {
    this.activeTrades = Math.max(0, this.activeTrades - 1);
    
    if (success) {
      this.dailyVolume = (BigInt(this.dailyVolume) + BigInt(inputAmount)).toString();
    }
    
    this.emit('trade-ended', { 
      activeTrades: this.activeTrades, 
      success,
      dailyVolume: this.dailyVolume 
    });
  }

  addTokenToBlacklist(tokenAddress: string, reason: string): void {
    this.blacklistedTokens.add(tokenAddress.toLowerCase());
    console.log(`Token blacklisted: ${tokenAddress} - ${reason}`);
    this.emit('token-blacklisted', { tokenAddress, reason });
  }

  addProtocolToBlacklist(protocolName: string, reason: string): void {
    this.blacklistedProtocols.add(protocolName);
    console.log(`Protocol blacklisted: ${protocolName} - ${reason}`);
    this.emit('protocol-blacklisted', { protocolName, reason });
  }

  removeTokenFromBlacklist(tokenAddress: string): void {
    this.blacklistedTokens.delete(tokenAddress.toLowerCase());
    this.emit('token-whitelisted', { tokenAddress });
  }

  removeProtocolFromBlacklist(protocolName: string): void {
    this.blacklistedProtocols.delete(protocolName);
    this.emit('protocol-whitelisted', { protocolName });
  }

  getRiskStats(): {
    dailyTrades: number;
    dailyVolume: string;
    activeTrades: number;
    blacklistedTokens: number;
    blacklistedProtocols: number;
    lastTradeTime: number;
  } {
    return {
      dailyTrades: this.dailyTrades,
      dailyVolume: this.dailyVolume,
      activeTrades: this.activeTrades,
      blacklistedTokens: this.blacklistedTokens.size,
      blacklistedProtocols: this.blacklistedProtocols.size,
      lastTradeTime: this.lastTradeTime
    };
  }
}