import { ProtocolConfig, NetworkChain, ProtocolType } from '../types';

export const PROTOCOL_CONFIGS: Record<string, ProtocolConfig[]> = {
  [NetworkChain.ETHEREUM]: [
    {
      name: ProtocolType.UNISWAP_V2,
      chainId: NetworkChain.ETHEREUM,
      factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    },
    {
      name: ProtocolType.UNISWAP_V3,
      chainId: NetworkChain.ETHEREUM,
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    },
    {
      name: ProtocolType.SUSHISWAP,
      chainId: NetworkChain.ETHEREUM,
      factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    },
    {
      name: ProtocolType.BALANCER,
      chainId: NetworkChain.ETHEREUM,
      factoryAddress: '0x9424B1412450D0f8Fc2255FAf6046b98213B76Bd',
      routerAddress: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    },
    {
      name: ProtocolType.CURVE,
      chainId: NetworkChain.ETHEREUM,
      factoryAddress: '0xB9fC157394Af804a3578134A6585C0dc9cc990d4',
      routerAddress: '0x99a58482BD75cbab83b27EC03CA68fF489b5788f',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/curvefi/curve',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    }
  ],
  [NetworkChain.POLYGON]: [
    {
      name: ProtocolType.QUICKSWAP,
      chainId: NetworkChain.POLYGON,
      factoryAddress: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      routerAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    },
    {
      name: ProtocolType.SUSHISWAP,
      chainId: NetworkChain.POLYGON,
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    },
    {
      name: ProtocolType.UNISWAP_V3,
      chainId: NetworkChain.POLYGON,
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    },
    {
      name: ProtocolType.BALANCER,
      chainId: NetworkChain.POLYGON,
      factoryAddress: '0x9424B1412450D0f8Fc2255FAf6046b98213B76Bd',
      routerAddress: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    },
    {
      name: ProtocolType.CURVE,
      chainId: NetworkChain.POLYGON,
      factoryAddress: '0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee',
      routerAddress: '0x094d12e5b541784701FD8d65F11fc0598FBC6332',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/curvefi/curve-polygon',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    }
  ],
  [NetworkChain.BSC]: [
    {
      name: ProtocolType.PANCAKESWAP,
      chainId: NetworkChain.BSC,
      factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange',
      rpcUrl: process.env.BSC_RPC_URL || '',
      blockTime: 3000,
      gasPrice: '5000000000'
    },
    {
      name: ProtocolType.SUSHISWAP,
      chainId: NetworkChain.BSC,
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/sushiswap/bsc-exchange',
      rpcUrl: process.env.BSC_RPC_URL || '',
      blockTime: 3000,
      gasPrice: '5000000000'
    }
  ],
  [NetworkChain.ARBITRUM]: [
    {
      name: ProtocolType.UNISWAP_V3,
      chainId: NetworkChain.ARBITRUM,
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum',
      rpcUrl: process.env.ARBITRUM_RPC_URL || '',
      blockTime: 250,
      gasPrice: '100000000'
    },
    {
      name: ProtocolType.SUSHISWAP,
      chainId: NetworkChain.ARBITRUM,
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange',
      rpcUrl: process.env.ARBITRUM_RPC_URL || '',
      blockTime: 250,
      gasPrice: '100000000'
    },
    {
      name: ProtocolType.BALANCER,
      chainId: NetworkChain.ARBITRUM,
      factoryAddress: '0x9424B1412450D0f8Fc2255FAf6046b98213B76Bd',
      routerAddress: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-arbitrum-v2',
      rpcUrl: process.env.ARBITRUM_RPC_URL || '',
      blockTime: 250,
      gasPrice: '100000000'
    },
    {
      name: ProtocolType.CURVE,
      chainId: NetworkChain.ARBITRUM,
      factoryAddress: '0x9AF14D26075f142eb3F292D5065EB3faa646167b',
      routerAddress: '0x7544Fe8a8285C77c81d4d4C78C9aA8aC7e5e7101',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/curvefi/curve-arbitrum',
      rpcUrl: process.env.ARBITRUM_RPC_URL || '',
      blockTime: 250,
      gasPrice: '100000000'
    }
  ],
  [NetworkChain.OPTIMISM]: [
    {
      name: ProtocolType.UNISWAP_V3,
      chainId: NetworkChain.OPTIMISM,
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-optimism',
      rpcUrl: process.env.OPTIMISM_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '15000000'
    },
    {
      name: ProtocolType.CURVE,
      chainId: NetworkChain.OPTIMISM,
      factoryAddress: '0x2db0E83599a91b508Ac268a6197b8B14F5e72840',
      routerAddress: '0x2db0E83599a91b508Ac268a6197b8B14F5e72840',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/curvefi/curve-optimism',
      rpcUrl: process.env.OPTIMISM_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '15000000'
    }
  ],
  [NetworkChain.AVALANCHE]: [
    {
      name: 'traderjoe',
      chainId: NetworkChain.AVALANCHE,
      factoryAddress: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
      routerAddress: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/traderjoe-xyz/exchange',
      rpcUrl: process.env.AVALANCHE_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '25000000000'
    },
    {
      name: 'pangolin',
      chainId: NetworkChain.AVALANCHE,
      factoryAddress: '0xefa94DE7a4656D787667C749f7E1223D71E9FD88',
      routerAddress: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/pangolindex/exchange',
      rpcUrl: process.env.AVALANCHE_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '25000000000'
    },
    {
      name: ProtocolType.CURVE,
      chainId: NetworkChain.AVALANCHE,
      factoryAddress: '0xb17b674D9c5CB2e441F8e196a2f048A81355d031',
      routerAddress: '0x90f421832199e93d01b64DaF378b183809EB0988',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/curvefi/curve-avalanche',
      rpcUrl: process.env.AVALANCHE_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '25000000000'
    }
  ]
};

export const POPULAR_TOKENS: Record<number, Token[]> = {
  [NetworkChain.ETHEREUM]: [
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: NetworkChain.ETHEREUM
    },
    {
      address: '0xA0b86a33E6441bF7605308D4395B2863dbDB0413',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: NetworkChain.ETHEREUM
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: NetworkChain.ETHEREUM
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: NetworkChain.ETHEREUM
    }
  ],
  [NetworkChain.POLYGON]: [
    {
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      chainId: NetworkChain.POLYGON
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: NetworkChain.POLYGON
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: NetworkChain.POLYGON
    }
  ]
};