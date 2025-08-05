import { UniswapV2Protocol } from './uniswap-v2';
import { UniswapV3Protocol } from './uniswap-v3';
import { BaseProtocol } from './base';
import { PROTOCOL_CONFIGS } from '../config/protocols';
import { NetworkChain, ProtocolType } from '../types';

export class ProtocolManager {
  private protocols: Map<string, BaseProtocol> = new Map();

  constructor() {
    this.initializeProtocols();
  }

  private initializeProtocols() {
    Object.entries(PROTOCOL_CONFIGS).forEach(([chainId, configs]) => {
      const chain = parseInt(chainId) as NetworkChain;
      
      configs.forEach(config => {
        const key = `${config.name}_${chain}`;
        
        switch (config.name) {
          case ProtocolType.UNISWAP_V2:
          case ProtocolType.SUSHISWAP:
          case ProtocolType.PANCAKESWAP:
          case ProtocolType.QUICKSWAP:
          case 'traderjoe':
          case 'pangolin':
            this.protocols.set(key, new UniswapV2Protocol(
              config.rpcUrl,
              config.chainId,
              config.factoryAddress,
              config.routerAddress,
              config.graphEndpoint
            ));
            break;
            
          case ProtocolType.UNISWAP_V3:
            if (config.quoterAddress) {
              this.protocols.set(key, new UniswapV3Protocol(
                config.rpcUrl,
                config.chainId,
                config.factoryAddress,
                config.routerAddress,
                config.quoterAddress,
                config.graphEndpoint
              ));
            }
            break;
            
          case ProtocolType.BALANCER:
            // TODO: Implement Balancer protocol
            break;
            
          case ProtocolType.CURVE:
            // TODO: Implement Curve protocol
            break;
            
          case ProtocolType.ZEROX:
            // TODO: Implement 0x protocol
            break;
            
          case ProtocolType.DODO:
            // TODO: Implement DODO protocol
            break;
            
          case ProtocolType.KYBERSWAP:
            // TODO: Implement KyberSwap protocol
            break;
            
          case ProtocolType.PLATYPUS:
            // TODO: Implement Platypus protocol
            break;
            
          default:
            console.warn(`Protocol ${config.name} not implemented yet`);
        }
      });
    });
  }

  getProtocol(protocolName: string, chainId: NetworkChain): BaseProtocol | undefined {
    const key = `${protocolName}_${chainId}`;
    return this.protocols.get(key);
  }

  getAllProtocols(): BaseProtocol[] {
    return Array.from(this.protocols.values());
  }

  getProtocolsByChain(chainId: NetworkChain): BaseProtocol[] {
    return Array.from(this.protocols.values()).filter(
      protocol => protocol.getChainId() === chainId
    );
  }

  getProtocolNames(): string[] {
    return Array.from(new Set(
      Array.from(this.protocols.keys()).map(key => key.split('_')[0])
    ));
  }

  getSupportedChains(): NetworkChain[] {
    return Array.from(new Set(
      Array.from(this.protocols.values()).map(protocol => protocol.getChainId())
    ));
  }
}

export * from './base';
export * from './uniswap-v2';
export * from './uniswap-v3';
