import { ProtocolConfig, NetworkChain, ProtocolType } from '../types';

// Testnet Protocol Configurations
export const TESTNET_PROTOCOL_CONFIGS: Record<string, ProtocolConfig[]> = {
  // Ethereum Sepolia Testnet
  [11155111]: [
    {
      name: ProtocolType.UNISWAP_V2,
      chainId: 11155111,
      factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2-sepolia',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    },
    {
      name: ProtocolType.UNISWAP_V3,
      chainId: 11155111,
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-sepolia',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    }
  ],
  
  // Polygon Mumbai Testnet
  [80001]: [
    {
      name: ProtocolType.QUICKSWAP,
      chainId: 80001,
      factoryAddress: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      routerAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap-mumbai',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    },
    {
      name: ProtocolType.SUSHISWAP,
      chainId: 80001,
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/sushiswap/mumbai-exchange',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    },
    {
      name: ProtocolType.UNISWAP_V3,
      chainId: 80001,
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-mumbai',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    }
  ],

  // BSC Testnet
  [97]: [
    {
      name: ProtocolType.PANCAKESWAP,
      chainId: 97,
      factoryAddress: '0x6725F303b657a9451d8BA641348b6761A6CC7a17',
      routerAddress: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-testnet',
      rpcUrl: process.env.BSC_RPC_URL || '',
      blockTime: 3000,
      gasPrice: '5000000000'
    }
  ],

  // Arbitrum Goerli Testnet
  [421613]: [
    {
      name: ProtocolType.UNISWAP_V3,
      chainId: 421613,
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum-goerli',
      rpcUrl: process.env.ARBITRUM_RPC_URL || '',
      blockTime: 250,
      gasPrice: '100000000'
    }
  ],

  // Optimism Goerli Testnet
  [420]: [
    {
      name: ProtocolType.UNISWAP_V3,
      chainId: 420,
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-optimism-goerli',
      rpcUrl: process.env.OPTIMISM_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '15000000'
    }
  ],

  // Avalanche Fuji Testnet
  [43113]: [
    {
      name: 'traderjoe',
      chainId: 43113,
      factoryAddress: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
      routerAddress: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/traderjoe-xyz/exchange-fuji',
      rpcUrl: process.env.AVALANCHE_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '25000000000'
    },
    {
      name: 'pangolin',
      chainId: 43113,
      factoryAddress: '0xefa94DE7a4656D787667C749f7E1223D71E9FD88',
      routerAddress: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/pangolindex/exchange-fuji',
      rpcUrl: process.env.AVALANCHE_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '25000000000'
    }
  ]
};

// Testnet Token Configurations
export const TESTNET_TOKENS: Record<number, any[]> = {
  // Ethereum Sepolia
  [11155111]: [
    {
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: 11155111
    },
    {
      address: '0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 11155111
    },
    {
      address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 11155111
    },
    {
      address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: 11155111
    }
  ],

  // Polygon Mumbai
  [80001]: [
    {
      address: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      chainId: 80001
    },
    {
      address: '0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 80001
    },
    {
      address: '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 80001
    }
  ],

  // BSC Testnet
  [97]: [
    {
      address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      decimals: 18,
      chainId: 97
    },
    {
      address: '0x64544969ed7EBf5f083679233325356EbE738930',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      chainId: 97
    },
    {
      address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      chainId: 97
    }
  ],

  // Arbitrum Goerli
  [421613]: [
    {
      address: '0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: 421613
    },
    {
      address: '0x8FB1E3fC51F3b789dED7557E680551d93Ea9d892',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 421613
    }
  ],

  // Optimism Goerli
  [420]: [
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: 420
    },
    {
      address: '0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 420
    }
  ],

  // Avalanche Fuji
  [43113]: [
    {
      address: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
      symbol: 'WAVAX',
      name: 'Wrapped AVAX',
      decimals: 18,
      chainId: 43113
    },
    {
      address: '0x5425890298aed601595a70AB815c96711a31Bc65',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 43113
    }
  ]
};

// Testnet-specific network configurations
export const TESTNET_NETWORKS = {
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpc: process.env.ETHEREUM_RPC_URL || '',
    explorer: 'https://sepolia.etherscan.io',
    faucet: 'https://sepoliafaucet.com'
  },
  mumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpc: process.env.POLYGON_RPC_URL || '',
    explorer: 'https://mumbai.polygonscan.com',
    faucet: 'https://faucet.polygon.technology'
  },
  bscTestnet: {
    chainId: 97,
    name: 'BSC Testnet',
    rpc: process.env.BSC_RPC_URL || '',
    explorer: 'https://testnet.bscscan.com',
    faucet: 'https://testnet.binance.org/faucet-smart'
  },
  arbitrumGoerli: {
    chainId: 421613,
    name: 'Arbitrum Goerli',
    rpc: process.env.ARBITRUM_RPC_URL || '',
    explorer: 'https://goerli.arbiscan.io',
    faucet: 'https://goerlifaucet.com'
  },
  optimismGoerli: {
    chainId: 420,
    name: 'Optimism Goerli',
    rpc: process.env.OPTIMISM_RPC_URL || '',
    explorer: 'https://goerli-optimism.etherscan.io',
    faucet: 'https://goerlifaucet.com'
  },
  fuji: {
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpc: process.env.AVALANCHE_RPC_URL || '',
    explorer: 'https://testnet.snowtrace.io',
    faucet: 'https://faucet.avax.network'
  }
};