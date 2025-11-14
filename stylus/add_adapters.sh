#!/bin/bash

CONTRACT_ADDRESS="0x443ec868aafd6eba80d124a8cb4345cc827e7ee1"
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set!"
    echo ""
    echo "Please set it first:"
    echo "  export PRIVATE_KEY=0xYourPrivateKeyHere"
    echo ""
    exit 1
fi

echo "🌉 Adding Bridge Adapters to Settlement Switch Contract..."
echo "Contract: $CONTRACT_ADDRESS"
echo ""

# Note: The function signature is add_bridge_adapter(address) - only takes address, not name

# 1. Add Stargate
echo "1️⃣ Adding Stargate bridge adapter..."
echo "   Address: 0x45A01E4e04F14f7A4a6702c74187c5F6222033cd"
cast send $CONTRACT_ADDRESS \
  "addBridgeAdapter(address)" \
  0x45A01E4e04F14f7A4a6702c74187c5F6222033cd \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

if [ $? -eq 0 ]; then
    echo "✅ Stargate adapter added!"
else
    echo "❌ Failed to add Stargate adapter!"
fi

echo ""

# 2. Add Hop
echo "2️⃣ Adding Hop Protocol bridge adapter..."
echo "   Address: 0x0e0E3d2C5c292161999474247956EF542caBF8dd"
cast send $CONTRACT_ADDRESS \
  "addBridgeAdapter(address)" \
  0x0e0E3d2C5c292161999474247956EF542caBF8dd \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

if [ $? -eq 0 ]; then
    echo "✅ Hop Protocol adapter added!"
else
    echo "❌ Failed to add Hop adapter!"
fi

echo ""

# 3. Add Across
echo "3️⃣ Adding Across Protocol bridge adapter..."
echo "   Address: 0x13fDac9F9b4777705db45291bbFF3c972c6d1d97"
cast send $CONTRACT_ADDRESS \
  "addBridgeAdapter(address)" \
  0x13fDac9F9b4777705db45291bbFF3c972c6d1d97 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

if [ $? -eq 0 ]; then
    echo "✅ Across Protocol adapter added!"
else
    echo "❌ Failed to add Across adapter!"
fi

echo ""
echo "🎉 Bridge adapters setup complete!"
echo ""

# Verify
echo "📊 Verifying adapter count..."
ADAPTER_COUNT=$(cast call $CONTRACT_ADDRESS "getAdapterCount()(uint256)" --rpc-url $RPC_URL)
echo "Total adapters: $ADAPTER_COUNT"
echo ""
echo "🔍 View on Arbiscan:"
echo "https://sepolia.arbiscan.io/address/$CONTRACT_ADDRESS"

