#!/bin/bash
# Verification script for Stylus contract

set -e

echo "🔍 Verifying Stylus Contract..."
echo ""

# Check compilation
echo "1️⃣ Checking compilation..."
cargo check --lib --quiet
echo "   ✅ Contract compiles successfully"
echo ""

# Run tests
echo "2️⃣ Running tests..."
cargo test --lib --target x86_64-unknown-linux-gnu --quiet
echo "   ✅ All tests pass"
echo ""

# Check ABI export
echo "3️⃣ Checking ABI export..."
cargo run --target x86_64-unknown-linux-gnu --features export-abi --bin export-abi --quiet > /tmp/stylus_abi.sol 2>&1
if grep -q "interface ISettlementSwitch" /tmp/stylus_abi.sol; then
    echo "   ✅ ABI exports successfully"
else
    echo "   ❌ ABI export failed"
    exit 1
fi
echo ""

# Count implementations
echo "4️⃣ Checking implementations..."
ADAPTER_COUNT=$(find src/adapters -name "*.rs" -type f | wc -l)
echo "   ✅ Found $ADAPTER_COUNT adapter files"
echo ""

# Check for compilation warnings
echo "5️⃣ Checking for critical warnings..."
ERRORS=$(cargo check --lib 2>&1 | grep -c "^error:" || true)
if [ "$ERRORS" -eq 0 ]; then
    echo "   ✅ No compilation errors"
else
    echo "   ❌ Found $ERRORS errors"
    exit 1
fi
echo ""

echo "✅ All verification checks passed!"
echo ""
echo "📦 Contract is ready for deployment:"
echo "   cargo stylus deploy --private-key \$PRIVATE_KEY"
echo ""

