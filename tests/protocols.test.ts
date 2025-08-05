import { ProtocolManager } from '../src/protocols';
import { NetworkChain, ProtocolType } from '../src/types';

describe('ProtocolManager', () => {
  let protocolManager: ProtocolManager;

  beforeEach(() => {
    protocolManager = new ProtocolManager();
  });

  describe('Initialization', () => {
    test('should initialize without errors', () => {
      expect(protocolManager).toBeInstanceOf(ProtocolManager);
    });

    test('should have protocols loaded', () => {
      const protocols = protocolManager.getAllProtocols();
      expect(protocols.length).toBeGreaterThan(0);
    });

    test('should support multiple chains', () => {
      const chains = protocolManager.getSupportedChains();
      expect(chains).toContain(NetworkChain.ETHEREUM);
      expect(chains).toContain(NetworkChain.POLYGON);
      expect(chains).toContain(NetworkChain.BSC);
      expect(chains).toContain(NetworkChain.ARBITRUM);
      expect(chains.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Protocol Management', () => {
    test('should get protocol by name and chain', () => {
      const protocol = protocolManager.getProtocol(
        ProtocolType.UNISWAP_V2, 
        NetworkChain.ETHEREUM
      );
      expect(protocol).toBeDefined();
      expect(protocol?.getName()).toBe(ProtocolType.UNISWAP_V2);
      expect(protocol?.getChainId()).toBe(NetworkChain.ETHEREUM);
    });

    test('should return undefined for non-existent protocol', () => {
      const protocol = protocolManager.getProtocol(
        'non_existent_protocol' as any, 
        NetworkChain.ETHEREUM
      );
      expect(protocol).toBeUndefined();
    });

    test('should get protocols by chain', () => {
      const ethereumProtocols = protocolManager.getProtocolsByChain(NetworkChain.ETHEREUM);
      expect(ethereumProtocols.length).toBeGreaterThan(0);
      ethereumProtocols.forEach(protocol => {
        expect(protocol.getChainId()).toBe(NetworkChain.ETHEREUM);
      });
    });

    test('should get all protocol names', () => {
      const names = protocolManager.getProtocolNames();
      expect(names).toContain(ProtocolType.UNISWAP_V2);
      expect(names).toContain(ProtocolType.UNISWAP_V3);
      expect(names).toContain(ProtocolType.SUSHISWAP);
      expect(names.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Protocol Coverage', () => {
    test('should have at least 15 protocols across all chains', () => {
      const allProtocols = protocolManager.getAllProtocols();
      expect(allProtocols.length).toBeGreaterThanOrEqual(15);
    });

    test('should support major protocols on Ethereum', () => {
      const ethereumProtocols = protocolManager.getProtocolsByChain(NetworkChain.ETHEREUM);
      const protocolNames = ethereumProtocols.map(p => p.getName());
      
      expect(protocolNames).toContain(ProtocolType.UNISWAP_V2);
      expect(protocolNames).toContain(ProtocolType.UNISWAP_V3);
      expect(protocolNames).toContain(ProtocolType.SUSHISWAP);
    });

    test('should support major protocols on Polygon', () => {
      const polygonProtocols = protocolManager.getProtocolsByChain(NetworkChain.POLYGON);
      const protocolNames = polygonProtocols.map(p => p.getName());
      
      expect(protocolNames).toContain(ProtocolType.QUICKSWAP);
      expect(protocolNames).toContain(ProtocolType.SUSHISWAP);
      expect(protocolNames).toContain(ProtocolType.UNISWAP_V3);
    });

    test('should support PancakeSwap on BSC', () => {
      const bscProtocols = protocolManager.getProtocolsByChain(NetworkChain.BSC);
      const protocolNames = bscProtocols.map(p => p.getName());
      
      expect(protocolNames).toContain(ProtocolType.PANCAKESWAP);
    });
  });
});