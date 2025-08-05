import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { ArbitrageOpportunity, TradeStep, AIModelPrediction } from '../types';
import { ProtocolManager } from '../protocols';
import { AIAnalyticsEngine } from '../analytics/ai-engine';
import CONFIG from '../config';
import { SecureWallet } from '../wallet/secure-wallet';

interface ExecutionResult {
  success: boolean;
  transactionHashes: string[];
  actualProfit: string;
  gasUsed: string;
  executionTime: number;
  error?: string;
}

interface TradeValidation {
  isValid: boolean;
  reasons: string[];
  adjustedOpportunity?: ArbitrageOpportunity;
}

export class TradingExecutionEngine extends EventEmitter {
  private protocolManager: ProtocolManager;
  private aiEngine: AIAnalyticsEngine;
  private secureWallet: SecureWallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private isExecuting = false;
  private executionHistory: ExecutionResult[] = [];

  constructor(protocolManager: ProtocolManager, aiEngine: AIAnalyticsEngine) {
    super();
    this.protocolManager = protocolManager;
    this.aiEngine = aiEngine;
  }

  async initialize(secureWallet: SecureWallet): Promise<void> {
    console.log('Initializing Trading Execution Engine with secure wallet...');
    
    // Store the secure wallet
    this.secureWallet = secureWallet;
    
    // Initialize provider for the first network
    const networks = Object.values(CONFIG.networks);
    const mainNetwork = networks[0]; // Use first network as primary
    this.provider = new ethers.JsonRpcProvider(mainNetwork.rpcUrl);
    
    const address = await this.secureWallet.getAddress();
    console.log(`Trading wallet initialized: ${address}`);
  }

