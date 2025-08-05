export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
}

export interface Pool {
  id: string;
  protocol: string;
  tokenA: Token;
  tokenB: Token;
  reserve0: string;
  reserve1: string;
  fee: number;
  liquidity: string;
  chainId: number;
}

export interface ArbitrageOpportunity {
  id: string;
  tokenA: Token;
  tokenB: Token;
  buyPool: Pool;
  sellPool: Pool;
  profitPercentage: number;
  profitAmount: string;
  inputAmount: string;
  confidence: number;
  timestamp: number;
  gasEstimate: string;
  executionPath: TradeStep[];
}

export interface TradeStep {
  protocol: string;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOutMin: string;
  pool: Pool;
  route: string[];
}

export interface PriceData {
  token: string;
  price: number;
  volume24h: number;
  change24h: number;
  timestamp: number;
  source: string;
}

export interface ProtocolConfig {
  name: string;
  chainId: number;
  factoryAddress: string;
  routerAddress: string;
  quoterAddress?: string;
  graphEndpoint?: string;
  rpcUrl: string;
  blockTime: number;
  gasPrice: string;
}

export interface TradingConfig {
  minProfitThreshold: number;
  maxSlippage: number;
  maxPositionSize: number;
  tradingEnabled: boolean;
  gasMultiplier: number;
  maxGasPrice: string;
}

export interface AIModelPrediction {
  opportunity: ArbitrageOpportunity;
  confidence: number;
  riskScore: number;
  executionProbability: number;
  timestamp: number;
}

export enum ProtocolType {
  UNISWAP_V2 = 'uniswap_v2',
  UNISWAP_V3 = 'uniswap_v3',
  SUSHISWAP = 'sushiswap',
  PANCAKESWAP = 'pancakeswap',
  QUICKSWAP = 'quickswap',
  BALANCER = 'balancer',
  CURVE = 'curve',
  AAVE = 'aave',
  COMPOUND = 'compound'
}

export enum NetworkChain {
  ETHEREUM = 1,
  POLYGON = 137,
  BSC = 56,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  AVALANCHE = 43114
}