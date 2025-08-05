import { EventEmitter } from 'events';
import { ProtocolManager } from './protocols';
import { PriceMonitor } from './monitoring/price-monitor';
import { ArbitrageDetector } from './analytics/arbitrage-detector';
import { AIAnalyticsEngine } from './analytics/ai-engine';
import { TradingExecutionEngine } from './trading/execution-engine';
import { RiskManager } from './trading/risk-manager';
import { MonitoringDashboard } from './monitoring/dashboard';
import { ArbitrageOpportunity, Token, NetworkChain } from './types';
import { POPULAR_TOKENS } from './config/protocols';
import CONFIG from './config';
import logger from './monitoring/logger';
import { createSecureWallet } from './wallet/secure-wallet';

export class ArbitrageTrader extends EventEmitter {
  private protocolManager: ProtocolManager;
  private priceMonitor: PriceMonitor;
  private arbitrageDetector: ArbitrageDetector;
  private aiEngine: AIAnalyticsEngine;
  private executionEngine: TradingExecutionEngine;
  private riskManager: RiskManager;
  private dashboard: MonitoringDashboard;
  
  private isRunning = false;
  private recentOpportunities: ArbitrageOpportunity[] = [];
  private recentTrades: any[] = [];
  private startTime: number = 0;

  constructor() {
    super();
    
    // Initialize components
    this.protocolManager = new ProtocolManager();
    this.priceMonitor = new PriceMonitor(this.protocolManager);
    this.arbitrageDetector = new ArbitrageDetector(this.protocolManager, this.priceMonitor);
    this.aiEngine = new AIAnalyticsEngine(this.priceMonitor);
    this.executionEngine = new TradingExecutionEngine(this.protocolManager, this.aiEngine);
    this.riskManager = new RiskManager();
    this.dashboard = new MonitoringDashboard(this);

    this.setupEventListeners();
    logger.logSystemEvent('ArbitrageTrader initialized');
  }

  private setupEventListeners(): void {
    // Price monitor events
    this.priceMonitor.on('price-update', (priceData) => {
      this.emit('price-update', priceData);
      logger.logPriceUpdate(priceData);
    });

    this.priceMonitor.on('price-alert', (alert) => {
      logger.info('Price alert triggered', alert);
      this.emit('price-alert', alert);
    });

    // Arbitrage detector events
    this.arbitrageDetector.on('opportunity-found', async (opportunity) => {
      await this.handleOpportunityFound(opportunity);
    });

    this.arbitrageDetector.on('scan-completed', (stats) => {
      logger.debug('Arbitrage scan completed', stats);
    });

    // Execution engine events
    this.executionEngine.on('execution-started', (data) => {
      logger.info('Trade execution started', data);
      this.riskManager.recordTradeStart();
    });

    this.executionEngine.on('execution-success', (result) => {
      logger.logTradeExecution(result);
      this.recentTrades.unshift({ ...result, timestamp: Date.now() });
      this.riskManager.recordTradeEnd(result.actualProfit, true);
      this.emit('trade-executed', result);
    });

    this.executionEngine.on('execution-failed', (result) => {
      logger.logTradeExecution(result);
      this.recentTrades.unshift({ ...result, timestamp: Date.now() });
      this.riskManager.recordTradeEnd('0', false);
      this.emit('trade-failed', result);
    });

    // Risk manager events
    this.riskManager.on('risk-assessment', (assessment) => {
      logger.logRiskAssessment(assessment);
    });

    this.riskManager.on('token-blacklisted', (data) => {
      logger.warn('Token blacklisted', data);
    });

    this.riskManager.on('protocol-blacklisted', (data) => {
      logger.warn('Protocol blacklisted', data);
    });
  }

  async initialize(privateKey?: string): Promise<void> {
    try {
      logger.logSystemEvent('Starting system initialization');

      // Create logs directory
      await this.ensureDirectoryExists('logs');

      // Initialize AI engine
      await this.aiEngine.initialize();
      logger.info('AI engine initialized');

      // Initialize execution engine if private key provided
      if (privateKey) {
        // Create a secure wallet using the private key
        const networks = Object.values(CONFIG.networks);
        const mainNetwork = networks[0]; // Use first network as primary
        const secureWallet = await createSecureWallet(
          mainNetwork.rpcUrl,
          CONFIG.wallet.address,
          mainNetwork.chainId,
          'hardware' // or 'hsm' depending on the implementation
        );
        await this.executionEngine.initialize(secureWallet);
        logger.info('Trading execution engine initialized with secure wallet');
      } else {
        logger.warn('No private key provided - trading will be disabled');
        CONFIG.trading.tradingEnabled = false;
      }

      // Start dashboard
      this.dashboard.start();

      logger.logSystemEvent('System initialization completed');
    } catch (error) {
      logger.logError('System initialization', error as Error);
      throw error;
    }
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Attempted to start already running trader');
      return;
    }