  async executeOpportunity(opportunity: ArbitrageOpportunity): Promise<ExecutionResult> {
    if (this.isExecuting) {
      throw new Error('Another trade is currently executing');
    }

    if (!CONFIG.trading.tradingEnabled) {
      throw new Error('Trading is disabled in configuration');
    }

    this.isExecuting = true;
    const startTime = Date.now();

    try {
      console.log(`Executing arbitrage opportunity: ${opportunity.id}`);
      this.emit('execution-started', { opportunityId: opportunity.id });

      // 1. Get AI prediction
      const aiPrediction = await this.aiEngine.predictOpportunity(opportunity);
      
      if (aiPrediction.confidence < CONFIG.ai.predictionConfidenceThreshold) {
        throw new Error(`AI confidence too low: ${aiPrediction.confidence}`);
      }

      // 2. Validate opportunity
      const validation = await this.validateOpportunity(opportunity);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.reasons.join(', ')}`);
      }

      const validatedOpportunity = validation.adjustedOpportunity || opportunity;

      // 3. Check balances and approvals
      await this.checkBalancesAndApprovals(validatedOpportunity);

      // 4. Execute the trades
      const executionResult = await this.executeTrades(validatedOpportunity);

      // 5. Record the result
      this.executionHistory.push(executionResult);
      
      if (executionResult.success) {
        console.log(`Trade executed successfully. Profit: ${executionResult.actualProfit}`);
        this.emit('execution-success', executionResult);
      } else {
        console.log(`Trade execution failed: ${executionResult.error}`);
        this.emit('execution-failed', executionResult);
      }

      return executionResult;

    } catch (error) {
      const failedResult: ExecutionResult = {
        success: false,
        transactionHashes: [],
        actualProfit: '0',
        gasUsed: '0',
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.executionHistory.push(failedResult);
      this.emit('execution-failed', failedResult);
      
      return failedResult;
    } finally {
      this.isExecuting = false;
    }
  }

  private async validateOpportunity(opportunity: ArbitrageOpportunity): Promise<TradeValidation> {
    const reasons: string[] = [];
    let adjustedOpportunity: ArbitrageOpportunity | undefined;

    try {
      // 1. Check if opportunity is still valid (re-quote)
      const buyProtocol = this.protocolManager.getProtocol(
        opportunity.buyPool.protocol, 
        opportunity.tokenA.chainId
      );
      const sellProtocol = this.protocolManager.getProtocol(
        opportunity.sellPool.protocol, 
        opportunity.tokenA.chainId
      );

      if (!buyProtocol || !sellProtocol) {
        reasons.push('Protocol not available');
        return { isValid: false, reasons };
      }

      // Re-quote the opportunity
      const currentBuyQuote = await buyProtocol.getQuote(
        opportunity.tokenA,
        opportunity.tokenB,
        opportunity.inputAmount,
        opportunity.buyPool
      );

      const currentSellQuote = await sellProtocol.getQuote(
        opportunity.tokenB,
        opportunity.tokenA,
        currentBuyQuote,
        opportunity.sellPool
      );

      const currentProfit = BigInt(currentSellQuote) - BigInt(opportunity.inputAmount);
      const currentProfitPercent = Number(currentProfit * 10000n / BigInt(opportunity.inputAmount)) / 100;

      // 2. Check if profit is still above threshold
      if (currentProfitPercent < CONFIG.trading.minProfitThreshold) {
        reasons.push(`Profit below threshold: ${currentProfitPercent}% < ${CONFIG.trading.minProfitThreshold}%`);
      }

      // 3. Check if profit hasn't degraded too much
      const profitDegradation = (opportunity.profitPercentage - currentProfitPercent) / opportunity.profitPercentage;
      if (profitDegradation > 0.5) { // More than 50% degradation
        reasons.push(`Profit degraded by ${(profitDegradation * 100).toFixed(1)}%`);
      }

      // 4. Update opportunity with current quotes if still valid
      if (reasons.length === 0) {
        adjustedOpportunity = {
          ...opportunity,
          profitPercentage: currentProfitPercent,
          profitAmount: currentProfit.toString(),
          timestamp: Date.now(),
          executionPath: opportunity.executionPath.map((step, index) => ({
            ...step,
            amountIn: index === 0 ? opportunity.inputAmount : currentBuyQuote,
            amountOutMin: this.calculateSlippageProtectedAmount(
              index === 0 ? currentBuyQuote : currentSellQuote,
              CONFIG.trading.maxSlippage
            )
          }))
        };
      }

      return {
        isValid: reasons.length === 0,
        reasons,
        adjustedOpportunity
      };

    } catch (error) {
      reasons.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, reasons };
    }
  }

  private calculateSlippageProtectedAmount(amount: string, maxSlippage: number): string {
    const slippageMultiplier = 1 - maxSlippage;
    const protectedAmount = BigInt(amount) * BigInt(Math.floor(slippageMultiplier * 10000)) / 10000n;
    return protectedAmount.toString();
  }

  private async checkBalancesAndApprovals(opportunity: ArbitrageOpportunity): Promise<void> {
    if (!this.secureWallet || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    const tokenA = opportunity.tokenA;
    const inputAmount = BigInt(opportunity.inputAmount);
    const walletAddress = await this.secureWallet.getAddress();

    // Check token balance
    let balance: bigint;
    if (tokenA.address === ethers.ZeroAddress) {
      // Native token (ETH/MATIC/BNB)
      balance = await this.provider.getBalance(walletAddress);
    } else {
      // ERC20 token
      const tokenContract = new ethers.Contract(
        tokenA.address,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      balance = await tokenContract.balanceOf(walletAddress);
    }

    if (balance < inputAmount) {
      throw new Error(`Insufficient balance. Have: ${balance}, Need: ${inputAmount}`);
    }

    // Check and set approvals for ERC20 tokens
    if (tokenA.address !== ethers.ZeroAddress) {
      await this.ensureApproval(tokenA.address, opportunity.buyPool.protocol, inputAmount);
    }

    // Check approval for the intermediate token (tokenB) for the sell step
    const intermediateAmount = BigInt(opportunity.executionPath[0].amountOutMin);
    if (opportunity.tokenB.address !== ethers.ZeroAddress) {
      await this.ensureApproval(
        opportunity.tokenB.address, 
        opportunity.sellPool.protocol, 
        intermediateAmount
      );
    }
  }

  private async ensureApproval(tokenAddress: string, protocolName: string, amount: bigint): Promise<void> {
    if (!this.secureWallet || !this.provider) return;

    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)'
      ],
      this.provider
    );

    // Get router address for the protocol
    const chainId = Number((await this.provider.getNetwork()).chainId);
    const protocol = this.protocolManager.getProtocol(protocolName, chainId);
    if (!protocol) {
      throw new Error(`Protocol ${protocolName} not found`);
    }

    // This is a simplified approach - in a real implementation, you'd need to get the actual router address
    const routerAddress = '0x0000000000000000000000000000000000000000'; // Placeholder
    
    const walletAddress = await this.secureWallet.getAddress();
    const currentAllowance = await tokenContract.allowance(walletAddress, routerAddress);
    
    if (currentAllowance < amount) {
      console.log(`Setting approval for ${tokenAddress} to ${routerAddress}`);
      
      // Create approval transaction
      const approveTx = await tokenContract.approve(routerAddress, ethers.MaxUint256);
      
      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(CONFIG.trading.maxGasPrice);

      // Sign and send transaction using secure wallet
      const signedTx = await this.secureWallet.signTransaction({
        ...approveTx,
        gasLimit: 100000,
        gasPrice: gasPrice
      });
      
      // Send the signed transaction
      const txResponse = await this.provider.broadcastTransaction(signedTx);
      await txResponse.wait();
      
      console.log(`Approval set: ${txResponse.hash}`);
    }
  }

  private async executeTrades(opportunity: ArbitrageOpportunity): Promise<ExecutionResult> {
    const transactionHashes: string[] = [];
    const startTime = Date.now();
    let totalGasUsed = 0n;

    if (!this.secureWallet || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    try {
      const walletAddress = await this.secureWallet.getAddress();
      
      // Execute each step in sequence
      for (let i = 0; i < opportunity.executionPath.length; i++) {
        const step = opportunity.executionPath[i];
        const protocol = this.protocolManager.getProtocol(step.protocol, opportunity.tokenA.chainId);
        
        if (!protocol) {
          throw new Error(`Protocol ${step.protocol} not found`);
        }

        console.log(`Executing step ${i + 1}/${opportunity.executionPath.length}: ${step.tokenIn.symbol} -> ${step.tokenOut.symbol}`);

        // Execute the trade using the protocol's executeTrade method
        // Note: This requires exposing the private key from the secure wallet temporarily
        // In a real implementation, the protocol classes should be updated to work with the secure wallet directly
        if (!this.secureWallet) {
          throw new Error('Secure wallet not initialized');
        }
        
        // This is a temporary workaround to get the private key
        // In a real implementation, we would modify the protocol classes to work with the secure wallet directly
        const privateKey = '0x'; // Placeholder - in a real implementation, this would come from the secure wallet
        
        const txHash = await protocol.executeTrade(step, privateKey);
        const receipt = await this.provider.waitForTransaction(txHash);
        
        if (!receipt) {
          throw new Error(`Transaction ${txHash} failed to confirm`);
        }

        if (receipt.status !== 1) {
          throw new Error(`Transaction ${txHash} failed with status ${receipt.status}`);
        }

        transactionHashes.push(txHash);
        totalGasUsed += receipt.gasUsed;
        console.log(`Step ${i + 1} completed: ${txHash}`);

        // Small delay between transactions to avoid nonce issues
        if (i < opportunity.executionPath.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate actual profit
      const finalBalance = await this.getTokenBalance(
        opportunity.tokenA.address,
        walletAddress
      );
      const actualProfit = finalBalance - BigInt(opportunity.inputAmount); // Simplified calculation

      return {
        success: true,
        transactionHashes,
        actualProfit: actualProfit.toString(),
        gasUsed: totalGasUsed.toString(),
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        transactionHashes,
        actualProfit: '0',
        gasUsed: totalGasUsed.toString(),
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }

  private async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<bigint> {
    if (!this.provider) return 0n;

    if (tokenAddress === ethers.ZeroAddress) {
      return await this.provider.getBalance(walletAddress);
    } else {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      return await tokenContract.balanceOf(walletAddress);
    }
  }

  async estimateGasCosts(opportunity: ArbitrageOpportunity): Promise<{
    totalGasEstimate: string;
    totalGasCost: string;
    profitAfterGas: string;
    isStillProfitable: boolean;
  }> {
    let totalGasEstimate = 0n;

    for (const step of opportunity.executionPath) {
      const protocol = this.protocolManager.getProtocol(step.protocol, opportunity.tokenA.chainId);
      if (protocol) {
        const gasEstimate = await protocol.estimateGas(step);
        totalGasEstimate += BigInt(gasEstimate);
      }
    }

    // Add buffer for gas price fluctuations
    totalGasEstimate = totalGasEstimate * 120n / 100n; // 20% buffer

    // Get current gas price
    const gasPrice = this.provider ? 
      await this.provider.getFeeData().then(feeData => feeData.gasPrice || BigInt(CONFIG.trading.maxGasPrice)) : 
      BigInt(CONFIG.trading.maxGasPrice);

    const totalGasCost = totalGasEstimate * gasPrice;
    const profitAfterGas = BigInt(opportunity.profitAmount) - totalGasCost;
    const isStillProfitable = profitAfterGas > 0n;

    return {
      totalGasEstimate: totalGasEstimate.toString(),
      totalGasCost: totalGasCost.toString(),
      profitAfterGas: profitAfterGas.toString(),
      isStillProfitable
    };
  }

  getExecutionStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalProfit: string;
    averageExecutionTime: number;
    isCurrentlyExecuting: boolean;
  } {
    const successful = this.executionHistory.filter(result => result.success);
    const totalProfit = successful.reduce((sum, result) => 
      sum + BigInt(result.actualProfit), 0n);
    
    const avgExecutionTime = this.executionHistory.length > 0 ?
      this.executionHistory.reduce((sum, result) => sum + result.executionTime, 0) / this.executionHistory.length :
      0;

    return {
      totalExecutions: this.executionHistory.length,
      successfulExecutions: successful.length,
      failedExecutions: this.executionHistory.length - successful.length,
      totalProfit: totalProfit.toString(),
      averageExecutionTime: avgExecutionTime,
      isCurrentlyExecuting: this.isExecuting
    };
  }

  getExecutionHistory(limit: number = 100): ExecutionResult[] {
    return this.executionHistory.slice(-limit);
  }
}
