#!/usr/bin/env bash
set -euo pipefail

# WSL helper script to build Stylus contract
# Run inside WSL (Ubuntu) from the project root or point STYLUS_DIR to the stylus folder.

STYLUS_DIR="${1:-$(pwd)}"
if [ ! -f "$STYLUS_DIR/Cargo.toml" ]; then
  echo "stylus directory not found at $STYLUS_DIR"
  echo "Usage: ./wsl_build.sh /path/to/stylus"
  exit 1
fi

cd "$STYLUS_DIR"

# Ensure rustup is installed
if ! command -v rustup >/dev/null 2>&1; then
  echo "Installing rustup..."
  curl https://sh.rustup.rs -sSf | sh -s -- -y
  source "$HOME/.cargo/env"
fi

TOOLCHAIN="nightly-2024-02-15"

echo "Installing toolchain $TOOLCHAIN and components (may take a few minutes)..."
rustup toolchain install "$TOOLCHAIN" --profile minimal --no-self-update --force
rustup component add rust-src --toolchain "$TOOLCHAIN"
rustup target add wasm32-unknown-unknown --toolchain "$TOOLCHAIN"

echo "Installing cargo-stylus (if missing)..."
if ! cargo install --list | grep -q "cargo-stylus"; then
  cargo install cargo-stylus || true
fi

# Ensure rust-toolchain.toml pins the toolchain
cat > rust-toolchain.toml <<EOF
[toolchain]
channel = "$TOOLCHAIN"
components = ["rust-src"]
targets = ["wasm32-unknown-unknown"]
EOF

# Clean and regenerate lockfile with the pinned nightly
rm -f Cargo.lock

export CARGO_UNSTABLE_BUILD_STD="core,alloc"

echo "Generating lockfile and running cargo stylus check with $TOOLCHAIN..."
cargo +${TOOLCHAIN} generate-lockfile
cargo +${TOOLCHAIN} stylus check

echo "Done. If check succeeded, you can run: cargo +${TOOLCHAIN} stylus build"
