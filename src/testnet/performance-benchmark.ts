import { ArbitrageTrader } from '../index';
import { TestnetWalletManager } from './wallet-manager';
import { TESTNET_NETWORKS } from '../config/testnet-protocols';
import { ethers } from 'ethers';
import logger from '../monitoring/logger';

export interface BenchmarkMetrics {
  name: string;
  duration: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number; // operations per second
  successRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface BenchmarkResult {
  timestamp: number;
  environment: string;
  totalDuration: number;
  metrics: BenchmarkMetrics[];
  systemInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    totalMemory: number;
    freeMemory: number;
  };
  summary: {
    totalTests: number;
    passedTests: number;
    averageThroughput: number;
    overallSuccessRate: number;
  };
}

export class PerformanceBenchmark {
  private trader: ArbitrageTrader;
  private walletManager: TestnetWalletManager;
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private benchmarkResults: BenchmarkMetrics[] = [];

  constructor(trader: ArbitrageTrader, walletManager: TestnetWalletManager) {
    this.trader = trader;
    this.walletManager = walletManager;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    Object.values(TESTNET_NETWORKS).forEach(network => {
      this.providers.set(network.chainId, new ethers.JsonRpcProvider(network.rpc));
    });
  }

  async runComprehensiveBenchmark(): Promise<BenchmarkResult> {
    console.log('🚀 Starting comprehensive performance benchmark...');
    const startTime = Date.now();
    const startCpuTime = process.cpuUsage();

    // Warm up the system
    await this.warmUpSystem();

    // Run all benchmark tests
    const metrics: BenchmarkMetrics[] = [];

    // 1. RPC Response Time Benchmark
    metrics.push(await this.benchmarkRPCResponseTime());

    // 2. Price Data Collection Benchmark
    metrics.push(await this.benchmarkPriceDataCollection());

    // 3. Protocol Query Benchmark
    metrics.push(await this.benchmarkProtocolQueries());

    // 4. Arbitrage Detection Benchmark
    metrics.push(await this.benchmarkArbitrageDetection());

    // 5. AI Prediction Benchmark
    metrics.push(await this.benchmarkAIPrediction());

    // 6. Risk Assessment Benchmark
    metrics.push(await this.benchmarkRiskAssessment());

    // 7. Gas Estimation Benchmark
    metrics.push(await this.benchmarkGasEstimation());

    // 8. Memory Usage Benchmark
    metrics.push(await this.benchmarkMemoryUsage());

    // 9. Database Operations Benchmark
    metrics.push(await this.benchmarkDatabaseOperations());

    // 10. Concurrent Operations Benchmark
    metrics.push(await this.benchmarkConcurrentOperations());

    const totalDuration = Date.now() - startTime;
    const endCpuTime = process.cpuUsage(startCpuTime);

    // Calculate summary statistics
    const summary = this.calculateSummary(metrics);

    const result: BenchmarkResult = {
      timestamp: Date.now(),
      environment: 'testnet',
      totalDuration,
      metrics,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem()
      },
      summary
    };

    console.log('✅ Performance benchmark completed');
    this.displayBenchmarkResults(result);

