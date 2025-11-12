use ethers::{
    prelude::*,
    providers::{Provider, Http},
    signers::Signer,
};
use std::sync::Arc;
use std::error::Error;

// Contract deployment addresses
const CHAINLINK_ETH_USD_FEED: &str = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const STARGATE_ROUTER: &str = "0x8731d54E9D02c286767d56ac03e8037C07e01e98";

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Connect to Arbitrum Stylus testnet
    let rpc_url = std::env::var("ARBITRUM_STYLUS_RPC")?;
    let provider = Provider::<Http>::try_from(rpc_url)?;
    
    // Set up wallet
    let private_key = std::env::var("PRIVATE_KEY")?;
    let wallet = private_key.parse::<LocalWallet>()?;
    let client = Arc::new(SignerMiddleware::new(provider, wallet));

    println!("Deploying PriceOracle...");
    // Deploy PriceOracle
    let oracle = deploy_contract("PriceOracle", &[], &client).await?;
    
    // Set up price feeds
    oracle
        .set_token_price_feed("USDC".to_string(), CHAINLINK_ETH_USD_FEED.parse()?)
        .send()
        .await?;
        
    println!("Deploying StargateAdapter...");
    // Deploy StargateAdapter
    let stargate = deploy_contract(
        "StargateAdapter",
        &[STARGATE_ROUTER.parse()?],
        &client
    ).await?;
    
    println!("Deploying StablecoinRouter...");
    // Deploy StablecoinRouter
    let router = deploy_contract(
        "StablecoinRouter",
        &[oracle.address()],
        &client
    ).await?;
    
    // Add bridge adapter
    router
        .add_bridge_adapter(stargate.address())
        .send()
        .await?;
        
    println!("Deployment complete!");
    println!("PriceOracle: {:?}", oracle.address());
    println!("StargateAdapter: {:?}", stargate.address());
    println!("StablecoinRouter: {:?}", router.address());
    
    Ok(())
}

async fn deploy_contract<T: ethers::contract::ContractInstance>(
    name: &str,
    args: &[Address],
    client: &Arc<SignerMiddleware<Provider<Http>, LocalWallet>>,
) -> Result<T, Box<dyn Error>> {
    let path = format!("./target/stylus/{}.json", name);
    let abi = std::fs::read_to_string(path)?;
    
    let factory = ContractFactory::new(
        serde_json::from_str(&abi)?,
        Bytes::from_static(&[]),
        client.clone(),
    );
    
    let contract = factory.deploy(args)?.send().await?;
    Ok(contract)
}