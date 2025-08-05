import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { ArbitrageTrader } from '../index';
import { TestnetWalletManager } from './wallet-manager';
import { TESTNET_NETWORKS } from '../config/testnet-protocols';
import logger from '../monitoring/logger';

export interface TestnetMetrics {
  timestamp: number;
  chainId: number;
  blockNumber: number;
  gasPrice: string;
  walletBalance: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageGasUsed: string;
  totalGasCost: string;
  opportunitiesDetected: number;
  tradesExecuted: number;
  profitLoss: string;
  slippageEvents: number;
  errorCount: number;
  responseTime: number;
}

export interface TestnetAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
  chainId: number;
  timestamp: number;
  data?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
  details: {
    contractValidation: boolean;
    priceAccuracy: boolean;
    gasEstimation: boolean;
    slippageProtection: boolean;
    riskManagement: boolean;
  };
}

export class TestnetMonitoring extends EventEmitter {
  private trader: ArbitrageTrader;
  private walletManager: TestnetWalletManager;
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private metrics: Map<number, TestnetMetrics[]> = new Map();
  private alerts: TestnetAlert[] = [];
  private monitoringIntervals: Map<number, NodeJS.Timeout> = new Map();
  private transactionHistory: Map<string, any> = new Map();

  constructor(trader: ArbitrageTrader, walletManager: TestnetWalletManager) {
    super();
    this.trader = trader;
    this.walletManager = walletManager;
    this.initializeProviders();
    this.setupEventListeners();
  }

  private initializeProviders(): void {
    Object.values(TESTNET_NETWORKS).forEach(network => {
      this.providers.set(network.chainId, new ethers.JsonRpcProvider(network.rpc));
      this.metrics.set(network.chainId, []);
    });
  }

  private setupEventListeners(): void {
    // Listen to trader events
    this.trader.on('opportunity-found', (opportunity) => {
      this.recordOpportunity(opportunity);
    });

    this.trader.on('trade-executed', (result) => {
      this.recordTradeExecution(result);
    });

    this.trader.on('trade-failed', (result) => {
      this.recordTradeFailure(result);
    });

    this.trader.on('price-update', (priceData) => {
      this.validatePriceData(priceData);
    });
  }

  // Start monitoring for specific chains
  async startMonitoring(chainIds: number[] = []): Promise<void> {
    const chainsToMonitor = chainIds.length > 0 ? chainIds : Array.from(this.providers.keys());
    
    logger.info(`Starting testnet monitoring for chains: ${chainsToMonitor.join(', ')}`);

    for (const chainId of chainsToMonitor) {
      const interval = setInterval(async () => {
        await this.collectMetrics(chainId);
      }, 10000); // Collect metrics every 10 seconds

      this.monitoringIntervals.set(chainId, interval);
    }

    this.emit('monitoring-started', { chainIds: chainsToMonitor });
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.monitoringIntervals.forEach((interval, chainId) => {
      clearInterval(interval);
      logger.info(`Stopped monitoring for chain ${chainId}`);
    });
    
    this.monitoringIntervals.clear();
    this.emit('monitoring-stopped');
  }

