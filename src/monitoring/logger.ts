import winston from 'winston';
import CONFIG from '../config';

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: CONFIG.monitoring.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
          });
        })
      ),
      defaultMeta: { service: 'ai-arbitrage-trader' },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 10
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error | any): void {
    this.logger.error(message, { error: error?.stack || error });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  logOpportunity(opportunity: any): void {
    this.logger.info('Arbitrage opportunity detected', {
      type: 'opportunity',
      id: opportunity.id,
      tokenPair: `${opportunity.tokenA.symbol}/${opportunity.tokenB.symbol}`,
      profitPercentage: opportunity.profitPercentage,
      protocols: [opportunity.buyPool.protocol, opportunity.sellPool.protocol]
    });
  }

  logTradeExecution(result: any): void {
    this.logger.info('Trade execution completed', {
      type: 'trade_execution',
      success: result.success,
      profit: result.actualProfit,
      gasUsed: result.gasUsed,
      executionTime: result.executionTime,
      transactionHashes: result.transactionHashes
    });
  }

  logRiskAssessment(assessment: any): void {
    this.logger.info('Risk assessment completed', {
      type: 'risk_assessment',
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      shouldExecute: assessment.shouldExecute,
      reasons: assessment.reasons
    });
  }

  logPriceUpdate(priceData: any): void {
    this.logger.debug('Price update received', {
      type: 'price_update',
      token: priceData.token,
      price: priceData.price,
      change24h: priceData.change24h,
      source: priceData.source
    });
  }

  logSystemEvent(event: string, data?: any): void {
    this.logger.info('System event', {
      type: 'system_event',
      event,
      data
    });
  }

  logError(context: string, error: Error): void {
    this.logger.error(`Error in ${context}`, {
      type: 'error',
      context,
      error: error.message,
      stack: error.stack
    });
  }
}

export default new Logger();