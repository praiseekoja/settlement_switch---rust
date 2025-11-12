const fs = require("fs");
const path = require("path");

/**
 * Export contract ABIs for frontend use
 */
async function main() {
  console.log("Exporting contract ABIs for frontend...\n");

  const contracts = [
    "StablecoinRouter",
    "PriceOracle",
    "MockUSDC",
    "MockUSDT",
    "MockBridgeAdapter",
    "HopBridgeAdapter",
    "AcrossBridgeAdapter",
    "StargateAdapter"
  ];

  const exportDir = path.join(__dirname, "..", "..", "frontend", "contracts");
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  for (const contractName of contracts) {
    try {
      // Find the artifact file
      let artifactPath;
      
      if (contractName.startsWith("Mock")) {
        // Mock tokens and adapters
        const folder = contractName === "MockUSDC" || contractName === "MockUSDT" ? "mocks" : "adapters";
        artifactPath = path.join(
          __dirname,
          "..",
          "artifacts",
          "contracts",
          folder,
          `${contractName}.sol`,
          `${contractName}.json`
        );
      } else if (contractName.includes("Bridge") || contractName.includes("Adapter")) {
        // Bridge adapters
        artifactPath = path.join(
          __dirname,
          "..",
          "artifacts",
          "contracts",
          "adapters",
          `${contractName}.sol`,
          `${contractName}.json`
        );
      } else {
        // Main contracts
        artifactPath = path.join(
          __dirname,
          "..",
          "artifacts",
          "contracts",
          `${contractName}.sol`,
          `${contractName}.json`
        );
      }

      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        
        // Extract ABI
        const abiData = {
          contractName: contractName,
          abi: artifact.abi
        };

        // Write ABI to frontend directory
        const outputPath = path.join(exportDir, `${contractName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(abiData, null, 2));
        
        console.log(`✅ Exported ${contractName} ABI`);
      } else {
        console.log(`⚠️ Artifact not found for ${contractName}`);
      }
    } catch (error) {
      console.log(`❌ Error exporting ${contractName}:`, error.message);
    }
  }

  // Export deployment addresses if they exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (fs.existsSync(deploymentsDir)) {
    const deploymentFiles = fs.readdirSync(deploymentsDir);
    
    const allDeployments = {};
    for (const file of deploymentFiles) {
      if (file.endsWith(".json")) {
        const network = file.replace(".json", "");
        const deploymentPath = path.join(deploymentsDir, file);
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        allDeployments[network] = deployment;
      }
    }

    const addressesPath = path.join(exportDir, "addresses.json");
    fs.writeFileSync(addressesPath, JSON.stringify(allDeployments, null, 2));
    console.log("\n✅ Exported deployment addresses");
  }

  console.log("\n🎉 ABI export complete!");
  console.log(`📂 Files saved to: ${exportDir}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



