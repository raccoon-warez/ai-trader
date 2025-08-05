import { EventEmitter } from 'events';
import WebSocket from 'ws';
import axios from 'axios';
import { PriceData, Token, Pool } from '../types';
import { ProtocolManager } from '../protocols';
import CONFIG from '../config';

export class PriceMonitor extends EventEmitter {
  private protocolManager: ProtocolManager;
  private priceCache: Map<string, PriceData> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private monitoringTokens: Set<string> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(protocolManager: ProtocolManager) {
    super();
    this.protocolManager = protocolManager;
  }

  async startMonitoring(tokens: Token[]): Promise<void> {
    console.log(`Starting price monitoring for ${tokens.length} tokens`);
    
    tokens.forEach(token => {
      this.monitoringTokens.add(token.address.toLowerCase());
    });

    // Start price fetching from APIs
    await this.initializeApiMonitoring();
    
    // Start WebSocket monitoring for real-time updates
    await this.initializeWebSocketMonitoring();
    
    // Start pool monitoring for DEX prices
    await this.initializePoolMonitoring();

    this.emit('monitoring-started', { tokenCount: tokens.length });
  }

  private async initializeApiMonitoring(): Promise<void> {
    // CoinGecko API monitoring
    this.updateInterval = setInterval(async () => {
      await this.fetchCoinGeckoPrices();
    }, 10000); // Update every 10 seconds

    // Initial fetch
    await this.fetchCoinGeckoPrices();
  }

  private async fetchCoinGeckoPrices(): Promise<void> {
    try {
      const tokenList = Array.from(this.monitoringTokens).slice(0, 100); // API limit
      if (tokenList.length === 0) return;

      const addresses = tokenList.join(',');
      const url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addresses}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;
      
      const response = await axios.get(url, {
        headers: CONFIG.apis.coingecko ? {
          'X-CG-Pro-API-Key': CONFIG.apis.coingecko
        } : {}
      });

      Object.entries(response.data).forEach(([address, data]: [string, any]) => {
        const priceData: PriceData = {
          token: address,
          price: data.usd || 0,
          volume24h: data.usd_24h_vol || 0,
          change24h: data.usd_24h_change || 0,
          timestamp: Date.now(),
          source: 'coingecko'
        };

        this.updatePrice(address, priceData);
      });
    } catch (error) {
      console.error('Error fetching CoinGecko prices:', error);
    }
  }

  private async initializeWebSocketMonitoring(): Promise<void> {
    // Binance WebSocket for popular pairs
    const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    binanceWs.on('message', (data) => {
      try {
        const tickers = JSON.parse(data.toString());
        tickers.forEach((ticker: any) => {
          if (ticker.s && ticker.c) {
            const symbol = ticker.s.toLowerCase();
            if (this.shouldMonitorSymbol(symbol)) {
              const priceData: PriceData = {
                token: symbol,
                price: parseFloat(ticker.c),
                volume24h: parseFloat(ticker.v),
                change24h: parseFloat(ticker.P),
                timestamp: Date.now(),
                source: 'binance'
              };
              
              this.updatePrice(symbol, priceData);
            }
          }
        });
      } catch (error) {
        console.error('Error processing Binance WebSocket data:', error);
      }
    });

    this.websockets.set('binance', binanceWs);
  }

  private shouldMonitorSymbol(symbol: string): boolean {
    const commonPairs = ['ethusdt', 'btcusdt', 'maticusdt', 'bnbusdt', 'adausdt'];
    return commonPairs.includes(symbol);
  }

  private async initializePoolMonitoring(): Promise<void> {
    // Monitor DEX pools for direct price data
    setInterval(async () => {
      await this.updateDexPrices();
    }, 5000); // Update every 5 seconds
  }

  private async updateDexPrices(): Promise<void> {
    try {
      const protocols = this.protocolManager.getAllProtocols();
      
      for (const protocol of protocols) {
        // Monitor major pairs like WETH/USDC, WETH/USDT, etc.
        // This is a simplified implementation
        await this.monitorProtocolPrices(protocol);
      }
    } catch (error) {
      console.error('Error updating DEX prices:', error);
    }
  }

  private async monitorProtocolPrices(protocol: any): Promise<void> {
    // This would be expanded to monitor specific token pairs
    // For now, we'll focus on the main implementation
  }

  private updatePrice(tokenAddress: string, priceData: PriceData): void {
    const key = tokenAddress.toLowerCase();
    const existingData = this.priceCache.get(key);
    
    // Only update if price has changed significantly or it's been more than 1 minute
    if (!existingData || 
        Math.abs(existingData.price - priceData.price) / existingData.price > 0.001 ||
        Date.now() - existingData.timestamp > 60000) {
      
      this.priceCache.set(key, priceData);
      this.emit('price-update', priceData);
      
      // Emit significant price change alerts
      if (existingData && Math.abs(priceData.change24h) > 5) {
        this.emit('price-alert', {
          token: tokenAddress,
          change: priceData.change24h,
          price: priceData.price,
          timestamp: priceData.timestamp
        });
      }
    }
  }

  getPrice(tokenAddress: string): PriceData | undefined {
    return this.priceCache.get(tokenAddress.toLowerCase());
  }

  getAllPrices(): Map<string, PriceData> {
    return new Map(this.priceCache);
  }

  async getPoolPrices(tokenA: Token, tokenB: Token): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    const protocols = this.protocolManager.getAllProtocols();

    for (const protocol of protocols) {
      try {
        const pools = await protocol.getPools(tokenA, tokenB);
        
        for (const pool of pools) {
          const quote = await protocol.getQuote(
            tokenA,
            tokenB,
            ethers.parseUnits('1', tokenA.decimals).toString(),
            pool
          );
          
          if (quote !== '0') {
            const price = parseFloat(ethers.formatUnits(quote, tokenB.decimals));
            prices.set(`${protocol.getName()}_${pool.id}`, price);
          }
        }
      } catch (error) {
        console.error(`Error getting pool prices from ${protocol.getName()}:`, error);
      }
    }

    return prices;
  }

  stopMonitoring(): void {
    console.log('Stopping price monitoring');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.websockets.forEach((ws, name) => {
      console.log(`Closing ${name} WebSocket`);
      ws.close();
    });

    this.websockets.clear();
    this.emit('monitoring-stopped');
  }

  getMonitoringStats(): {
    tokensMonitored: number;
    pricesCached: number;
    websocketsActive: number;
    lastUpdate: number;
  } {
    const lastUpdateTimes = Array.from(this.priceCache.values())
      .map(data => data.timestamp);
    
    return {
      tokensMonitored: this.monitoringTokens.size,
      pricesCached: this.priceCache.size,
      websocketsActive: this.websockets.size,
      lastUpdate: lastUpdateTimes.length > 0 ? Math.max(...lastUpdateTimes) : 0
    };
  }
}