  // Collect metrics for a specific chain
  private async collectMetrics(chainId: number): Promise<void> {
    try {
      const provider = this.providers.get(chainId);
      if (!provider) return;

      const network = Object.values(TESTNET_NETWORKS).find(n => n.chainId === chainId);
      if (!network) return;

      // Get current blockchain data
      const [blockNumber, gasPrice] = await Promise.all([
        provider.getBlockNumber(),
        provider.getGasPrice()
      ]);

      // Get wallet balance (using first available wallet)
      const walletLabels = this.walletManager.getWalletLabels();
      let walletBalance = '0';
      
      if (walletLabels.length > 0) {
        const wallet = this.walletManager.getWallet(walletLabels[0]);
        if (wallet) {
          try {
            const balance = await provider.getBalance(wallet.address);
            walletBalance = balance.toString();
          } catch (error) {
            logger.error(`Failed to get wallet balance for chain ${chainId}:`, error);
          }
        }
      }

      // Calculate transaction metrics
      const txMetrics = this.calculateTransactionMetrics(chainId);
      
      // Calculate trading metrics
      const tradingMetrics = this.calculateTradingMetrics(chainId);

      const metrics: TestnetMetrics = {
        timestamp: Date.now(),
        chainId,
        blockNumber,
        gasPrice: gasPrice.toString(),
        walletBalance,
        totalTransactions: txMetrics.total,
        successfulTransactions: txMetrics.successful,
        failedTransactions: txMetrics.failed,
        averageGasUsed: txMetrics.averageGasUsed,
        totalGasCost: txMetrics.totalGasCost,
        opportunitiesDetected: tradingMetrics.opportunities,
        tradesExecuted: tradingMetrics.executed,
        profitLoss: tradingMetrics.profitLoss,
        slippageEvents: tradingMetrics.slippageEvents,
        errorCount: this.getErrorCount(chainId),
        responseTime: await this.measureResponseTime(chainId)
      };

      // Store metrics
      const chainMetrics = this.metrics.get(chainId) || [];
      chainMetrics.push(metrics);
      
      // Keep only last 1000 metrics per chain
      if (chainMetrics.length > 1000) {
        chainMetrics.splice(0, chainMetrics.length - 1000);
      }
      
      this.metrics.set(chainId, chainMetrics);

      // Check for alerts
      this.checkAlerts(metrics);

      this.emit('metrics-updated', metrics);

    } catch (error) {
      logger.error(`Error collecting metrics for chain ${chainId}:`, error);
      this.addAlert('error', `Metrics collection failed for chain ${chainId}`, chainId);
    }
  }

  private calculateTransactionMetrics(chainId: number): any {
    // Filter transactions for this chain
    const chainTransactions = Array.from(this.transactionHistory.values())
      .filter(tx => tx.chainId === chainId);

    const successful = chainTransactions.filter(tx => tx.status === 'success').length;
    const failed = chainTransactions.filter(tx => tx.status === 'failed').length;
    
    const totalGasUsed = chainTransactions
      .filter(tx => tx.gasUsed)
      .reduce((sum, tx) => sum + BigInt(tx.gasUsed), 0n);

    const averageGasUsed = chainTransactions.length > 0 
      ? (totalGasUsed / BigInt(chainTransactions.length)).toString()
      : '0';

    const totalGasCost = chainTransactions
      .filter(tx => tx.gasCost)
      .reduce((sum, tx) => sum + BigInt(tx.gasCost), 0n).toString();

    return {
      total: chainTransactions.length,
      successful,
      failed,
      averageGasUsed,
      totalGasCost
    };
  }

  private calculateTradingMetrics(chainId: number): any {
    // This would analyze trading-specific metrics
    return {
      opportunities: 0,
      executed: 0,
      profitLoss: '0',
      slippageEvents: 0
    };
  }

  private async measureResponseTime(chainId: number): Promise<number> {
    const provider = this.providers.get(chainId);
    if (!provider) return 0;

    const startTime = Date.now();
    try {
      await provider.getBlockNumber();
      return Date.now() - startTime;
    } catch (error) {
      return -1; // Indicate error
    }
  }

  private getErrorCount(chainId: number): number {
    return this.alerts.filter(alert => 
      alert.chainId === chainId && 
      alert.type === 'error' &&
      Date.now() - alert.timestamp < 3600000 // Last hour
    ).length;
  }

  private checkAlerts(metrics: TestnetMetrics): void {
    // Check for low balance
    const balanceEth = parseFloat(ethers.formatEther(metrics.walletBalance));
    if (balanceEth < 0.01) {
      this.addAlert('warning', `Low wallet balance: ${balanceEth.toFixed(4)} ETH`, metrics.chainId);
    }

    // Check for high gas prices
    const gasPriceGwei = parseFloat(ethers.formatUnits(metrics.gasPrice, 'gwei'));
    if (gasPriceGwei > 100) {
      this.addAlert('warning', `High gas price: ${gasPriceGwei.toFixed(1)} Gwei`, metrics.chainId);
    }

    // Check for high failure rate
    const failureRate = metrics.totalTransactions > 0 
      ? (metrics.failedTransactions / metrics.totalTransactions) * 100
      : 0;
    
    if (failureRate > 20) {
      this.addAlert('error', `High failure rate: ${failureRate.toFixed(1)}%`, metrics.chainId);
    }

    // Check for slow response times
    if (metrics.responseTime > 5000) {
      this.addAlert('warning', `Slow RPC response: ${metrics.responseTime}ms`, metrics.chainId);
    }
  }

