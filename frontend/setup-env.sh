#!/bin/bash
# Setup script for creating .env.local file

echo "Creating .env.local file..."
echo ""

cat > .env.local << 'EOF'
# ========================================
# Settlement Switch - Frontend Environment Variables
# ========================================

# ========================================
# WALLETCONNECT (OPTIONAL)
# ========================================
# Get your project ID from: https://cloud.walletconnect.com
# If not set, a default placeholder will be used
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
EOF

echo ""
echo "✓ .env.local file created successfully!"
echo ""
echo "To customize, edit: frontend/.env.local"
echo ""

