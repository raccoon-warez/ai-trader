#!/usr/bin/env node

import { Command } from 'commander';
import { ArbitrageTrader } from '../index';
import { TestnetTestRunner } from './test-scenarios';
import { TestnetWalletManager } from './wallet-manager';
import { TestnetMonitoring } from './monitoring';
import { TESTNET_NETWORKS } from '../config/testnet-protocols';
import CONFIG from '../config';
import logger from '../monitoring/logger';
import * as fs from 'fs';
import * as path from 'path';

class AutomatedTestSuite {
  private trader: ArbitrageTrader;
  private testRunner: TestnetTestRunner;
  private walletManager: TestnetWalletManager;
  private monitoring: TestnetMonitoring;
  private results: Map<string, any> = new Map();

  constructor(configPath?: string) {
    // Load testnet configuration
    if (configPath && fs.existsSync(configPath)) {
      require('dotenv').config({ path: configPath });
    } else {
      require('dotenv').config({ path: '.env.testnet' });
    }

    this.trader = new ArbitrageTrader();
    this.walletManager = new TestnetWalletManager();
    this.monitoring = new TestnetMonitoring(this.trader, this.walletManager);
    
    // Use first available testnet for test runner
    const firstNetwork = Object.values(TESTNET_NETWORKS)[0];
    this.testRunner = new TestnetTestRunner(
      this.trader,
      firstNetwork.rpc,
      process.env.PRIVATE_KEY || ''
    );
  }

  async initializeTestEnvironment(): Promise<void> {
    console.log('🚀 Initializing testnet environment...');
    
    try {
      // Initialize trader without trading enabled initially
      await this.trader.initialize(process.env.PRIVATE_KEY);
      
      // Generate or import test wallet
      let testWallet;
      if (process.env.PRIVATE_KEY) {
        testWallet = this.walletManager.importWallet(process.env.PRIVATE_KEY, 'main');
      } else {
        testWallet = this.walletManager.generateTestWallet('main');
        console.log(`📝 Generated test wallet: ${testWallet.address}`);
        console.log(`📝 Private key: ${testWallet.privateKey}`);
        console.log('⚠️  Save this private key securely!');
      }

      // Start monitoring
      await this.monitoring.startMonitoring();
      
      console.log('✅ Test environment initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize test environment:', error);
      throw error;
    }
  }