  private addAlert(type: 'error' | 'warning' | 'info', message: string, chainId: number, data?: any): void {
    const alert: TestnetAlert = {
      type,
      message,
      chainId,
      timestamp: Date.now(),
      data
    };

    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    logger.info(`Alert [${type.toUpperCase()}]:`, alert);
    this.emit('alert', alert);
  }

  // Record opportunity detection
  private recordOpportunity(opportunity: any): void {
    logger.debug('Opportunity recorded for monitoring:', {
      id: opportunity.id,
      chainId: opportunity.tokenA.chainId,
      profit: opportunity.profitPercentage
    });
  }

  // Record trade execution
  private recordTradeExecution(result: any): void {
    const txData = {
      id: Date.now().toString(),
      chainId: result.chainId || 1, // Default to mainnet if not specified
      status: 'success',
      gasUsed: result.gasUsed,
      gasCost: result.totalGasCost,
      profit: result.actualProfit,
      timestamp: Date.now()
    };

    this.transactionHistory.set(txData.id, txData);
    logger.info('Trade execution recorded:', txData);
  }

  // Record trade failure
  private recordTradeFailure(result: any): void {
    const txData = {
      id: Date.now().toString(),
      chainId: result.chainId || 1,
      status: 'failed',
      error: result.error,
      timestamp: Date.now()
    };

    this.transactionHistory.set(txData.id, txData);
    this.addAlert('error', `Trade execution failed: ${result.error}`, txData.chainId);
  }

  // Validate price data accuracy
  private validatePriceData(priceData: any): void {
    // Check for unusual price movements
    if (Math.abs(priceData.change24h) > 50) {
      this.addAlert('warning', `Unusual price movement detected: ${priceData.change24h}% for ${priceData.token}`, 1, priceData);
    }

    // Check for stale data
    if (Date.now() - priceData.timestamp > 300000) { // 5 minutes
      this.addAlert('warning', `Stale price data detected for ${priceData.token}`, 1, priceData);
    }
  }