    try {
      logger.logSystemEvent('Starting arbitrage trader');
      this.isRunning = true;
      this.startTime = Date.now();

      // Get tokens to monitor
      const tokens = this.getTokensToMonitor();
      logger.info(`Monitoring ${tokens.length} tokens across ${this.protocolManager.getSupportedChains().length} chains`);

      // Start price monitoring
      await this.priceMonitor.startMonitoring(tokens);
      logger.info('Price monitoring started');

      // Start arbitrage detection
      await this.arbitrageDetector.startScanning(tokens);
      logger.info('Arbitrage detection started');

      this.emit('trader-started');
      logger.logSystemEvent('Arbitrage trader started successfully');

    } catch (error) {
      this.isRunning = false;
      logger.logError('Start trader', error as Error);
      throw error;
    }
  }

  private getTokensToMonitor(): Token[] {
    const tokens: Token[] = [];
    
    // Add popular tokens from all supported chains
    this.protocolManager.getSupportedChains().forEach(chainId => {
      const chainTokens = POPULAR_TOKENS[chainId] || [];
      tokens.push(...chainTokens);
    });

    // Add additional tokens if configured
    // This could be extended to read from a configuration file or API

    return tokens;
  }

  private async handleOpportunityFound(opportunity: ArbitrageOpportunity): Promise<void> {
    try {
      logger.logOpportunity(opportunity);
      
      // Store opportunity
      this.recentOpportunities.unshift(opportunity);
      if (this.recentOpportunities.length > 1000) {
        this.recentOpportunities = this.recentOpportunities.slice(0, 1000);
      }

      this.emit('opportunity-found', opportunity);

      // Skip execution if trading is disabled
      if (!CONFIG.trading.tradingEnabled) {
        logger.debug('Trading disabled, skipping opportunity execution');
        return;
      }

      // Get AI prediction
      const aiPrediction = await this.aiEngine.predictOpportunity(opportunity);
      logger.debug('AI prediction received', { 
        confidence: aiPrediction.confidence,
        riskScore: aiPrediction.riskScore 
      });

      // Assess risk
      const riskAssessment = this.riskManager.assessRisk(opportunity, aiPrediction);
      
      if (!riskAssessment.shouldExecute) {
        logger.info('Opportunity rejected by risk manager', {
          opportunityId: opportunity.id,
          riskScore: riskAssessment.riskScore,
          reasons: riskAssessment.reasons
        });
        return;
      }

      // Estimate gas costs
      const gasCosts = await this.executionEngine.estimateGasCosts(opportunity);
      if (!gasCosts.isStillProfitable) {
        logger.info('Opportunity not profitable after gas costs', {
          opportunityId: opportunity.id,
          profitAfterGas: gasCosts.profitAfterGas
        });
        return;
      }

      // Execute the trade
      logger.info('Executing opportunity', {
        opportunityId: opportunity.id,
        profitPercentage: opportunity.profitPercentage,
        adjustedPositionSize: riskAssessment.adjustedPositionSize
      });

      // Adjust opportunity based on risk assessment
      if (riskAssessment.adjustedPositionSize && 
          riskAssessment.adjustedPositionSize !== opportunity.inputAmount) {
        opportunity.inputAmount = riskAssessment.adjustedPositionSize;
        // Recalculate execution path with new amount
        // This is simplified - in practice you'd need to re-quote
      }

      await this.executionEngine.executeOpportunity(opportunity);

    } catch (error) {
      logger.logError('Handle opportunity', error as Error);
    }
  }

  stop(): void {
    if (!this.isRunning) {
      logger.warn('Attempted to stop already stopped trader');
      return;
    }

    logger.logSystemEvent('Stopping arbitrage trader');
    this.isRunning = false;

    // Stop components
    this.arbitrageDetector.stopScanning();
    this.priceMonitor.stopMonitoring();

    this.emit('trader-stopped');
    logger.logSystemEvent('Arbitrage trader stopped');
  }

  emergencyStop(): void {
    logger.logSystemEvent('EMERGENCY STOP TRIGGERED');
    
    // Immediately stop all activities
    this.stop();
    
    // Disable trading
    CONFIG.trading.tradingEnabled = false;
    
    // Clear any pending operations
    this.recentOpportunities = [];
    
    this.emit('emergency-stop');
    logger.logSystemEvent('Emergency stop completed');
  }

  // Dashboard API methods
  getSystemStatus(): any {
    const uptime = this.startTime > 0 ? Date.now() - this.startTime : 0;
    const protocolStats = this.protocolManager.getProtocolNames();
    const priceStats = this.priceMonitor.getMonitoringStats();
    const scanStats = this.arbitrageDetector.getScanningStats();
    const executionStats = this.executionEngine.getExecutionStats();

    return {
      isRunning: this.isRunning,
      uptime,
      tradingEnabled: CONFIG.trading.tradingEnabled,
      protocolsSupported: protocolStats.length,
      chainsSupported: this.protocolManager.getSupportedChains().length,
      tokensMonitored: priceStats.tokensMonitored,
      opportunitiesFound: this.recentOpportunities.length,
      successfulTrades: executionStats.successfulExecutions,
      totalProfit: executionStats.totalProfit,
      lastScan: scanStats.lastScanTime,
      lastPriceUpdate: priceStats.lastUpdate
    };
  }

  getTradingStats(): any {
    const executionStats = this.executionEngine.getExecutionStats();
    const riskStats = this.riskManager.getRiskStats();

    return {
      ...executionStats,
      ...riskStats,
      profitability: executionStats.totalExecutions > 0 ? 
        executionStats.successfulExecutions / executionStats.totalExecutions : 0
    };
  }

  getRecentOpportunities(limit: number = 50): ArbitrageOpportunity[] {
    return this.recentOpportunities.slice(0, limit);
  }

  getRecentTrades(limit: number = 50): any[] {
    return this.recentTrades.slice(0, limit);
  }

  getCurrentPrices(): any {
    return Object.fromEntries(this.priceMonitor.getAllPrices());
  }

  getRiskMetrics(): any {
    return this.riskManager.getRiskStats();
  }

  getAIStats(): any {
    return this.aiEngine.getModelStats();
  }

  getProtocolStats(): any {
    return {
      protocols: this.protocolManager.getProtocolNames(),
      chains: this.protocolManager.getSupportedChains(),
      totalProtocols: this.protocolManager.getAllProtocols().length
    };
  }

  // Training methods
  async trainAIModel(historicalData: any[]): Promise<void> {
    // This would be called periodically with historical trade data
    // For now, we'll create some mock training data
    const opportunities = historicalData.map(data => data.opportunity);
    const outcomes = historicalData.map(data => [
      data.success ? 1 : 0,
      data.riskScore || 0.5,
      data.executionProbability || 0.5
    ]);

    await this.aiEngine.trainModel(opportunities, outcomes);
  }

  async shutdown(): Promise<void> {
    logger.logSystemEvent('Shutting down arbitrage trader');
    
    this.stop();
    this.dashboard.stop();
    this.aiEngine.dispose();
    
    logger.logSystemEvent('Shutdown completed');
  }
}

// CLI interface
async function main() {
  const trader = new ArbitrageTrader();

  // Handle process signals
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await trader.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await trader.shutdown();
    process.exit(0);
  });

  try {
    // Initialize with private key from environment
    if (CONFIG.wallet.privateKey) {
      await trader.initialize(CONFIG.wallet.privateKey);
    } else {
      await trader.initialize();
    }
    
    // Start trading if enabled
    if (CONFIG.trading.tradingEnabled) {
      await trader.start();
      console.log('🤖 AI Arbitrage Trader started successfully!');
      console.log(`📊 Dashboard: http://localhost:${CONFIG.server.port}`);
    } else {
      console.log('🤖 AI Arbitrage Trader initialized in monitoring mode');
      console.log(`📊 Dashboard: http://localhost:${CONFIG.server.port}`);
    }

  } catch (error) {
    console.error('❌ Failed to start trader:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default ArbitrageTrader;
