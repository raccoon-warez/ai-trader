import { RiskManager } from '../src/trading/risk-manager';
import { ArbitrageOpportunity, Token, Pool, NetworkChain, AIModelPrediction } from '../src/types';

describe('RiskManager', () => {
  let riskManager: RiskManager;
  let mockOpportunity: ArbitrageOpportunity;
  let mockAIPrediction: AIModelPrediction;

  beforeEach(() => {
    riskManager = new RiskManager();
    
    // Create mock opportunity
    const tokenA: Token = {
      address: '0xA0b86a33E6441bF7605308D4395B2863dbDB0413',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: NetworkChain.ETHEREUM
    };

    const tokenB: Token = {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: NetworkChain.ETHEREUM
    };

    const buyPool: Pool = {
      id: '0x123',
      protocol: 'uniswap_v2',
      tokenA,
      tokenB,
      reserve0: '1000000000000',
      reserve1: '500000000000000000000',
      fee: 0.003,
      liquidity: '1000000000000000000000',
      chainId: NetworkChain.ETHEREUM
    };

    const sellPool: Pool = {
      id: '0x456',
      protocol: 'sushiswap',
      tokenA,
      tokenB,
      reserve0: '1000000000000',
      reserve1: '499000000000000000000',
      fee: 0.003,
      liquidity: '1000000000000000000000',
      chainId: NetworkChain.ETHEREUM
    };

    mockOpportunity = {
      id: 'test-opportunity',
      tokenA,
      tokenB,
      buyPool,
      sellPool,
      profitPercentage: 0.5,
      profitAmount: '1000000000000000000',
      inputAmount: '100000000000000000000',
      confidence: 0.8,
      timestamp: Date.now(),
      gasEstimate: '200000',
      executionPath: []
    };

    mockAIPrediction = {
      opportunity: mockOpportunity,
      confidence: 0.8,
      riskScore: 0.3,
      executionProbability: 0.9,
      timestamp: Date.now()
    };
  });

  describe('Risk Assessment', () => {
    test('should assess risk for opportunity', () => {
      const assessment = riskManager.assessRisk(mockOpportunity);
      
      expect(assessment).toBeDefined();
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.riskLevel).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
      expect(typeof assessment.shouldExecute).toBe('boolean');
      expect(Array.isArray(assessment.reasons)).toBe(true);
    });

    test('should assess risk with AI prediction', () => {
      const assessment = riskManager.assessRisk(mockOpportunity, mockAIPrediction);
      
      expect(assessment).toBeDefined();
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.adjustedPositionSize).toBeDefined();
      expect(assessment.maxSlippage).toBeDefined();
    });

    test('should reject high-risk opportunities', () => {
      // Create high-risk opportunity
      const highRiskOpportunity = {
        ...mockOpportunity,
        profitPercentage: 10, // Suspiciously high profit
        buyPool: {
          ...mockOpportunity.buyPool,
          liquidity: '1000' // Very low liquidity
        }
      };

      const assessment = riskManager.assessRisk(highRiskOpportunity);
      expect(assessment.riskScore).toBeGreaterThan(50);
      expect(assessment.riskLevel).toMatch(/^(HIGH|CRITICAL)$/);
    });

    test('should approve low-risk opportunities', () => {
      // Create low-risk opportunity with stablecoins
      const lowRiskOpportunity = {
        ...mockOpportunity,
        tokenA: { ...mockOpportunity.tokenA, symbol: 'USDC' },
        tokenB: { ...mockOpportunity.tokenB, symbol: 'USDT' },
        profitPercentage: 0.1,
        buyPool: {
          ...mockOpportunity.buyPool,
          protocol: 'uniswap_v2',
          liquidity: '10000000000000000000000' // High liquidity
        },
        sellPool: {
          ...mockOpportunity.sellPool,
          protocol: 'uniswap_v2', // Same protocol
          liquidity: '10000000000000000000000'
        }
      };

      const assessment = riskManager.assessRisk(lowRiskOpportunity);
      expect(assessment.riskScore).toBeLessThan(30);
      expect(assessment.shouldExecute).toBe(true);
    });
  });

  describe('Position Sizing', () => {
    test('should adjust position size based on risk', () => {
      const assessment = riskManager.assessRisk(mockOpportunity);
      
      if (assessment.adjustedPositionSize) {
        const originalSize = BigInt(mockOpportunity.inputAmount);
        const adjustedSize = BigInt(assessment.adjustedPositionSize);
        
        // Adjusted size should be less than or equal to original
        expect(adjustedSize).toBeLessThanOrEqual(originalSize);
      }
    });

    test('should reduce position size for high-risk trades', () => {
      const highRiskOpportunity = {
        ...mockOpportunity,
        profitPercentage: 5 // High profit indicates higher risk
      };

      const assessment = riskManager.assessRisk(highRiskOpportunity);
      
      if (assessment.adjustedPositionSize) {
        const originalSize = BigInt(mockOpportunity.inputAmount);
        const adjustedSize = BigInt(assessment.adjustedPositionSize);
        
        expect(adjustedSize).toBeLessThan(originalSize);
      }
    });
  });

  describe('Blacklist Management', () => {
    test('should add and remove tokens from blacklist', () => {
      const tokenAddress = '0x123456789';
      const reason = 'Test blacklisting';

      riskManager.addTokenToBlacklist(tokenAddress, reason);
      
      // Create opportunity with blacklisted token
      const blacklistedOpportunity = {
        ...mockOpportunity,
        tokenA: { ...mockOpportunity.tokenA, address: tokenAddress }
      };

      const assessment = riskManager.assessRisk(blacklistedOpportunity);
      expect(assessment.riskScore).toBeGreaterThan(90);
      expect(assessment.shouldExecute).toBe(false);

      // Remove from blacklist
      riskManager.removeTokenFromBlacklist(tokenAddress);
      
      const assessmentAfterRemoval = riskManager.assessRisk(blacklistedOpportunity);
      expect(assessmentAfterRemoval.riskScore).toBeLessThan(90);
    });

    test('should add and remove protocols from blacklist', () => {
      const protocolName = 'test_protocol';
      const reason = 'Test protocol blacklisting';

      riskManager.addProtocolToBlacklist(protocolName, reason);
      
      // Create opportunity with blacklisted protocol
      const blacklistedOpportunity = {
        ...mockOpportunity,
        buyPool: { ...mockOpportunity.buyPool, protocol: protocolName }
      };

      const assessment = riskManager.assessRisk(blacklistedOpportunity);
      expect(assessment.riskScore).toBeGreaterThan(40);

      // Remove from blacklist
      riskManager.removeProtocolFromBlacklist(protocolName);
    });
  });

  describe('Trade Tracking', () => {
    test('should track active trades', () => {
      const initialStats = riskManager.getRiskStats();
      expect(initialStats.activeTrades).toBe(0);

      riskManager.recordTradeStart();
      const statsAfterStart = riskManager.getRiskStats();
      expect(statsAfterStart.activeTrades).toBe(1);

      riskManager.recordTradeEnd('1000000000000000000', true);
      const statsAfterEnd = riskManager.getRiskStats();
      expect(statsAfterEnd.activeTrades).toBe(0);
    });

    test('should track daily volume and trades', () => {
      const initialStats = riskManager.getRiskStats();
      const initialTrades = initialStats.dailyTrades;
      const initialVolume = BigInt(initialStats.dailyVolume);

      riskManager.recordTradeStart();
      riskManager.recordTradeEnd('1000000000000000000', true);

      const finalStats = riskManager.getRiskStats();
      expect(finalStats.dailyTrades).toBe(initialTrades + 1);
      expect(BigInt(finalStats.dailyVolume)).toBeGreaterThan(initialVolume);
    });

    test('should prevent excessive concurrent trades', () => {
      // Start maximum allowed concurrent trades
      for (let i = 0; i < 3; i++) {
        riskManager.recordTradeStart();
      }

      const assessment = riskManager.assessRisk(mockOpportunity);
      expect(assessment.shouldExecute).toBe(false);
      expect(assessment.reasons.some(r => r.includes('concurrent'))).toBe(true);
    });
  });

  describe('Daily Limits', () => {
    test('should enforce daily trade limits', () => {
      // Simulate reaching daily trade limit
      for (let i = 0; i < 50; i++) {
        riskManager.recordTradeStart();
        riskManager.recordTradeEnd('1000000000000000000', true);
      }

      const assessment = riskManager.assessRisk(mockOpportunity);
      expect(assessment.shouldExecute).toBe(false);
    });
  });

  describe('Risk Statistics', () => {
    test('should provide comprehensive risk statistics', () => {
      const stats = riskManager.getRiskStats();
      
      expect(stats).toHaveProperty('dailyTrades');
      expect(stats).toHaveProperty('dailyVolume');
      expect(stats).toHaveProperty('activeTrades');
      expect(stats).toHaveProperty('blacklistedTokens');
      expect(stats).toHaveProperty('blacklistedProtocols');
      expect(stats).toHaveProperty('lastTradeTime');
      
      expect(typeof stats.dailyTrades).toBe('number');
      expect(typeof stats.dailyVolume).toBe('string');
      expect(typeof stats.activeTrades).toBe('number');
      expect(typeof stats.blacklistedTokens).toBe('number');
      expect(typeof stats.blacklistedProtocols).toBe('number');
      expect(typeof stats.lastTradeTime).toBe('number');
    });
  });
});