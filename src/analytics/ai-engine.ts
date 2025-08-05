import * as tf from '@tensorflow/tfjs-node';
import { ArbitrageOpportunity, AIModelPrediction, PriceData } from '../types';
import { PriceMonitor } from '../monitoring/price-monitor';
import CONFIG from '../config';

interface TrainingData {
  features: number[][];
  labels: number[][];
}

export class AIAnalyticsEngine {
  private model: tf.Sequential | null = null;
  private priceMonitor: PriceMonitor;
  private trainingData: TrainingData = { features: [], labels: [] };
  private isTraining = false;
  private predictionHistory: AIModelPrediction[] = [];

  constructor(priceMonitor: PriceMonitor) {
    this.priceMonitor = priceMonitor;
  }

  async initialize(): Promise<void> {
    console.log('Initializing AI Analytics Engine...');
    
    // Create or load the model
    await this.createModel();
    
    // Load any saved training data
    await this.loadHistoricalData();
    
    console.log('AI Analytics Engine initialized');
  }

  private async createModel(): Promise<void> {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [15], // Feature vector size
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 3, // [success_probability, risk_score, execution_probability]
          activation: 'sigmoid'
        })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(CONFIG.ai.learningRate),
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    console.log('Neural network model created');
  }

  async predictOpportunity(opportunity: ArbitrageOpportunity): Promise<AIModelPrediction> {
    if (!this.model) {
      throw new Error('AI model not initialized');
    }

    const features = this.extractFeatures(opportunity);
    const featureTensor = tf.tensor2d([features]);
    
    const prediction = this.model.predict(featureTensor) as tf.Tensor;
    const predictionData = await prediction.data();
    
    // Clean up tensors
    featureTensor.dispose();
    prediction.dispose();

    const [successProb, riskScore, executionProb] = Array.from(predictionData);

    const aiPrediction: AIModelPrediction = {
      opportunity,
      confidence: successProb,
      riskScore: riskScore,
      executionProbability: executionProb,
      timestamp: Date.now()
    };

    this.predictionHistory.push(aiPrediction);
    
    // Keep only last 1000 predictions
    if (this.predictionHistory.length > 1000) {
      this.predictionHistory = this.predictionHistory.slice(-1000);
    }

    return aiPrediction;
  }

  private extractFeatures(opportunity: ArbitrageOpportunity): number[] {
    const features: number[] = [];

    // 1. Profit percentage
    features.push(opportunity.profitPercentage);

    // 2. Input amount (normalized)
    const inputAmountNorm = parseFloat(opportunity.inputAmount) / 1e18;
    features.push(Math.log10(inputAmountNorm + 1));

    // 3. Gas estimate (normalized)
    const gasNorm = parseFloat(opportunity.gasEstimate) / 1e6;
    features.push(Math.log10(gasNorm + 1));

    // 4-5. Pool liquidity (normalized)
    const buyLiquidity = parseFloat(opportunity.buyPool.liquidity) / 1e18;
    const sellLiquidity = parseFloat(opportunity.sellPool.liquidity) / 1e18;
    features.push(Math.log10(buyLiquidity + 1));
    features.push(Math.log10(sellLiquidity + 1));

    // 6-7. Pool fees
    features.push(opportunity.buyPool.fee);
    features.push(opportunity.sellPool.fee);

    // 8. Protocol diversity (1 if different protocols, 0 if same)
    features.push(opportunity.buyPool.protocol !== opportunity.sellPool.protocol ? 1 : 0);

    // 9-10. Price volatility (from price monitor)
    const tokenAPrice = this.priceMonitor.getPrice(opportunity.tokenA.address);
    const tokenBPrice = this.priceMonitor.getPrice(opportunity.tokenB.address);
    features.push(tokenAPrice ? Math.abs(tokenAPrice.change24h) / 100 : 0);
    features.push(tokenBPrice ? Math.abs(tokenBPrice.change24h) / 100 : 0);

    // 11-12. Volume indicators
    features.push(tokenAPrice ? Math.log10(tokenAPrice.volume24h + 1) : 0);
    features.push(tokenBPrice ? Math.log10(tokenBPrice.volume24h + 1) : 0);

    // 13. Time factor (market hours vs off-hours)
    const hour = new Date().getUTCHours();
    const isMarketHours = hour >= 14 && hour <= 21; // UTC market hours roughly
    features.push(isMarketHours ? 1 : 0.5);

    // 14. Chain congestion proxy (higher gas = more congestion)
    const congestionFactor = Math.min(gasNorm / 100, 1);
    features.push(congestionFactor);

    // 15. Opportunity age (how fresh is this opportunity)
    const ageMinutes = (Date.now() - opportunity.timestamp) / (1000 * 60);
    features.push(Math.max(0, 1 - ageMinutes / 10)); // Decay over 10 minutes

    return features;
  }

  async trainModel(historicalOpportunities: ArbitrageOpportunity[], outcomes: number[][]): Promise<void> {
    if (this.isTraining) {
      console.log('Model is already training, skipping...');
      return;
    }

    this.isTraining = true;
    console.log(`Training model with ${historicalOpportunities.length} samples...`);

    try {
      // Extract features from historical data
      const features = historicalOpportunities.map(opp => this.extractFeatures(opp));
      
      // Add to training data
      this.trainingData.features.push(...features);
      this.trainingData.labels.push(...outcomes);

      // Keep only last 10000 training samples
      if (this.trainingData.features.length > 10000) {
        const excess = this.trainingData.features.length - 10000;
        this.trainingData.features = this.trainingData.features.slice(excess);
        this.trainingData.labels = this.trainingData.labels.slice(excess);
      }

      if (this.trainingData.features.length < 32) {
        console.log('Not enough training data, skipping training');
        return;
      }

      // Convert to tensors
      const xs = tf.tensor2d(this.trainingData.features);
      const ys = tf.tensor2d(this.trainingData.labels);

      // Train the model
      const history = await this.model!.fit(xs, ys, {
        epochs: 50,
        batchSize: CONFIG.ai.batchSize,
        validationSplit: 0.2,
        shuffle: true,
        verbose: 0
      });

      // Log training results
      const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
      const finalAccuracy = history.history.acc?.[history.history.acc.length - 1] as number;
      
      console.log(`Training completed - Loss: ${finalLoss.toFixed(4)}, Accuracy: ${finalAccuracy?.toFixed(4) || 'N/A'}`);

      // Clean up tensors
      xs.dispose();
      ys.dispose();

    } catch (error) {
      console.error('Error training model:', error);
    } finally {
      this.isTraining = false;
    }
  }

  async saveModel(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }

    await this.model.save(`file://${path}`);
    console.log(`Model saved to ${path}`);
  }

  async loadModel(path: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${path}`) as tf.Sequential;
      console.log(`Model loaded from ${path}`);
    } catch (error) {
      console.log(`Could not load model from ${path}, creating new model`);
      await this.createModel();
    }
  }

  private async loadHistoricalData(): Promise<void> {
    // In a real implementation, this would load from a database
    // For now, we'll start with empty training data
    console.log('Historical data loading placeholder - implement database integration');
  }

  getModelStats(): {
    trainingDataSize: number;
    predictionCount: number;
    isTraining: boolean;
    lastPrediction: number;
  } {
    const lastPrediction = this.predictionHistory.length > 0 
      ? this.predictionHistory[this.predictionHistory.length - 1].timestamp 
      : 0;

    return {
      trainingDataSize: this.trainingData.features.length,
      predictionCount: this.predictionHistory.length,
      isTraining: this.isTraining,
      lastPrediction
    };
  }

  async analyzeMarketConditions(): Promise<{
    volatility: number;
    volume: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    recommendation: string;
  }> {
    const allPrices = this.priceMonitor.getAllPrices();
    const priceArray = Array.from(allPrices.values());

    if (priceArray.length === 0) {
      return {
        volatility: 0,
        volume: 0,
        sentiment: 'neutral',
        recommendation: 'Insufficient market data'
      };
    }

    // Calculate average volatility
    const avgVolatility = priceArray.reduce((sum, price) => 
      sum + Math.abs(price.change24h), 0) / priceArray.length;

    // Calculate average volume
    const avgVolume = priceArray.reduce((sum, price) => 
      sum + price.volume24h, 0) / priceArray.length;

    // Determine market sentiment
    const positiveChanges = priceArray.filter(price => price.change24h > 0).length;
    const negativeChanges = priceArray.filter(price => price.change24h < 0).length;
    
    let sentiment: 'bullish' | 'bearish' | 'neutral';
    if (positiveChanges > negativeChanges * 1.5) {
      sentiment = 'bullish';
    } else if (negativeChanges > positiveChanges * 1.5) {
      sentiment = 'bearish';
    } else {
      sentiment = 'neutral';
    }

    // Generate recommendation
    let recommendation: string;
    if (avgVolatility > 5 && avgVolume > 1000000) {
      recommendation = 'High volatility and volume - good for arbitrage opportunities';
    } else if (avgVolatility < 2) {
      recommendation = 'Low volatility - fewer arbitrage opportunities expected';
    } else {
      recommendation = 'Moderate market conditions - standard arbitrage scanning';
    }

    return {
      volatility: avgVolatility,
      volume: avgVolume,
      sentiment,
      recommendation
    };
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    console.log('AI Analytics Engine disposed');
  }
}