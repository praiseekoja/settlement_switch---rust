/**
 * Contract Configuration for Frontend Integration
 * Copy this to your frontend/app/ or frontend/config/ directory
 * Update addresses after deployment
 */

export interface ContractAddresses {
  router: `0x${string}`;
  priceOracle: `0x${string}`;
  mockUSDC: `0x${string}`;
  mockUSDT: `0x${string}`;
  hopBridge: `0x${string}`;
  acrossBridge: `0x${string}`;
  stargateBridge: `0x${string}`;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: ContractAddresses;
}

// Update these addresses after deployment
export const CONTRACTS: Record<number, NetworkConfig> = {
  // Arbitrum Sepolia
  421614: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {
      router: "0x0000000000000000000000000000000000000000", // UPDATE AFTER DEPLOYMENT
      priceOracle: "0x0000000000000000000000000000000000000000",
      mockUSDC: "0x0000000000000000000000000000000000000000",
      mockUSDT: "0x0000000000000000000000000000000000000000",
      hopBridge: "0x0000000000000000000000000000000000000000",
      acrossBridge: "0x0000000000000000000000000000000000000000",
      stargateBridge: "0x0000000000000000000000000000000000000000",
    },
  },
  // Polygon Amoy
  80002: {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    contracts: {
      router: "0x0000000000000000000000000000000000000000", // UPDATE AFTER DEPLOYMENT
      priceOracle: "0x0000000000000000000000000000000000000000",
      mockUSDC: "0x0000000000000000000000000000000000000000",
      mockUSDT: "0x0000000000000000000000000000000000000000",
      hopBridge: "0x0000000000000000000000000000000000000000",
      acrossBridge: "0x0000000000000000000000000000000000000000",
      stargateBridge: "0x0000000000000000000000000000000000000000",
    },
  },
};

// Helper function to get contract addresses for a chain
export function getContractAddresses(chainId: number): ContractAddresses | null {
  return CONTRACTS[chainId]?.contracts || null;
}

// Helper function to get network config
export function getNetworkConfig(chainId: number): NetworkConfig | null {
  return CONTRACTS[chainId] || null;
}

// Supported chains
export const SUPPORTED_CHAINS = [421614, 80002];

// Chain names mapping
export const CHAIN_NAMES: Record<number, string> = {
  421614: "Arbitrum Sepolia",
  80002: "Polygon Amoy",
};

// Token decimals
export const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  MATIC: 18,
};

// Bridge names
export const BRIDGE_NAMES = {
  HOP: "Hop Protocol",
  ACROSS: "Across Protocol",
  STARGATE: "Stargate Finance",
};