    return result;
  }

  private async warmUpSystem(): Promise<void> {
    console.log('🔥 Warming up system...');
    
    // Warm up RPC connections
    const warmupPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        await provider.getBlockNumber();
        await provider.getGasPrice();
      } catch (error) {
        // Ignore warm-up errors
      }
    });

    await Promise.all(warmupPromises);
    
    // Wait a bit for JIT compilation
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async benchmarkRPCResponseTime(): Promise<BenchmarkMetrics> {
    console.log('📡 Benchmarking RPC response times...');
    
    const iterations = 100;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const chainId = Array.from(this.providers.keys())[i % this.providers.size];
      const provider = this.providers.get(chainId)!;
      
      const startTime = Date.now();
      try {
        await provider.getBlockNumber();
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1); // Mark as failed
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'RPC Response Time',
      duration: Math.max(...validTimes) * iterations,
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkPriceDataCollection(): Promise<BenchmarkMetrics> {
    console.log('💰 Benchmarking price data collection...');
    
    const iterations = 50;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate price data collection
        const prices = this.trader.getCurrentPrices();
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'Price Data Collection',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkProtocolQueries(): Promise<BenchmarkMetrics> {
    console.log('🔗 Benchmarking protocol queries...');
    
    const iterations = 25;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate protocol queries
        const protocolStats = this.trader.getProtocolStats();
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'Protocol Queries',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkArbitrageDetection(): Promise<BenchmarkMetrics> {
    console.log('🔍 Benchmarking arbitrage detection...');
    
    const iterations = 10;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate arbitrage detection cycle
        const opportunities = this.trader.getRecentOpportunities(10);
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'Arbitrage Detection',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkAIPrediction(): Promise<BenchmarkMetrics> {
    console.log('🧠 Benchmarking AI predictions...');
    
    const iterations = 20;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate AI prediction
        const aiStats = this.trader.getAIStats();
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'AI Prediction',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkRiskAssessment(): Promise<BenchmarkMetrics> {
    console.log('⚖️ Benchmarking risk assessment...');
    
    const iterations = 30;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate risk assessment
        const riskMetrics = this.trader.getRiskMetrics();
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'Risk Assessment',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkGasEstimation(): Promise<BenchmarkMetrics> {
    console.log('⛽ Benchmarking gas estimation...');
    
    const iterations = 15;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate gas estimation
        const chainId = Array.from(this.providers.keys())[i % this.providers.size];
        const provider = this.providers.get(chainId)!;
        await provider.getGasPrice();
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'Gas Estimation',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkMemoryUsage(): Promise<BenchmarkMetrics> {
    console.log('💾 Benchmarking memory usage...');
    
    const iterations = 10;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate memory-intensive operations
        const largeArray = new Array(100000).fill(0).map((_, idx) => ({
          id: idx,
          data: Math.random().toString(36),
          timestamp: Date.now()
        }));
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'Memory Usage',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkDatabaseOperations(): Promise<BenchmarkMetrics> {
    console.log('🗄️ Benchmarking database operations...');
    
    const iterations = 20;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate database operations
        const systemStatus = this.trader.getSystemStatus();
        const tradingStats = this.trader.getTradingStats();
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'Database Operations',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private async benchmarkConcurrentOperations(): Promise<BenchmarkMetrics> {
    console.log('⚡ Benchmarking concurrent operations...');
    
    const iterations = 5;
    const times: number[] = [];
    let successCount = 0;

    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // Simulate concurrent operations
        const promises = Array.from(this.providers.entries()).map(async ([chainId, provider]) => {
          const [blockNumber, gasPrice] = await Promise.all([
            provider.getBlockNumber(),
            provider.getGasPrice()
          ]);
          return { chainId, blockNumber, gasPrice };
        });

        await Promise.all(promises);
        const endTime = Date.now();
        times.push(endTime - startTime);
        successCount++;
      } catch (error) {
        times.push(-1);
      }
    }

    const validTimes = times.filter(t => t > 0);
    const endMemory = process.memoryUsage();

    return {
      name: 'Concurrent Operations',
      duration: validTimes.reduce((a, b) => a + b, 0),
      iterations,
      averageTime: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: 1000 / (validTimes.reduce((a, b) => a + b, 0) / validTimes.length),
      successRate: successCount / iterations,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };
  }

  private calculateSummary(metrics: BenchmarkMetrics[]): any {
    const totalTests = metrics.length;
    const passedTests = metrics.filter(m => m.successRate > 0.8).length;
    const averageThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / totalTests;
    const overallSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / totalTests;

    return {
      totalTests,
      passedTests,
      averageThroughput,
      overallSuccessRate
    };
  }

  private displayBenchmarkResults(result: BenchmarkResult): void {
    console.log('\n⚡ Performance Benchmark Results:');
    console.log('═'.repeat(80));
    
    console.log(`📊 Summary:`);
    console.log(`  Total Duration: ${(result.totalDuration / 1000).toFixed(2)}s`);
    console.log(`  Tests Passed: ${result.summary.passedTests}/${result.summary.totalTests}`);
    console.log(`  Average Throughput: ${result.summary.averageThroughput.toFixed(2)} ops/sec`);
    console.log(`  Overall Success Rate: ${(result.summary.overallSuccessRate * 100).toFixed(1)}%`);
    
    console.log(`\n💻 System Info:`);
    console.log(`  Node.js: ${result.systemInfo.nodeVersion}`);
    console.log(`  Platform: ${result.systemInfo.platform} ${result.systemInfo.arch}`);
    console.log(`  Memory: ${(result.systemInfo.freeMemory / 1024 / 1024 / 1024).toFixed(2)}GB free / ${(result.systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB total`);
    
    console.log(`\n📈 Detailed Results:`);
    result.metrics.forEach(metric => {
      const successIcon = metric.successRate > 0.8 ? '✅' : '⚠️';
      console.log(`${successIcon} ${metric.name}:`);
      console.log(`    Average: ${metric.averageTime.toFixed(2)}ms`);
      console.log(`    Range: ${metric.minTime.toFixed(2)}ms - ${metric.maxTime.toFixed(2)}ms`);
      console.log(`    Throughput: ${metric.throughput.toFixed(2)} ops/sec`);
      console.log(`    Success Rate: ${(metric.successRate * 100).toFixed(1)}%`);
      console.log(`    Memory Impact: ${(metric.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB heap`);
    });
    
    console.log('═'.repeat(80));
  }

  async saveBenchmarkReport(result: BenchmarkResult, filePath?: string): Promise<string> {
    const reportPath = filePath || `performance-benchmark-${Date.now()}.json`;
    const fs = require('fs');
    
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
    console.log(`📊 Performance benchmark report saved to: ${reportPath}`);
    return reportPath;
  }
}

export default PerformanceBenchmark;