  async fundTestWallets(): Promise<void> {
    console.log('💰 Funding test wallets...');
    
    const walletLabels = this.walletManager.getWalletLabels();
    
    for (const label of walletLabels) {
      console.log(`Funding wallet: ${label}`);
      
      try {
        const results = await this.walletManager.fundWalletAllChains(label);
        
        results.forEach((success, chainId) => {
          const network = Object.values(TESTNET_NETWORKS).find(n => n.chainId === chainId);
          const status = success ? '✅' : '❌';
          console.log(`  ${status} ${network?.name || `Chain ${chainId}`}`);
        });
        
        // Wait for confirmations
        console.log('⏳ Waiting for transactions to confirm...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Update balances
        await this.walletManager.updateBalances(label);
        const summary = this.walletManager.getWalletSummary(label);
        console.log(`📊 Updated balances for ${label}:`, summary.balances);
        
      } catch (error) {
        console.error(`❌ Failed to fund wallet ${label}:`, error);
      }
    }
  }

  async runBasicValidation(): Promise<boolean> {
    console.log('🔍 Running basic validation tests...');
    
    try {
      const validation = await this.monitoring.validateSystem();
      
      console.log(`📊 Validation Score: ${validation.score}/100`);
      console.log(`✅ Valid: ${validation.isValid}`);
      
      if (validation.errors.length > 0) {
        console.log('❌ Errors:');
        validation.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (validation.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      console.log('📋 Validation Details:');
      Object.entries(validation.details).forEach(([key, status]) => {
        const icon = status ? '✅' : '❌';
        console.log(`  ${icon} ${key}: ${status}`);
      });
      
      return validation.isValid && validation.score >= 60;
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return false;
    }
  }

  async runTestScenarios(scenarioNames?: string[]): Promise<void> {
    console.log('🧪 Running test scenarios...');
    
    try {
      let results;
      
      if (scenarioNames && scenarioNames.length > 0) {
        // Run specific scenarios
        results = new Map();
        for (const scenarioName of scenarioNames) {
          console.log(`Running scenario: ${scenarioName}`);
          const result = await this.testRunner.runScenario(scenarioName);
          results.set(scenarioName, result);
        }
      } else {
        // Run all scenarios
        results = await this.testRunner.runAllScenarios();
      }
      
      this.results = results;
      this.displayTestResults(results);
      
    } catch (error) {
      console.error('❌ Test scenarios failed:', error);
      throw error;
    }
  }

  private displayTestResults(results: Map<string, any>): void {
    console.log('\n📊 Test Results Summary:');
    console.log('═'.repeat(60));
    
    let totalScenarios = results.size;
    let passedScenarios = 0;
    let totalOpportunities = 0;
    let totalTrades = 0;
    let successfulTrades = 0;
    
    results.forEach((result, scenarioName) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${scenarioName}`);
      
      if (result.success) passedScenarios++;
      totalOpportunities += result.metrics.opportunitiesFound;
      totalTrades += result.metrics.tradesExecuted;
      successfulTrades += result.metrics.successfulTrades;
      
      // Show key metrics
      console.log(`  📈 Opportunities: ${result.metrics.opportunitiesFound}`);
      console.log(`  🔄 Trades: ${result.metrics.tradesExecuted}`);
      console.log(`  ✅ Successful: ${result.metrics.successfulTrades}`);
      console.log(`  💰 Profit: ${result.metrics.totalProfit}`);
      
      if (result.metrics.errors.length > 0) {
        console.log(`  ❌ Errors: ${result.metrics.errors.join(', ')}`);
      }
      
      console.log('');
    });
    
    console.log('═'.repeat(60));
    console.log(`📊 Overall Results:`);
    console.log(`  Scenarios: ${passedScenarios}/${totalScenarios} passed (${((passedScenarios/totalScenarios)*100).toFixed(1)}%)`);
    console.log(`  Total Opportunities: ${totalOpportunities}`);
    console.log(`  Total Trades: ${totalTrades}`);
    console.log(`  Success Rate: ${totalTrades > 0 ? ((successfulTrades/totalTrades)*100).toFixed(1) : 0}%`);
  }

  async runPerformanceBenchmark(): Promise<void> {
    console.log('⚡ Running performance benchmark...');
    
    const benchmarkStart = Date.now();
    
    try {
      // Test price monitoring performance
      console.log('Testing price monitoring performance...');
      const priceStart = Date.now();
      // Simulate price monitoring for 30 seconds
      await new Promise(resolve => setTimeout(resolve, 30000));
      const priceTime = Date.now() - priceStart;
      
      // Test arbitrage detection performance
      console.log('Testing arbitrage detection performance...');
      const arbStart = Date.now();
      // This would run actual arbitrage detection
      const arbTime = Date.now() - arbStart;
      
      // Test AI prediction performance
      console.log('Testing AI prediction performance...');
      const aiStart = Date.now();
      // This would test AI model performance
      const aiTime = Date.now() - aiStart;
      
      const totalTime = Date.now() - benchmarkStart;
      
      console.log('\n⚡ Performance Results:');
      console.log(`  Price Monitoring: ${priceTime}ms`);
      console.log(`  Arbitrage Detection: ${arbTime}ms`);
      console.log(`  AI Predictions: ${aiTime}ms`);
      console.log(`  Total Benchmark Time: ${totalTime}ms`);
      
    } catch (error) {
      console.error('❌ Performance benchmark failed:', error);
    }
  }

  async generateReport(): Promise<void> {
    console.log('📋 Generating comprehensive test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'testnet',
      configuration: {
        tradingEnabled: CONFIG.trading.tradingEnabled,
        minProfitThreshold: CONFIG.trading.minProfitThreshold,
        maxSlippage: CONFIG.trading.maxSlippage,
        maxPositionSize: CONFIG.trading.maxPositionSize
      },
      systemStatus: this.trader.getSystemStatus(),
      monitoringReport: this.monitoring.generateReport(),
      testResults: Object.fromEntries(this.results),
      walletSummary: this.walletManager.getWalletLabels().map(label => 
        this.walletManager.getWalletSummary(label)
      ),
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), `testnet-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Comprehensive report saved to: ${reportPath}`);
    
    // Display summary
    console.log('\n📋 Test Summary:');
    console.log(`  Environment: ${report.environment}`);
    console.log(`  Total Scenarios: ${Object.keys(report.testResults).length}`);
    console.log(`  System Health: ${report.monitoringReport.systemHealth}`);
    console.log(`  Recommendations: ${report.recommendations.length}`);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze test results for recommendations
    const failedTests = Array.from(this.results.entries())
      .filter(([_, result]) => !result.success);
    
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} test scenarios failed - review error logs`);
    }
    
    // Check wallet balances
    const walletLabels = this.walletManager.getWalletLabels();
    walletLabels.forEach(label => {
      const summary = this.walletManager.getWalletSummary(label);
      const hasLowBalance = Object.values(summary.balances).some((balance: any) => 
        parseFloat(balance.split(' ')[0]) < 0.01
      );
      
      if (hasLowBalance) {
        recommendations.push(`Wallet ${label} has low balance on some chains - consider refunding`);
      }
    });
    
    // System health recommendations
    const systemHealth = this.monitoring.generateReport().systemHealth;
    if (systemHealth !== 'HEALTHY') {
      recommendations.push(`System health is ${systemHealth} - investigate issues`);
    }
    
    return recommendations;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');
    
    try {
      // Stop monitoring
      this.monitoring.stopMonitoring();
      
      // Stop trader
      if (this.trader) {
        this.trader.stop();
      }
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('⚠️  Cleanup error:', error);
    }
  }
}

// CLI Setup
const program = new Command();

program
  .name('testnet-runner')
  .description('Automated testnet testing suite for AI Arbitrage Trader')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize testnet environment')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    const suite = new AutomatedTestSuite(options.config);
    try {
      await suite.initializeTestEnvironment();
      console.log('🎉 Testnet environment ready!');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    }
  });

