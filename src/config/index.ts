import dotenv from 'dotenv';
import { TradingConfig } from '../types';

dotenv.config();

export const CONFIG = {
  networks: {
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      chainId: 1,
      name: 'ethereum'
    },
    polygon: {
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      chainId: 137,
      name: 'polygon'
    },
    bsc: {
      rpcUrl: process.env.BSC_RPC_URL || '',
      chainId: 56,
      name: 'bsc'
    },
    arbitrum: {
      rpcUrl: process.env.ARBITRUM_RPC_URL || '',
      chainId: 42161,
      name: 'arbitrum'
    },
    optimism: {
      rpcUrl: process.env.OPTIMISM_RPC_URL || '',
      chainId: 10,
      name: 'optimism'
    },
    avalanche: {
      rpcUrl: process.env.AVALANCHE_RPC_URL || '',
      chainId: 43114,
      name: 'avalanche'
    }
  },
  
  wallet: {
    // NOTE: Private key should be handled by secure wallet implementation
    // This is only for backward compatibility and should not be used directly
    privateKey: process.env.PRIVATE_KEY || '',
    address: process.env.WALLET_ADDRESS || ''
  },
  
  apis: {
    coingecko: process.env.COINGECKO_API_KEY || '',
    defipulse: process.env.DEFIPULSE_API_KEY || '',
    moralis: process.env.MORALIS_API_KEY || ''
  },
  
  database: {
    mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_trader',
    redis: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  trading: {
    minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.005'),
    maxSlippage: parseFloat(process.env.MAX_SLIPPAGE || '0.02'),
    maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '1000'),
    tradingEnabled: process.env.TRADING_ENABLED === 'true',
    gasMultiplier: 1.2,
    maxGasPrice: process.env.MAX_GAS_PRICE || '100000000000'
  } as TradingConfig,
  
  ai: {
    modelUpdateInterval: parseInt(process.env.MODEL_UPDATE_INTERVAL || '3600000'),
    predictionConfidenceThreshold: parseFloat(process.env.PREDICTION_CONFIDENCE_THRESHOLD || '0.75'),
    batchSize: 32,
    learningRate: 0.001
  },
  
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: true,
    alertWebhook: process.env.ALERT_WEBHOOK || ''
  }
};

export default CONFIG;
