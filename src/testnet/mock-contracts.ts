import { ethers } from 'ethers';
import { Token } from '../types';

// Mock ERC20 Token Contract for Testing
export const MOCK_ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  
  // Additional functions for testing
  'function mint(address to, uint256 amount) returns (bool)',
  'function burn(uint256 amount) returns (bool)',
  'function faucet() payable'
];

// Mock Uniswap V2 Pair ABI
export const MOCK_PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function sync() external',
  
  // Mock functions for testing
  'function setReserves(uint112 reserve0, uint112 reserve1) external',
  'function simulateSwap(uint256 amountIn, bool token0to1) external view returns (uint256 amountOut)'
];

// Mock Router ABI
export const MOCK_ROUTER_ABI = [
  'function factory() external pure returns (address)',
  'function WETH() external pure returns (address)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  
  // Mock functions
  'function setSlippage(uint256 slippageBps) external',
  'function simulateSwap(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

export class MockTokenManager {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private deployedTokens: Map<string, string> = new Map();

  constructor(provider: ethers.JsonRpcProvider, privateKey: string) {
    this.provider = provider;
    this.signer = new ethers.Wallet(privateKey, provider);
  }

  // Deploy mock ERC20 token for testing
  async deployMockToken(
    name: string,
    symbol: string,
    decimals: number = 18,
    initialSupply: string = '1000000'
  ): Promise<string> {
    const mockTokenBytecode = this.getMockTokenBytecode();
    
    const factory = new ethers.ContractFactory(
      MOCK_ERC20_ABI,
      mockTokenBytecode,
      this.signer
    );

    const initialSupplyWei = ethers.parseUnits(initialSupply, decimals);
    const contract = await factory.deploy(name, symbol, decimals, initialSupplyWei);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    this.deployedTokens.set(symbol, address);
    
    console.log(`Mock token ${symbol} deployed at: ${address}`);
    return address;
  }

  // Create a mock trading pair with artificial reserves
  async createMockPair(
    token0Address: string,
    token1Address: string,
    reserve0: string,
    reserve1: string
  ): Promise<string> {
    const mockPairBytecode = this.getMockPairBytecode();
    
    const factory = new ethers.ContractFactory(
      MOCK_PAIR_ABI,
      mockPairBytecode,
      this.signer
    );

    const contract = await factory.deploy(token0Address, token1Address);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    
    // Set initial reserves
    await contract.setReserves(reserve0, reserve1);
    
    console.log(`Mock pair created at: ${address}`);
    return address;
  }

  // Fund a wallet with mock tokens for testing
  async fundWallet(walletAddress: string, tokenSymbol: string, amount: string): Promise<void> {
    const tokenAddress = this.deployedTokens.get(tokenSymbol);
    if (!tokenAddress) {
      throw new Error(`Mock token ${tokenSymbol} not found`);
    }

    const contract = new ethers.Contract(tokenAddress, MOCK_ERC20_ABI, this.signer);
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    await contract.mint(walletAddress, amountWei);
    console.log(`Funded ${walletAddress} with ${amount} ${tokenSymbol}`);
  }

  // Create arbitrage opportunity by setting different prices on different pairs
  async createArbitrageOpportunity(
    tokenA: string,
    tokenB: string,
    pair1Address: string,
    pair2Address: string,
    priceDifferencePercent: number
  ): Promise<void> {
    const pair1 = new ethers.Contract(pair1Address, MOCK_PAIR_ABI, this.signer);
    const pair2 = new ethers.Contract(pair2Address, MOCK_PAIR_ABI, this.signer);

    const baseReserve0 = ethers.parseUnits('1000', 18);
    const baseReserve1 = ethers.parseUnits('1000', 18);

    // Set reserves for pair 1 (normal price)
    await pair1.setReserves(baseReserve0, baseReserve1);

    // Set reserves for pair 2 (different price)
    const adjustedReserve = baseReserve1 * BigInt(100 - priceDifferencePercent) / 100n;
    await pair2.setReserves(baseReserve0, adjustedReserve);

    console.log(`Created arbitrage opportunity: ${priceDifferencePercent}% price difference`);
  }

  private getMockTokenBytecode(): string {
    // This would contain the actual bytecode for a mock ERC20 contract
    // For testing purposes, we'll use a simplified version
    return '0x608060405234801561001057600080fd5b50...'; // Placeholder
  }

  private getMockPairBytecode(): string {
    // Mock pair contract bytecode
    return '0x608060405234801561001057600080fd5b50...'; // Placeholder
  }

  getDeployedTokens(): Map<string, string> {
    return new Map(this.deployedTokens);
  }
}

// Mock price feed for testing
export class MockPriceFeed {
  private prices: Map<string, number> = new Map();
  private volatility: Map<string, number> = new Map();

  constructor() {
    // Initialize with some test prices
    this.prices.set('WETH', 2000);
    this.prices.set('USDC', 1);
    this.prices.set('USDT', 1);
    this.prices.set('DAI', 1);
    this.prices.set('WMATIC', 0.8);
    this.prices.set('WBNB', 300);
    this.prices.set('WAVAX', 15);
  }

  setPrice(symbol: string, price: number): void {
    this.prices.set(symbol, price);
  }

  getPrice(symbol: string): number {
    return this.prices.get(symbol) || 0;
  }

  // Simulate price movement
  simulatePriceMovement(symbol: string, changePercent: number): void {
    const currentPrice = this.getPrice(symbol);
    const newPrice = currentPrice * (1 + changePercent / 100);
    this.setPrice(symbol, newPrice);
  }

  // Add random volatility
  addVolatility(symbol: string, volatilityPercent: number): void {
    this.volatility.set(symbol, volatilityPercent);
    
    setInterval(() => {
      const currentPrice = this.getPrice(symbol);
      const randomChange = (Math.random() - 0.5) * 2 * volatilityPercent;
      const newPrice = currentPrice * (1 + randomChange / 100);
      this.setPrice(symbol, newPrice);
    }, 1000); // Update every second
  }

  getAllPrices(): Map<string, number> {
    return new Map(this.prices);
  }
}

// Mock liquidity pool for testing different scenarios
export class MockLiquidityPool {
  private reserves: { token0: bigint; token1: bigint };
  private fee: number;
  
  constructor(
    reserve0: string,
    reserve1: string,
    fee: number = 0.003
  ) {
    this.reserves = {
      token0: BigInt(reserve0),
      token1: BigInt(reserve1)
    };
    this.fee = fee;
  }

  // Calculate output amount for a given input (with fee)
  getAmountOut(amountIn: bigint, token0to1: boolean): bigint {
    const amountInWithFee = amountIn * BigInt(Math.floor((1 - this.fee) * 1000)) / 1000n;
    
    if (token0to1) {
      const numerator = amountInWithFee * this.reserves.token1;
      const denominator = this.reserves.token0 + amountInWithFee;
      return numerator / denominator;
    } else {
      const numerator = amountInWithFee * this.reserves.token0;
      const denominator = this.reserves.token1 + amountInWithFee;
      return numerator / denominator;
    }
  }

  // Simulate a swap (updates reserves)
  swap(amountIn: bigint, token0to1: boolean): bigint {
    const amountOut = this.getAmountOut(amountIn, token0to1);
    
    if (token0to1) {
      this.reserves.token0 += amountIn;
      this.reserves.token1 -= amountOut;
    } else {
      this.reserves.token1 += amountIn;
      this.reserves.token0 -= amountOut;
    }
    
    return amountOut;
  }

  getReserves(): { token0: bigint; token1: bigint } {
    return { ...this.reserves };
  }

  // Calculate price impact
  getPriceImpact(amountIn: bigint, token0to1: boolean): number {
    const amountOut = this.getAmountOut(amountIn, token0to1);
    const currentPrice = token0to1 
      ? this.reserves.token1 / this.reserves.token0
      : this.reserves.token0 / this.reserves.token1;
    
    const executionPrice = token0to1
      ? amountOut / amountIn
      : amountIn / amountOut;
    
    const priceImpact = Math.abs(Number(currentPrice - executionPrice)) / Number(currentPrice);
    return priceImpact * 100; // Return as percentage
  }
}

export default {
  MockTokenManager,
  MockPriceFeed,
  MockLiquidityPool,
  MOCK_ERC20_ABI,
  MOCK_PAIR_ABI,
  MOCK_ROUTER_ABI
};