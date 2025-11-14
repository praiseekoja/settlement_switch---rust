// Just initialize the contract
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { arbitrumSepolia } = require('viem/chains');

const CONTRACT_ADDRESS = '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1';
const PRICE_ORACLE = '0x283a192277871721Cdc57736687703902B6D4EDB';
const PRIVATE_KEY = '0x8571c3deb62bd55e40566310bbcc0c41ae4effdd4d0a6bd4330234953f960e53';

const ABI = [
  {
    name: 'initialize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'price_oracle', type: 'address' }],
    outputs: [],
  },
];

async function init() {
  console.log('🚀 Initializing Contract');
  console.log('Contract:', CONTRACT_ADDRESS);
  console.log('Oracle:', PRICE_ORACLE);
  console.log('');

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('Wallet:', account.address);
  console.log('');

  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
  });

  console.log('Sending transaction...');
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'initialize',
      args: [PRICE_ORACLE],
    });
    
    console.log('✅ Transaction sent:', hash);
    console.log('');
    console.log('View on Arbiscan:');
    console.log(`https://sepolia.arbiscan.io/tx/${hash}`);
    console.log('');
    console.log('⏳ Waiting for confirmation...');
    
    // Note: We're not waiting for receipt to speed this up
    // Check Arbiscan to see if it succeeded
    
  } catch (error) {
    if (error.message.includes('Already initialized') || error.message.includes('0x416c7265')) {
      console.log('✅ Contract is already initialized!');
      console.log('');
      console.log('Now run: node frontend\\add-adapters.js');
    } else {
      console.error('❌ Error:', error.shortMessage || error.message);
    }
  }
}

init();

