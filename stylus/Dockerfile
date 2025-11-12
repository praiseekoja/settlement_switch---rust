# Dockerfile to build Stylus contract reproducibly
# Uses ubuntu and rustup to install a date-pinned nightly, then runs cargo-stylus

FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# Install system deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    curl build-essential pkg-config libssl-dev git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install rustup and cargo in /root
ENV RUSTUP_HOME=/root/.rustup
ENV CARGO_HOME=/root/.cargo
ENV PATH=/root/.cargo/bin:${PATH}

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

# Pin and install the nightly toolchain required by Stylus
ENV TOOLCHAIN=nightly-2024-02-15
RUN rustup toolchain install ${TOOLCHAIN} --no-self-update --profile minimal && \
    rustup component add rust-src --toolchain ${TOOLCHAIN} && \
    rustup target add wasm32-unknown-unknown --toolchain ${TOOLCHAIN}

# Install cargo-stylus (cargo subcommand)
RUN cargo install cargo-stylus || true

WORKDIR /app

# Copy project files
# Use a .dockerignore to keep the image lean (target, .git, node_modules etc.)
COPY . .

# Use cargo's unstable build-std via environment variable and run stylus check
ENV CARGO_UNSTABLE_BUILD_STD=core,alloc

# Regenerate lockfile and run the stylus check using the pinned nightly
RUN cargo +${TOOLCHAIN} generate-lockfile && \
    cargo +${TOOLCHAIN} stylus check

# If check succeeds, you can later run `cargo +${TOOLCHAIN} stylus build` inside the container

CMD ["/bin/bash"]
