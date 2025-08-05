import { ProtocolConfig, NetworkChain, ProtocolType, Token } from '../types';

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
    },
    {
      name: ProtocolType.ZEROX,
      chainId: NetworkChain.ETHEREUM,
      factoryAddress: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      routerAddress: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      graphEndpoint: 'https://api.0x.org/',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    },
    {
      name: ProtocolType.DODO,
      chainId: NetworkChain.ETHEREUM,
      factoryAddress: '0x3A97247DF274a17C59A3bd12735ea3FcDFb49950',
      routerAddress: '0x8F8Dd7DB1bDA5eD3Da8C9daf3bfa471c12d58486',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/dodoex/dodoex-v2',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      blockTime: 12000,
      gasPrice: '20000000000'
    },
    {
      name: ProtocolType.KYBERSWAP,
      chainId: NetworkChain.ETHEREUM,
      factoryAddress: '0x833e4083B7ae46CeA85695c4f7ed25CDAd8886dE',
      routerAddress: '0x1c87257f5e8609940bc751a07bb085bb7f8cdbe6',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-mainnet',
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
    },
    {
      name: ProtocolType.DODO,
      chainId: NetworkChain.POLYGON,
      factoryAddress: '0x357c5E9cfA8B834EDcef7C7aAbD8F9Db09119d11',
      routerAddress: '0x8F8Dd7DB1bDA5eD3Da8C9daf3bfa471c12d58486',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/dodoex/dodoex-v2-polygon',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      blockTime: 2000,
      gasPrice: '30000000000'
    },
    {
      name: ProtocolType.KYBERSWAP,
      chainId: NetworkChain.POLYGON,
      factoryAddress: '0x5F1fe642060B5B9658C15721Ea22E982643c095c',
      routerAddress: '0x6131B5fae19EA4f9D964eAc0408E4408b6B52E1C',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-matic',
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
    },
    {
      name: ProtocolType.DODO,
      chainId: NetworkChain.BSC,
      factoryAddress: '0x357c5E9cfA8B834EDcef7C7aAbD8F9Db09119d11',
      routerAddress: '0x8F8Dd7DB1bDA5eD3Da8C9daf3bfa471c12d58486',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/dodoex/dodoex-v2-bsc',
      rpcUrl: process.env.BSC_RPC_URL || '',
      blockTime: 3000,
      gasPrice: '5000000000'
    },
    {
      name: ProtocolType.KYBERSWAP,
      chainId: NetworkChain.BSC,
      factoryAddress: '0x878dFE971d44e9122048308361Cf549E7b509f17',
      routerAddress: '0x1aFaF59356cAB3C431b3433195769c972c624742',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-bsc',
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
    },
    {
      name: ProtocolType.DODO,
      chainId: NetworkChain.ARBITRUM,
      factoryAddress: '0x357c5E9cfA8B834EDcef7C7aAbD8F9Db09119d11',
      routerAddress: '0x8F8Dd7DB1bDA5eD3Da8C9daf3bfa471c12d58486',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/dodoex/dodoex-v2-arbitrum',
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
    },
    {
      name: ProtocolType.KYBERSWAP,
      chainId: NetworkChain.OPTIMISM,
      factoryAddress: '0x5F1fe642060B5B9658C15721Ea22E982643c095c',
      routerAddress: '0x6131B5fae19EA4f9D964eAc0408E4408b6B52E1C',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-optimism',
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
    },
    {
      name: ProtocolType.PLATYPUS,
      chainId: NetworkChain.AVALANCHE,
      factoryAddress: '0x7d7cdC5C433D18A963F345323252A853127828C0',
      routerAddress: '0x7d7cdC5C433D18A963F345323252A853127828C0',
      graphEndpoint: 'https://api.thegraph.com/subgraphs/name/platypus-finance/platypus-exchange',
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
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      chainId: NetworkChain.ETHEREUM
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      chainId: NetworkChain.ETHEREUM
    },
    {
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      symbol: 'AAVE',
      name: 'Aave Token',
      decimals: 18,
      chainId: NetworkChain.ETHEREUM
    },
    {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      symbol: 'LINK',
      name: 'Chainlink',
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
    },
    {
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: NetworkChain.POLYGON
    },
    {
      address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      chainId: NetworkChain.POLYGON
    },
    {
      address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      chainId: NetworkChain.POLYGON
    }
  ],
  [NetworkChain.BSC]: [
    {
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      decimals: 18,
      chainId: NetworkChain.BSC
    },
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      chainId: NetworkChain.BSC
    },
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      chainId: NetworkChain.BSC
    },
    {
      address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
      symbol: 'DAI',
      name: 'Dai Token',
      decimals: 18,
      chainId: NetworkChain.BSC
    },
    {
      address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      symbol: 'WBTC',
      name: 'BTCB Token',
      decimals: 18,
      chainId: NetworkChain.BSC
    },
    {
      address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1',
      symbol: 'UNI',
      name: 'Uniswap Token',
      decimals: 18,
      chainId: NetworkChain.BSC
    }
  ],
  [NetworkChain.ARBITRUM]: [
    {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: NetworkChain.ARBITRUM
    },
    {
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: NetworkChain.ARBITRUM
    },
    {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: NetworkChain.ARBITRUM
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: NetworkChain.ARBITRUM
    }
  ],
  [NetworkChain.OPTIMISM]: [
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: NetworkChain.OPTIMISM
    },
    {
      address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: NetworkChain.OPTIMISM
    },
    {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: NetworkChain.OPTIMISM
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: NetworkChain.OPTIMISM
    }
  ],
  [NetworkChain.AVALANCHE]: [
    {
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      symbol: 'WAVAX',
      name: 'Wrapped AVAX',
      decimals: 18,
      chainId: NetworkChain.AVALANCHE
    },
    {
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: NetworkChain.AVALANCHE
    },
    {
      address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: NetworkChain.AVALANCHE
    },
    {
      address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: NetworkChain.AVALANCHE
    }
  ]
};
