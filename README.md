# 🤖 AI Arbitrage Trader

An advanced AI-powered arbitrage trading bot that monitors 20+ DeFi protocols across multiple blockchains to identify and execute profitable arbitrage opportunities.

## ✨ Features

### 🔗 Multi-Protocol Support (30+ Protocols)
- **Ethereum**: Uniswap V2/V3, SushiSwap, Balancer, Curve, 0x, DODO, KyberSwap
- **Polygon**: QuickSwap, SushiSwap, Uniswap V3, Balancer, Curve, DODO, KyberSwap
- **BSC**: PancakeSwap, SushiSwap, DODO, KyberSwap
- **Arbitrum**: Uniswap V3, SushiSwap, Balancer, Curve, DODO
- **Optimism**: Uniswap V3, Curve, KyberSwap
- **Avalanche**: Trader Joe, Pangolin, Curve, Platypus

### 🧠 AI-Powered Analytics
- **TensorFlow Neural Network**: 15-feature model for opportunity prediction
- **Real-time Risk Assessment**: Dynamic risk scoring and position sizing
- **Market Condition Analysis**: Volatility and sentiment analysis
- **Confidence Scoring**: AI-driven execution probability predictions

### ⚡ Advanced Trading Engine
- **Real-time Price Monitoring**: WebSocket and API price feeds
- **Slippage Protection**: Dynamic slippage calculation and protection
- **Gas Optimization**: Smart gas estimation and cost analysis
- **Multi-step Execution**: Complex arbitrage path execution

### 🛡️ Comprehensive Risk Management
- **Position Sizing**: Intelligent position size adjustment based on risk
- **Daily Limits**: Volume and trade frequency controls
- **Blacklist Management**: Token and protocol blacklisting
- **Emergency Stop**: Immediate halt of all trading activities

### 📊 Monitoring & Dashboard
- **Real-time Web Dashboard**: Live monitoring interface
- **RESTful API**: Complete system control and monitoring
- **Event Streaming**: Server-sent events for real-time updates
- **Comprehensive Logging**: Structured logging with Winston

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- TypeScript
- MongoDB (optional, for persistent storage)
- Redis (optional, for caching)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai_trader

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit configuration
nano .env
```

### Configuration

Update `.env` file with your settings:

```env
# Network RPCs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# Wallet (Use secure key management in production!)
PRIVATE_KEY=your_private_key_here
WALLET_ADDRESS=your_wallet_address_here

# Trading Configuration  
MIN_PROFIT_THRESHOLD=0.005  # 0.5% minimum profit
MAX_SLIPPAGE=0.02          # 2% max slippage
MAX_POSITION_SIZE=1000     # $1000 max position
TRADING_ENABLED=false      # Start in monitoring mode

# API Keys (Optional)
COINGECKO_API_KEY=your_api_key
MORALIS_API_KEY=your_api_key
```

### Running the Application

```bash
# Development mode
npm run dev

# Build and run production
npm run build
npm start

# Monitoring mode only (no trading)
TRADING_ENABLED=false npm run dev
```

### Access Dashboard

Open your browser to `http://localhost:3000` to access the real-time monitoring dashboard.

![AI Arbitrage Trader Dashboard](dashboard-screenshot.png)

*Real-time arbitrage opportunities with potential earnings estimation*

*Note: The screenshot may not display properly on GitHub. For details about the enhancements, see [ENHANCEMENTS.md](ENHANCEMENTS.md)*

## 🏗️ Architecture

```
src/
├── config/           # Configuration management
├── protocols/        # DeFi protocol integrations
├── analytics/        # AI engine and arbitrage detection  
├── trading/          # Execution engine and risk management
├── monitoring/       # Dashboard and logging
├── types/           # TypeScript type definitions
└── index.ts         # Main application entry point
```

### Core Components

1. **ProtocolManager**: Manages connections to 20+ DeFi protocols
2. **PriceMonitor**: Real-time price tracking across multiple sources
3. **ArbitrageDetector**: Identifies profitable arbitrage opportunities
4. **AIAnalyticsEngine**: Neural network for opportunity prediction
5. **TradingExecutionEngine**: Executes trades with slippage protection
6. **RiskManager**: Comprehensive risk assessment and position sizing
7. **MonitoringDashboard**: Web-based monitoring and control interface

## 🔧 API Reference

### System Control
- `POST /api/control/start` - Start trading
- `POST /api/control/stop` - Stop trading  
- `POST /api/control/emergency-stop` - Emergency halt

### Monitoring
- `GET /api/status` - System status
- `GET /api/stats` - Trading statistics
- `GET /api/opportunities` - Recent opportunities
- `GET /api/trades` - Recent trades
- `GET /api/prices` - Current prices
- `GET /api/risk` - Risk metrics

### Configuration
- `GET /api/config` - Current configuration
- `PUT /api/config/trading` - Update trading settings

### Real-time Updates
- `GET /api/stream` - Server-sent events stream

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

## 📈 Performance Optimization

### Gas Optimization
- Dynamic gas price monitoring
- Multi-step transaction batching where possible
- Gas cost vs profit analysis

### Execution Speed
- Parallel protocol querying
- WebSocket price feeds for minimal latency
- Optimized trade path calculation

### Risk Management
- Real-time liquidity analysis
- Slippage impact calculation
- Position size optimization based on market conditions

## ⚠️ Risk Disclaimers

- **Smart Contract Risk**: DeFi protocols may have bugs or vulnerabilities
- **Impermanent Loss**: Price movements during execution can affect profitability
- **Gas Costs**: High network congestion can make trades unprofitable
- **Slippage**: Large trades may experience significant slippage
- **Market Risk**: Crypto markets are highly volatile and unpredictable

## 🔒 Security Best Practices

### Private Key Management
- Never commit private keys to version control
- Use hardware wallets for production
- Consider multi-signature wallets for large amounts
- Implement key rotation policies

### Operational Security
- Run on secure, monitored infrastructure
- Enable comprehensive logging and alerting
- Implement rate limiting and DDoS protection
- Regular security audits and updates

## 📊 Monitoring & Alerts

### Key Metrics
- Profit/Loss tracking
- Success rate monitoring
- Gas cost analysis
- Risk exposure metrics

### Alert Conditions
- Failed trade executions
- Unusual profit opportunities (possible errors)
- High gas costs
- System errors or downtime

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Check the [troubleshooting guide](docs/troubleshooting.md)
- Review [common issues](docs/common-issues.md)
- Open an issue on GitHub

---

**⚠️ Important**: This software is for educational purposes. Always test thoroughly with small amounts before using with significant funds. Cryptocurrency trading involves substantial risk and may result in financial loss.