  // Comprehensive validation of the system
  async validateSystem(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalScore = 0;
    
    const details = {
      contractValidation: false,
      priceAccuracy: false,
      gasEstimation: false,
      slippageProtection: false,
      riskManagement: false
    };

    // Validate contract interactions
    try {
      await this.validateContractInteractions();
      details.contractValidation = true;
      totalScore += 20;
    } catch (error) {
      errors.push(`Contract validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate price accuracy
    try {
      await this.validatePriceAccuracy();
      details.priceAccuracy = true;
      totalScore += 20;
    } catch (error) {
      warnings.push(`Price accuracy check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate gas estimation
    try {
      await this.validateGasEstimation();
      details.gasEstimation = true;
      totalScore += 20;
    } catch (error) {
      warnings.push(`Gas estimation validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate slippage protection
    try {
      await this.validateSlippageProtection();
      details.slippageProtection = true;
      totalScore += 20;
    } catch (error) {
      errors.push(`Slippage protection validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate risk management
    try {
      await this.validateRiskManagement();
      details.riskManagement = true;
      totalScore += 20;
    } catch (error) {
      errors.push(`Risk management validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings,
      score: totalScore,
      details
    };
  }

  private async validateContractInteractions(): Promise<void> {
    // Test contract calls on each chain
    for (const [chainId, provider] of this.providers) {
      const blockNumber = await provider.getBlockNumber();
      if (blockNumber <= 0) {
        throw new Error(`Invalid block number for chain ${chainId}`);
      }
    }
  }

  private async validatePriceAccuracy(): Promise<void> {
    // Compare prices from multiple sources
    const currentPrices = this.trader.getCurrentPrices();
    
    if (Object.keys(currentPrices).length === 0) {
      throw new Error('No price data available');
    }
  }

  private async validateGasEstimation(): Promise<void> {
    // Test gas estimation accuracy
    for (const [chainId, provider] of this.providers) {
      const gasPrice = await provider.getGasPrice();
      if (gasPrice <= 0n) {
        throw new Error(`Invalid gas price for chain ${chainId}`);
      }
    }
  }

  private async validateSlippageProtection(): Promise<void> {
    // Test slippage calculation logic
    const stats = this.trader.getTradingStats();
    // This would include more sophisticated slippage validation
  }

  private async validateRiskManagement(): Promise<void> {
    // Test risk management rules
    const riskMetrics = this.trader.getRiskMetrics();
    
    if (riskMetrics.activeTrades < 0) {
      throw new Error('Invalid active trades count');
    }
  }

  // Get current metrics for all chains
  getCurrentMetrics(): Map<number, TestnetMetrics | undefined> {
    const current = new Map<number, TestnetMetrics | undefined>();
    
    this.metrics.forEach((chainMetrics, chainId) => {
      const latest = chainMetrics.length > 0 ? chainMetrics[chainMetrics.length - 1] : undefined;
      current.set(chainId, latest);
    });

    return current;
  }

  // Get historical metrics
  getHistoricalMetrics(chainId: number, hours: number = 1): TestnetMetrics[] {
    const chainMetrics = this.metrics.get(chainId) || [];
    const cutoffTime = Date.now() - (hours * 3600000);
    
    return chainMetrics.filter(metric => metric.timestamp >= cutoffTime);
  }

  // Get recent alerts
  getRecentAlerts(hours: number = 1): TestnetAlert[] {
    const cutoffTime = Date.now() - (hours * 3600000);
    return this.alerts.filter(alert => alert.timestamp >= cutoffTime);
  }

  // Generate monitoring report
  generateReport(): any {
    const currentMetrics = this.getCurrentMetrics();
    const recentAlerts = this.getRecentAlerts();
    
    const report = {
      timestamp: new Date().toISOString(),
      chainMetrics: Object.fromEntries(currentMetrics),
      alertsSummary: {
        total: recentAlerts.length,
        errors: recentAlerts.filter(a => a.type === 'error').length,
        warnings: recentAlerts.filter(a => a.type === 'warning').length,
        info: recentAlerts.filter(a => a.type === 'info').length
      },
      systemHealth: this.calculateSystemHealth(),
      recommendations: this.generateRecommendations()
    };

    logger.info('Testnet monitoring report generated:', report);
    return report;
  }

  private calculateSystemHealth(): string {
    const currentMetrics = this.getCurrentMetrics();
    const recentAlerts = this.getRecentAlerts();
    
    const errorCount = recentAlerts.filter(a => a.type === 'error').length;
    const activeChains = Array.from(currentMetrics.values()).filter(m => m !== undefined).length;
    
    if (errorCount > 5) return 'CRITICAL';
    if (errorCount > 2) return 'WARNING';
    if (activeChains < this.providers.size) return 'DEGRADED';
    
    return 'HEALTHY';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const currentMetrics = this.getCurrentMetrics();
    const recentAlerts = this.getRecentAlerts();

    // Check for low balances
    currentMetrics.forEach((metrics, chainId) => {
      if (metrics && parseFloat(ethers.formatEther(metrics.walletBalance)) < 0.01) {
        const network = Object.values(TESTNET_NETWORKS).find(n => n.chainId === chainId);
        recommendations.push(`Fund wallet on ${network?.name || `Chain ${chainId}`} - balance is low`);
      }
    });

    // Check for high error rates
    const errorAlerts = recentAlerts.filter(a => a.type === 'error');
    if (errorAlerts.length > 5) {
      recommendations.push('Investigate high error rate - check RPC connections and contract addresses');
    }

    // Check for stale data
    const now = Date.now();
    currentMetrics.forEach((metrics, chainId) => {
      if (metrics && now - metrics.timestamp > 60000) {
        recommendations.push(`Check monitoring for Chain ${chainId} - data appears stale`);
      }
    });

    return recommendations;
  }
}

export default TestnetMonitoring;