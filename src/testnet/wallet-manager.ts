import { ethers } from 'ethers';
import { TESTNET_NETWORKS } from '../config/testnet-protocols';
import logger from '../monitoring/logger';
import axios from 'axios';

export interface TestnetWallet {
  address: string;
  privateKey: string;
  mnemonic?: string;
  chainBalances: Map<number, string>;
}

export interface FaucetRequest {
  address: string;
  chainId: number;
  amount?: string;
}

export class TestnetWalletManager {
  private wallets: Map<string, TestnetWallet> = new Map();
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    Object.values(TESTNET_NETWORKS).forEach(network => {
      this.providers.set(network.chainId, new ethers.JsonRpcProvider(network.rpc));
    });
  }

  // Generate a new testnet wallet
  generateTestWallet(label: string = 'default'): TestnetWallet {
    const wallet = ethers.Wallet.createRandom();
    
    const testWallet: TestnetWallet = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
      chainBalances: new Map()
    };

    this.wallets.set(label, testWallet);
    logger.info(`Generated test wallet: ${label} - ${wallet.address}`);
    
    return testWallet;
  }

  // Import existing wallet
  importWallet(privateKey: string, label: string = 'imported'): TestnetWallet {
    try {
      const wallet = new ethers.Wallet(privateKey);
      
      const testWallet: TestnetWallet = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        chainBalances: new Map()
      };

      this.wallets.set(label, testWallet);
      logger.info(`Imported test wallet: ${label} - ${wallet.address}`);
      
      return testWallet;
    } catch (error) {
      throw new Error(`Failed to import wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get wallet by label
  getWallet(label: string): TestnetWallet | undefined {
    return this.wallets.get(label);
  }

  // Update balances for all chains
  async updateBalances(walletLabel: string): Promise<void> {
    const wallet = this.wallets.get(walletLabel);
    if (!wallet) {
      throw new Error(`Wallet ${walletLabel} not found`);
    }

    const balancePromises = Array.from(this.providers.entries()).map(async ([chainId, provider]) => {
      try {
        const balance = await provider.getBalance(wallet.address);
        wallet.chainBalances.set(chainId, balance.toString());
        return { chainId, balance: balance.toString() };
      } catch (error) {
        logger.error(`Failed to get balance for chain ${chainId}:`, error);
        return { chainId, balance: '0' };
      }
    });

    const balances = await Promise.all(balancePromises);
    logger.info(`Updated balances for wallet ${walletLabel}:`, balances);
  }

  // Request testnet tokens from faucets
  async requestFaucetFunds(request: FaucetRequest): Promise<boolean> {
    const network = Object.values(TESTNET_NETWORKS).find(n => n.chainId === request.chainId);
    if (!network) {
      throw new Error(`Network with chainId ${request.chainId} not found`);
    }

    logger.info(`Requesting faucet funds for ${request.address} on ${network.name}`);

    try {
      switch (request.chainId) {
        case 11155111: // Sepolia
          return await this.requestSepoliaFaucet(request.address);
        
        case 80001: // Mumbai
          return await this.requestMumbaiFaucet(request.address);
        
        case 97: // BSC Testnet
          return await this.requestBSCTestnetFaucet(request.address);
        
        case 421613: // Arbitrum Goerli
          return await this.requestArbitrumGoerliFaucet(request.address);
        
        case 420: // Optimism Goerli
          return await this.requestOptimismGoerliFaucet(request.address);
        
        case 43113: // Avalanche Fuji
          return await this.requestAvalancheFujiFaucet(request.address);
        
        default:
          logger.warn(`No faucet implementation for chainId ${request.chainId}`);
          return false;
      }
    } catch (error) {
      logger.error(`Faucet request failed for ${network.name}:`, error);
      return false;
    }
  }

  private async requestSepoliaFaucet(address: string): Promise<boolean> {
    try {
      // Using Alchemy faucet API (example)
      const response = await axios.post('https://sepoliafaucet.com/api/faucet', {
        address: address
      }, {
        timeout: 10000
      });
      
      logger.info(`Sepolia faucet response:`, response.data);
      return response.status === 200;
    } catch (error) {
      logger.error('Sepolia faucet error:', error);
      return false;
    }
  }

  private async requestMumbaiFaucet(address: string): Promise<boolean> {
    try {
      // Using Polygon faucet
      const response = await axios.post('https://faucet.polygon.technology/api/faucet', {
        network: 'mumbai',
        address: address,
        token: 'maticToken'
      }, {
        timeout: 15000
      });
      
      logger.info(`Mumbai faucet response:`, response.data);
      return response.status === 200;
    } catch (error) {
      logger.error('Mumbai faucet error:', error);
      return false;
    }
  }

  private async requestBSCTestnetFaucet(address: string): Promise<boolean> {
    try {
      // BSC testnet faucet
      const response = await axios.post('https://testnet.binance.org/faucet-smart/api/faucet', {
        address: address
      }, {
        timeout: 10000
      });
      
      logger.info(`BSC testnet faucet response:`, response.data);
      return response.status === 200;
    } catch (error) {
      logger.error('BSC testnet faucet error:', error);
      return false;
    }
  }

  private async requestArbitrumGoerliFaucet(address: string): Promise<boolean> {
    try {
      // Using Chainlink faucet
      const response = await axios.post('https://faucets.chain.link/arbitrum-goerli', {
        address: address
      }, {
        timeout: 10000
      });
      
      logger.info(`Arbitrum Goerli faucet response:`, response.data);
      return response.status === 200;
    } catch (error) {
      logger.error('Arbitrum Goerli faucet error:', error);
      return false;
    }
  }

  private async requestOptimismGoerliFaucet(address: string): Promise<boolean> {
    try {
      // Using Paradigm faucet
      const response = await axios.post('https://faucet.paradigm.xyz/api/claim', {
        address: address,
        chainId: 420
      }, {
        timeout: 10000
      });
      
      logger.info(`Optimism Goerli faucet response:`, response.data);
      return response.status === 200;
    } catch (error) {
      logger.error('Optimism Goerli faucet error:', error);
      return false;
    }
  }

  private async requestAvalancheFujiFaucet(address: string): Promise<boolean> {
    try {
      // Using Avalanche faucet
      const response = await axios.post('https://faucet.avax.network/api/faucet', {
        address: address,
        chain: 'fuji'
      }, {
        timeout: 10000
      });
      
      logger.info(`Avalanche Fuji faucet response:`, response.data);
      return response.status === 200;
    } catch (error) {
      logger.error('Avalanche Fuji faucet error:', error);
      return false;
    }
  }

  // Fund wallet across all testnets
  async fundWalletAllChains(walletLabel: string): Promise<Map<number, boolean>> {
    const wallet = this.wallets.get(walletLabel);
    if (!wallet) {
      throw new Error(`Wallet ${walletLabel} not found`);
    }

    const results = new Map<number, boolean>();
    const chainIds = Array.from(this.providers.keys());

    logger.info(`Funding wallet ${walletLabel} across ${chainIds.length} chains`);

    for (const chainId of chainIds) {
      try {
        const success = await this.requestFaucetFunds({
          address: wallet.address,
          chainId: chainId
        });
        
        results.set(chainId, success);
        
        if (success) {
          logger.info(`✅ Successfully funded ${wallet.address} on chain ${chainId}`);
          // Wait a bit between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          logger.warn(`❌ Failed to fund ${wallet.address} on chain ${chainId}`);
        }
      } catch (error) {
        logger.error(`Error funding chain ${chainId}:`, error);
        results.set(chainId, false);
      }
    }

    // Update balances after funding
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for transactions to confirm
    await this.updateBalances(walletLabel);

    return results;
  }

  // Get wallet summary
  getWalletSummary(walletLabel: string): any {
    const wallet = this.wallets.get(walletLabel);
    if (!wallet) {
      return null;
    }

    const balances: any = {};
    wallet.chainBalances.forEach((balance, chainId) => {
      const network = Object.values(TESTNET_NETWORKS).find(n => n.chainId === chainId);
      const balanceEth = ethers.formatEther(balance);
      balances[network?.name || `Chain ${chainId}`] = `${balanceEth} ETH`;
    });

    return {
      label: walletLabel,
      address: wallet.address,
      balances: balances,
      totalChains: wallet.chainBalances.size
    };
  }

  // Check if wallet has sufficient balance for testing
  async checkSufficientBalance(walletLabel: string, chainId: number, minimumBalance: string = '0.01'): Promise<boolean> {
    const wallet = this.wallets.get(walletLabel);
    if (!wallet) {
      return false;
    }

    await this.updateBalances(walletLabel);
    const balance = wallet.chainBalances.get(chainId) || '0';
    const balanceEth = parseFloat(ethers.formatEther(balance));
    const minimumEth = parseFloat(minimumBalance);

    return balanceEth >= minimumEth;
  }

  // Monitor wallet balances during testing
  startBalanceMonitoring(walletLabel: string, intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        await this.updateBalances(walletLabel);
        const summary = this.getWalletSummary(walletLabel);
        logger.debug(`Balance update for ${walletLabel}:`, summary);
      } catch (error) {
        logger.error(`Balance monitoring error for ${walletLabel}:`, error);
      }
    }, intervalMs);
  }

  // Cleanup and export wallet data
  exportWallets(): any {
    const exported: any = {};
    
    this.wallets.forEach((wallet, label) => {
      exported[label] = {
        address: wallet.address,
        // Don't export private keys for security
        hasPrivateKey: !!wallet.privateKey,
        hasMnemonic: !!wallet.mnemonic,
        chainCount: wallet.chainBalances.size
      };
    });

    return exported;
  }

  // Clear all wallets (for cleanup)
  clearWallets(): void {
    this.wallets.clear();
    logger.info('All test wallets cleared');
  }

  // Get all wallet labels
  getWalletLabels(): string[] {
    return Array.from(this.wallets.keys());
  }
}

export default TestnetWalletManager;