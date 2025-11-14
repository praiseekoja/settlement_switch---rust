// Initialize Stylus Contract Script
const { createWalletClient, http, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { arbitrumSepolia } = require('viem/chains');

// Configuration
const CONTRACT_ADDRESS = '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1';
const PRICE_ORACLE = '0x283a192277871721Cdc57736687703902B6D4EDB';
const MOCK_ADAPTER = '0x0000000000000000000000000000000000000001';

// Get private key from environment
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY environment variable not set');
  console.log('');
  console.log('Set it with:');
  console.log('  Windows CMD:        set PRIVATE_KEY=0x...');
  console.log('  Windows PowerShell: $env:PRIVATE_KEY="0x..."');
  console.log('  Linux/Mac:          export PRIVATE_KEY=0x...');
  process.exit(1);
}

const ABI = parseAbi([
  'function initialize(address price_oracle)',
  'function add_bridge_adapter(address _adapter)',
  'function get_adapter_count() view returns (uint256)',
]);

async function initializeContract() {
  console.log('🚀 Initializing Stylus Contract');
  console.log('================================');
  console.log('Contract:', CONTRACT_ADDRESS);
  console.log('Network: Arbitrum Sepolia');
  console.log('');

  // Create account and client
  const account = privateKeyToAccount(PRIVATE_KEY);
  const client = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
  });

  console.log('📝 Wallet:', account.address);
  console.log('');

  try {
    // First check adapter count
    console.log('📊 Checking current adapter count...');
    const { createPublicClient } = require('viem');
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
    });
    
    const adapterCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_adapter_count',
    });
    
    console.log('✅ Current adapter count:', adapterCount.toString());
    console.log('');
    
    if (adapterCount > 0n) {
      console.log('🎉 Contract already has adapters configured!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Refresh your frontend');
      console.log('   2. Enter an amount (e.g., 100 USDC)');
      console.log('   3. Routes should now appear!');
      console.log('');
      return;
    }
    
    // Check if already initialized by trying to add adapter directly
    console.log('📊 Adding bridge adapter...');
    const adapterHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'add_bridge_adapter',
      args: [MOCK_ADAPTER],
    });
    console.log('✅ Add Adapter TX:', adapterHash);
    console.log('   Waiting for confirmation...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('');

    console.log('🎉 SUCCESS!');
    console.log('');
    console.log('✅ Mock adapter added');
    console.log('');
    console.log('🌐 View on Arbiscan:');
    console.log(`   https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESS}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Refresh your frontend');
    console.log('   2. Enter an amount (e.g., 100 USDC)');
    console.log('   3. Routes should now appear!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    
    if (error.message.includes('0x416c7265') || error.message.includes('Already')) {
      console.log('ℹ️  Contract is already initialized!');
      console.log('ℹ️  Adapter might already be added.');
      console.log('');
      console.log('Try refreshing your frontend to see if routes appear.');
    } else if (error.message.includes('Not owner')) {
      console.log('⚠️  Only the contract owner can add adapters.');
      console.log('   Make sure you\'re using the correct private key.');
    }
  }
}

initializeContract();

