// Setup the Stylus contract with adapters
const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { arbitrumSepolia } = require('viem/chains');

const CONTRACT_ADDRESS = '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1';
const PRICE_ORACLE = '0x283a192277871721Cdc57736687703902B6D4EDB';
const PRIVATE_KEY = '0x8571c3deb62bd55e40566310bbcc0c41ae4effdd4d0a6bd4330234953f960e53';

// Bridge adapter addresses
const ADAPTERS = [
  { address: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd', name: 'Stargate' },
  { address: '0x0e0E3d2C5c292161999474247956EF542caBF8dd', name: 'Hop Protocol' },
  { address: '0x13fDac9F9b4777705db45291bbFF3c972c6d1d97', name: 'Across Protocol' },
];

const ABI = [
  {
    name: 'initialize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'price_oracle', type: 'address' }],
    outputs: [],
  },
  {
    name: 'add_bridge_adapter',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_adapter', type: 'address' }],
    outputs: [],
  },
  {
    name: 'get_adapter_count',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
];

async function setup() {
  console.log('🚀 Setting up Settlement Switch Contract');
  console.log('=========================================');
  console.log('Contract:', CONTRACT_ADDRESS);
  console.log('Network: Arbitrum Sepolia');
  console.log('');

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('📝 Wallet:', account.address);
  console.log('');

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
  });

  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
  });

  // Step 1: Check if already initialized
  console.log('📊 Checking initialization status...');
  try {
    const adapterCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_adapter_count',
    });
    console.log(`✅ Contract is initialized (${adapterCount} adapters configured)`);
    console.log('');

    if (adapterCount > 0n) {
      console.log('🎉 Contract is already set up!');
      console.log('   No further action needed.');
      return;
    }
  } catch (error) {
    // If this fails, contract might not be initialized
    console.log('⚠️  Could not read adapter count - contract may not be initialized');
    console.log('');
  }

  // Step 2: Initialize contract
  console.log('1️⃣ Initializing contract with price oracle...');
  console.log(`   Oracle: ${PRICE_ORACLE}`);
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'initialize',
      args: [PRICE_ORACLE],
    });
    console.log(`   Tx: ${hash}`);
    
    await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ Initialization complete!');
  } catch (error) {
    if (error.message.includes('0x416c7265')) {
      console.log('✅ Already initialized!');
    } else {
      console.error('❌ Initialization failed:', error.message);
      return;
    }
  }
  console.log('');

  // Step 3: Add adapters
  for (let i = 0; i < ADAPTERS.length; i++) {
    const adapter = ADAPTERS[i];
    console.log(`${i + 2}️⃣ Adding ${adapter.name} bridge adapter...`);
    console.log(`   Address: ${adapter.address}`);
    
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'add_bridge_adapter',
        args: [adapter.address],
      });
      console.log(`   Tx: ${hash}`);
      
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`✅ ${adapter.name} adapter added!`);
    } catch (error) {
      console.error(`❌ Failed to add ${adapter.name}:`, error.message);
    }
    console.log('');
  }

  // Step 4: Verify
  console.log('📊 Verifying setup...');
  try {
    const adapterCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_adapter_count',
    });
    console.log(`✅ Total adapters configured: ${adapterCount}`);
  } catch (error) {
    console.error('❌ Could not verify:', error.message);
  }

  console.log('');
  console.log('🎉 Contract setup complete!');
  console.log('');
  console.log('🔍 View on Arbiscan:');
  console.log(`https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`);
}

setup().catch(console.error);

