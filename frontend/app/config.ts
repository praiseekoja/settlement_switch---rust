import { createConfig, createStorage, cookieStorage, http } from 'wagmi'
import type { CreateConnectorFn } from 'wagmi'
import { arbitrumSepolia, polygonAmoy } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

const CHAINS = [arbitrumSepolia, polygonAmoy] as const
const TRANSPORTS = {
  [arbitrumSepolia.id]: http('https://arb-sepolia.g.alchemy.com/v2/eyL8PDLbOo4xUE59IzB_a'),
  [polygonAmoy.id]: http('https://polygon-amoy.g.alchemy.com/v2/eyL8PDLbOo4xUE59IzB_a'),
} as const

const WALLETCONNECT_PROJECT_ID ='c70427ae3b36182a89e4cb68148c73f7'
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  'c70427ae3b36182a89e4cb68148c73f7' // Optional: Get real one from https://cloud.walletconnect.com

const EMPTY_CONNECTORS: readonly CreateConnectorFn[] = []

const serverConfig = createConfig({
  chains: CHAINS,
  transports: TRANSPORTS,
  ssr: true,
  connectors: EMPTY_CONNECTORS,
})

const createClientConfig = () =>
  getDefaultConfig({
    appName: 'Settlement Switch',
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: CHAINS,
    ssr: true,
    transports: TRANSPORTS,
    storage: createStorage({
      storage: cookieStorage,
    }),
  })

export const config = typeof window === 'undefined' ? serverConfig : createClientConfig()

// Contract addresses (UPDATE THESE AFTER DEPLOYMENT)
export const CONTRACTS = {
  [arbitrumSepolia.id]: {
    router: '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1', // Stylus Router Contract
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

export type ChainId = (typeof SUPPORTED_CHAINS)[number]['id']

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
