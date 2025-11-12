import { createConfig, http } from 'wagmi'
import { arbitrumSepolia, polygonAmoy } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Testnet configuration for Settlement Switch
export const config = getDefaultConfig({
  appName: 'Settlement Switch',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c3a3d3e3f3g3h3i3j3k3l3m3n3o3p3q3', // Optional: Get real one from https://cloud.walletconnect.com
  chains: [arbitrumSepolia, polygonAmoy],
  ssr: true,
  transports: {
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
  },
})

// Contract addresses (UPDATE THESE AFTER DEPLOYMENT)
export const CONTRACTS = {
  [arbitrumSepolia.id]: {
    router: '0x1D6Ca4D34E0533e0A04Bc39B04275f812d36C229', // UPDATE AFTER DEPLOYMENT
    priceOracle: '0x283a192277871721Cdc57736687703902B6D4EDB',
    mockUSDC: '0xcb5CC1A9090CF15333CD85e792901AAEeF63bF52',
    mockUSDT: '0xF104FF2252E003eb6B51f1539Fbb141354Ecd592',
  },
  [polygonAmoy.id]: {
    router: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOYMENT
    priceOracle: '0x0000000000000000000000000000000000000000',
    mockUSDC: '0x0000000000000000000000000000000000000000',
    mockUSDT: '0x0000000000000000000000000000000000000000',
  },
}

// Supported chains for the app
export const SUPPORTED_CHAINS = [arbitrumSepolia, polygonAmoy]

// Chain display info
export const CHAIN_INFO = {
  [arbitrumSepolia.id]: {
    name: 'Arbitrum Sepolia',
    shortName: 'Arbitrum',
    icon: '🔵',
    color: 'blue',
  },
  [polygonAmoy.id]: {
    name: 'Polygon Amoy',
    shortName: 'Polygon',
    icon: '🟣',
    color: 'purple',
  },
}

// Supported tokens
export const TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
]
