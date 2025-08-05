import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ArbitrageTrader } from '../index';
import CONFIG from '../config';
import logger from './logger';

export class MonitoringDashboard {
  private app: express.Application;
  private server: any;
  private trader: ArbitrageTrader;

  constructor(trader: ArbitrageTrader) {
    this.app = express();
    this.trader = trader;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        uptime: process.uptime()
      });
    });

    // System status
    this.app.get('/api/status', (req, res) => {
      try {
        const status = this.trader.getSystemStatus();
        res.json(status);
      } catch (error) {
        logger.logError('Dashboard status endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get system status' });
      }
    });

    // Trading statistics
    this.app.get('/api/stats', (req, res) => {
      try {
        const stats = this.trader.getTradingStats();
        res.json(stats);
      } catch (error) {
        logger.logError('Dashboard stats endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get trading stats' });
      }
    });

    // Recent opportunities
    this.app.get('/api/opportunities', (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const opportunities = this.trader.getRecentOpportunities(limit);
        res.json(opportunities);
      } catch (error) {
        logger.logError('Dashboard opportunities endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get opportunities' });
      }
    });

    // Recent trades
    this.app.get('/api/trades', (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const trades = this.trader.getRecentTrades(limit);
        res.json(trades);
      } catch (error) {
        logger.logError('Dashboard trades endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get trades' });
      }
    });

    // Price data
    this.app.get('/api/prices', (req, res) => {
      try {
        const prices = this.trader.getCurrentPrices();
        res.json(prices);
      } catch (error) {
        logger.logError('Dashboard prices endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get prices' });
      }
    });

    // Risk metrics
    this.app.get('/api/risk', (req, res) => {
      try {
        const riskMetrics = this.trader.getRiskMetrics();
        res.json(riskMetrics);
      } catch (error) {
        logger.logError('Dashboard risk endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get risk metrics' });
      }
    });

    // AI model statistics
    this.app.get('/api/ai-stats', (req, res) => {
      try {
        const aiStats = this.trader.getAIStats();
        res.json(aiStats);
      } catch (error) {
        logger.logError('Dashboard AI stats endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get AI stats' });
      }
    });

    // Protocol performance
    this.app.get('/api/protocols', (req, res) => {
      try {
        const protocolStats = this.trader.getProtocolStats();
        res.json(protocolStats);
      } catch (error) {
        logger.logError('Dashboard protocols endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get protocol stats' });
      }
    });

    // Control endpoints
    this.app.post('/api/control/start', (req, res) => {
      try {
        this.trader.start();
        logger.logSystemEvent('Trading started via dashboard');
        res.json({ message: 'Trading started' });
      } catch (error) {
        logger.logError('Dashboard start endpoint', error as Error);
        res.status(500).json({ error: 'Failed to start trading' });
      }
    });

    this.app.post('/api/control/stop', (req, res) => {
      try {
        this.trader.stop();
        logger.logSystemEvent('Trading stopped via dashboard');
        res.json({ message: 'Trading stopped' });
      } catch (error) {
        logger.logError('Dashboard stop endpoint', error as Error);
        res.status(500).json({ error: 'Failed to stop trading' });
      }
    });

    this.app.post('/api/control/emergency-stop', (req, res) => {
      try {
        this.trader.emergencyStop();
        logger.logSystemEvent('Emergency stop triggered via dashboard');
        res.json({ message: 'Emergency stop activated' });
      } catch (error) {
        logger.logError('Dashboard emergency stop endpoint', error as Error);
        res.status(500).json({ error: 'Failed to execute emergency stop' });
      }
    });

    // Configuration endpoints
    this.app.get('/api/config', (req, res) => {
      try {
        const config = {
          trading: CONFIG.trading,
          ai: CONFIG.ai,
          monitoring: CONFIG.monitoring
        };
        res.json(config);
      } catch (error) {
        logger.logError('Dashboard config endpoint', error as Error);
        res.status(500).json({ error: 'Failed to get configuration' });
      }
    });

    this.app.put('/api/config/trading', (req, res) => {
      try {
        const updates = req.body;
        // Validate and update trading configuration
        if (updates.minProfitThreshold !== undefined) {
          CONFIG.trading.minProfitThreshold = parseFloat(updates.minProfitThreshold);
        }
        if (updates.maxSlippage !== undefined) {
          CONFIG.trading.maxSlippage = parseFloat(updates.maxSlippage);
        }
        if (updates.maxPositionSize !== undefined) {
          CONFIG.trading.maxPositionSize = parseFloat(updates.maxPositionSize);
        }
        if (updates.tradingEnabled !== undefined) {
          CONFIG.trading.tradingEnabled = Boolean(updates.tradingEnabled);
        }
        
        logger.logSystemEvent('Trading configuration updated via dashboard', updates);
        res.json({ message: 'Configuration updated', config: CONFIG.trading });
      } catch (error) {
        logger.logError('Dashboard config update endpoint', error as Error);
        res.status(500).json({ error: 'Failed to update configuration' });
      }
    });

    // WebSocket endpoint for real-time updates
    this.app.get('/api/stream', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const sendUpdate = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Set up event listeners
      const opportunityListener = (opportunity: any) => {
        sendUpdate({ type: 'opportunity', data: opportunity });
      };

      const tradeListener = (trade: any) => {
        sendUpdate({ type: 'trade', data: trade });
      };

      const priceListener = (price: any) => {
        sendUpdate({ type: 'price', data: price });
      };

      this.trader.on('opportunity-found', opportunityListener);
      this.trader.on('trade-executed', tradeListener);
      this.trader.on('price-update', priceListener);

      // Clean up on disconnect
      req.on('close', () => {
        this.trader.removeListener('opportunity-found', opportunityListener);
        this.trader.removeListener('trade-executed', tradeListener);
        this.trader.removeListener('price-update', priceListener);
      });

      // Send initial status
      sendUpdate({ 
        type: 'status', 
        data: this.trader.getSystemStatus() 
      });

      // Keep connection alive
      const heartbeat = setInterval(() => {
        sendUpdate({ type: 'heartbeat', timestamp: Date.now() });
      }, 30000);

      req.on('close', () => {
        clearInterval(heartbeat);
      });
    });

    // Serve dashboard HTML
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });
  }

  private getDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Arbitrage Trader Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a1a; color: #fff; }
        .header { background: #2d2d2d; padding: 1rem; border-bottom: 2px solid #007acc; }
        .header h1 { color: #007acc; }
        .container { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; }
        .card { background: #2d2d2d; border-radius: 8px; padding: 1rem; border: 1px solid #444; }
        .card h3 { color: #007acc; margin-bottom: 1rem; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .status-item { padding: 0.5rem; background: #3d3d3d; border-radius: 4px; }
        .status-item strong { color: #4CAF50; }
        .controls { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-start { background: #4CAF50; color: white; }
        .btn-stop { background: #f44336; color: white; }
        .btn-emergency { background: #ff6b00; color: white; }
        .log { height: 300px; overflow-y: auto; background: #1a1a1a; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .profit { color: #4CAF50; }
        .loss { color: #f44336; }
        .warning { color: #ff9800; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #444; }
        th { background: #3d3d3d; }
        .full-width { grid-column: 1 / -1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI Arbitrage Trader Dashboard</h1>
        <div class="controls">
            <button class="btn btn-start" onclick="startTrading()">Start Trading</button>
            <button class="btn btn-stop" onclick="stopTrading()">Stop Trading</button>
            <button class="btn btn-emergency" onclick="emergencyStop()">Emergency Stop</button>
        </div>
    </div>

    <div class="container">
        <div class="card">
            <h3>📊 System Status</h3>
            <div id="status" class="status-grid">
                <div class="status-item">
                    <div>Trading Status</div>
                    <strong id="trading-status">Loading...</strong>
                </div>
                <div class="status-item">
                    <div>Opportunities Found</div>
                    <strong id="opportunities-count">0</strong>
                </div>
                <div class="status-item">
                    <div>Successful Trades</div>
                    <strong id="successful-trades">0</strong>
                </div>
                <div class="status-item">
                    <div>Total Profit</div>
                    <strong id="total-profit" class="profit">$0.00</strong>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>🎯 Risk Metrics</h3>
            <div id="risk-metrics" class="status-grid">
                <div class="status-item">
                    <div>Active Trades</div>
                    <strong id="active-trades">0</strong>
                </div>
                <div class="status-item">
                    <div>Daily Volume</div>
                    <strong id="daily-volume">$0.00</strong>
                </div>
                <div class="status-item">
                    <div>Risk Level</div>
                    <strong id="risk-level">LOW</strong>
                </div>
            </div>
        </div>

        <div class="card full-width">
            <h3>💰 Real-Time Arbitrage Opportunities</h3>
            <table id="opportunities-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Pair</th>
                        <th>Profit %</th>
                        <th>Potential Earnings</th>
                        <th>Protocols</th>
                        <th>Confidence</th>
                    </tr>
                </thead>
                <tbody id="opportunities-body"></tbody>
            </table>
        </div>

        <div class="card full-width">
            <h3>📈 Live Feed</h3>
            <div id="live-log" class="log"></div>
        </div>
    </div>

    <script>
        let eventSource;

        function startTrading() {
            fetch('/api/control/start', { method: 'POST' })
                .then(response => response.json())
                .then(data => addToLog('🟢 ' + data.message));
        }

        function stopTrading() {
            fetch('/api/control/stop', { method: 'POST' })
                .then(response => response.json())
                .then(data => addToLog('🔴 ' + data.message));
        }

        function emergencyStop() {
            if (confirm('Are you sure you want to trigger emergency stop?')) {
                fetch('/api/control/emergency-stop', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => addToLog('🚨 ' + data.message));
            }
        }

        function addToLog(message) {
            const log = document.getElementById('live-log');
            const time = new Date().toLocaleTimeString();
            log.innerHTML += \`<div>[\${time}] \${message}</div>\`;
            log.scrollTop = log.scrollHeight;
        }

        function updateStatus(data) {
            document.getElementById('trading-status').textContent = data.isRunning ? 'Running' : 'Stopped';
            document.getElementById('opportunities-count').textContent = data.opportunitiesFound || 0;
            document.getElementById('successful-trades').textContent = data.successfulTrades || 0;
            document.getElementById('total-profit').textContent = '$' + (data.totalProfit || 0).toFixed(2);
        }

        function updateOpportunities(opportunities) {
            const tbody = document.getElementById('opportunities-body');
            tbody.innerHTML = '';
            opportunities.slice(0, 10).forEach(opp => {
                const row = tbody.insertRow();
                const earnings = opp.potentialEarningsUSD ? '$' + opp.potentialEarningsUSD.toFixed(2) : 'N/A';
                const confidence = opp.confidence ? (opp.confidence * 100).toFixed(0) + '%' : 'N/A';
                row.innerHTML = \`
                    <td>\${new Date(opp.timestamp).toLocaleTimeString()}</td>
                    <td>\${opp.tokenA.symbol}/\${opp.tokenB.symbol}</td>
                    <td class="profit">\${opp.profitPercentage.toFixed(3)}%</td>
                    <td class="profit">\${earnings}</td>
                    <td>\${opp.buyPool.protocol} → \${opp.sellPool.protocol}</td>
                    <td>\${confidence}</td>
                \`;
            });
        }

        function initializeEventSource() {
            eventSource = new EventSource('/api/stream');
            
            eventSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                
                switch(data.type) {
                    case 'status':
                        updateStatus(data.data);
                        break;
                    case 'opportunity':
                        const earnings = data.data.potentialEarningsUSD ? 
                            'Potential earnings: $' + data.data.potentialEarningsUSD.toFixed(2) : 
                            '';
                        addToLog(\`💎 New opportunity: \${data.data.tokenA.symbol}/\${data.data.tokenB.symbol} - \${data.data.profitPercentage.toFixed(3)}% \${earnings}\`);
                        // Update opportunities table with new opportunity
                        fetch('/api/opportunities?limit=10')
                            .then(response => response.json())
                            .then(updateOpportunities);
                        break;
                    case 'trade':
                        const status = data.data.success ? '✅' : '❌';
                        addToLog(\`\${status} Trade executed: \${data.data.success ? 'Success' : 'Failed'}\`);
                        break;
                    case 'price':
                        break; // Price updates are too frequent for display
                }
            };

            eventSource.onerror = function(event) {
                addToLog('❌ Connection error, retrying...');
                setTimeout(() => {
                    eventSource.close();
                    initializeEventSource();
                }, 5000);
            };
        }

        function loadInitialData() {
            fetch('/api/status')
                .then(response => response.json())
                .then(updateStatus);

            fetch('/api/opportunities')
                .then(response => response.json())
                .then(updateOpportunities);
        }

        // Initialize
        loadInitialData();
        initializeEventSource();
        
        // Refresh data every 30 seconds
        setInterval(loadInitialData, 30000);
    </script>
</body>
</html>
    `;
  }

  start(): void {
    this.server = this.app.listen(CONFIG.server.port, () => {
      logger.logSystemEvent('Dashboard started', { port: CONFIG.server.port });
      console.log(`Dashboard available at http://localhost:${CONFIG.server.port}`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close(() => {
        logger.logSystemEvent('Dashboard stopped');
      });
    }
  }
}

export default MonitoringDashboard;
