import CONFIG from '../src/config';
import { NetworkChain } from '../src/types';

describe('Configuration', () => {
  describe('Network Configuration', () => {
    test('should have all required network configurations', () => {
      expect(CONFIG.networks).toBeDefined();
      expect(CONFIG.networks.ethereum).toBeDefined();
      expect(CONFIG.networks.polygon).toBeDefined();
      expect(CONFIG.networks.bsc).toBeDefined();
      expect(CONFIG.networks.arbitrum).toBeDefined();
      expect(CONFIG.networks.optimism).toBeDefined();
      expect(CONFIG.networks.avalanche).toBeDefined();
    });

    test('should have correct chain IDs', () => {
      expect(CONFIG.networks.ethereum.chainId).toBe(NetworkChain.ETHEREUM);
      expect(CONFIG.networks.polygon.chainId).toBe(NetworkChain.POLYGON);
      expect(CONFIG.networks.bsc.chainId).toBe(NetworkChain.BSC);
      expect(CONFIG.networks.arbitrum.chainId).toBe(NetworkChain.ARBITRUM);
      expect(CONFIG.networks.optimism.chainId).toBe(NetworkChain.OPTIMISM);
      expect(CONFIG.networks.avalanche.chainId).toBe(NetworkChain.AVALANCHE);
    });
  });

  describe('Trading Configuration', () => {
    test('should have valid trading parameters', () => {
      expect(CONFIG.trading.minProfitThreshold).toBeGreaterThan(0);
      expect(CONFIG.trading.maxSlippage).toBeGreaterThan(0);
      expect(CONFIG.trading.maxSlippage).toBeLessThan(1);
      expect(CONFIG.trading.maxPositionSize).toBeGreaterThan(0);
      expect(typeof CONFIG.trading.tradingEnabled).toBe('boolean');
    });

    test('should have reasonable default values', () => {
      expect(CONFIG.trading.minProfitThreshold).toBeGreaterThanOrEqual(0.001); // At least 0.1%
      expect(CONFIG.trading.maxSlippage).toBeLessThanOrEqual(0.05); // Max 5%
      expect(CONFIG.trading.gasMultiplier).toBeGreaterThan(1);
    });
  });

  describe('AI Configuration', () => {
    test('should have valid AI parameters', () => {
      expect(CONFIG.ai.modelUpdateInterval).toBeGreaterThan(0);
      expect(CONFIG.ai.predictionConfidenceThreshold).toBeGreaterThan(0);
      expect(CONFIG.ai.predictionConfidenceThreshold).toBeLessThanOrEqual(1);
      expect(CONFIG.ai.batchSize).toBeGreaterThan(0);
      expect(CONFIG.ai.learningRate).toBeGreaterThan(0);
      expect(CONFIG.ai.learningRate).toBeLessThan(1);
    });
  });
});