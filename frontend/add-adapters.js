// Add bridge adapters to the contract
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { arbitrumSepolia } = require('viem/chains');

const CONTRACT_ADDRESS = '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1';
const PRIVATE_KEY = '0x8571c3deb62bd55e40566310bbcc0c41ae4effdd4d0a6bd4330234953f960e53';

// Mock adapter addresses (you can use any non-zero addresses for testing)
const ADAPTERS = [
  '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd', // Stargate
  '0x0e0E3d2C5c292161999474247956EF542caBF8dd', // Hop
  '0x13fDac9F9b4777705db45291bbFF3c972c6d1d97', // Across
];

const ABI = [
  {
    name: 'add_bridge_adapter',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_adapter', type: 'address' }],
    outputs: [],
  },
];

async function addAdapters() {
  console.log('🌉 Adding Bridge Adapters');
  console.log('Contract:', CONTRACT_ADDRESS);
  console.log('');

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('Wallet:', account.address);
  console.log('');

  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
  });

  for (let i = 0; i < ADAPTERS.length; i++) {
    console.log(`${i + 1}. Adding adapter: ${ADAPTERS[i]}`);
    
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'add_bridge_adapter',
        args: [ADAPTERS[i]],
      });
      
      console.log(`   ✅ Tx: ${hash}`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error:`, error.shortMessage || error.message);
      console.log('');
    }
  }

  console.log('🎉 Done! Check Arbiscan to verify:');
  console.log(`https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`);
  console.log('');
  console.log('Once confirmed, refresh your frontend to see routes!');
}

addAdapters();

