/**
 * Chainlink Price Feed Addresses for Testnets
 * 
 * Note: Not all feeds are available on all testnets.
 * For missing feeds, you can manually set prices in PriceOracle.sol
 */

module.exports = {
  // Arbitrum Sepolia (421614)
  arbitrumSepolia: {
    // ETH/USD Price Feed
    ethUsd: "0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165",
    
    // Note: USDC/USD and USDT/USD feeds may not be available on Arbitrum Sepolia
    // You'll need to manually set these or use mainnet forking for testing
    usdcUsd: null,
    usdtUsd: null,
  },

  // Polygon Amoy (80002)
  polygonAmoy: {
    // MATIC/USD Price Feed
    maticUsd: "0x001382149eBa3441043c1c66972b4772963f5D43",
    
    // USDC/USD Price Feed
    usdcUsd: null, // May not be available
    
    // USDT/USD Price Feed
    usdtUsd: null, // May not be available
  },

  // Fallback prices for testnets (8 decimals)
  fallbackPrices: {
    // Stablecoins
    usdc: 100000000, // $1.00
    usdt: 100000000, // $1.00
    dai: 100000000,  // $1.00
    
    // Native tokens (approximate)
    eth: 200000000000, // $2,000
    matic: 70000000,   // $0.70
  }
};