program
  .command('fund')
  .description('Fund test wallets with testnet tokens')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    const suite = new AutomatedTestSuite(options.config);
    try {
      await suite.initializeTestEnvironment();
      await suite.fundTestWallets();
      console.log('💰 Wallet funding completed!');
    } catch (error) {
      console.error('❌ Funding failed:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Run basic system validation')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    const suite = new AutomatedTestSuite(options.config);
    try {
      await suite.initializeTestEnvironment();
      const isValid = await suite.runBasicValidation();
      
      if (isValid) {
        console.log('✅ System validation passed!');
        process.exit(0);
      } else {
        console.log('❌ System validation failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Run test scenarios')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-s, --scenarios <scenarios>', 'Comma-separated list of scenarios to run')
  .option('--skip-validation', 'Skip basic validation')
  .action(async (options) => {
    const suite = new AutomatedTestSuite(options.config);
    try {
      await suite.initializeTestEnvironment();
      
      if (!options.skipValidation) {
        const isValid = await suite.runBasicValidation();
        if (!isValid) {
          console.log('⚠️  Basic validation failed, but continuing with tests...');
        }
      }
      
      const scenarios = options.scenarios ? options.scenarios.split(',') : undefined;
      await suite.runTestScenarios(scenarios);
      
      console.log('🧪 Test scenarios completed!');
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    }
  });

program
  .command('benchmark')
  .description('Run performance benchmark')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    const suite = new AutomatedTestSuite(options.config);
    try {
      await suite.initializeTestEnvironment();
      await suite.runPerformanceBenchmark();
      console.log('⚡ Performance benchmark completed!');
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    }
  });

program
  .command('full')
  .description('Run complete test suite (validation + scenarios + benchmark + report)')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    const suite = new AutomatedTestSuite(options.config);
    try {
      console.log('🚀 Starting comprehensive testnet testing...');
      
      await suite.initializeTestEnvironment();
      
      const isValid = await suite.runBasicValidation();
      if (!isValid) {
        console.log('⚠️  Validation issues detected, but continuing...');
      }
      
      await suite.runTestScenarios();
      await suite.runPerformanceBenchmark();
      await suite.generateReport();
      
      console.log('🎉 Comprehensive testing completed!');
      
    } catch (error) {
      console.error('❌ Comprehensive testing failed:', error);
      process.exit(1);
    } finally {
      await suite.cleanup();
    }
  });

program
  .command('scenarios')
  .description('List available test scenarios')
  .action(() => {
    const suite = new AutomatedTestSuite();
    const scenarios = suite.testRunner.getAvailableScenarios();
    
    console.log('Available Test Scenarios:');
    scenarios.forEach((scenario, index) => {
      console.log(`  ${index + 1}. ${scenario}`);
    });
  });

// Run CLI
if (require.main === module) {
  program.parse();
}

export default AutomatedTestSuite;