const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying VotingPlatform with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const VotingPlatform = await hre.ethers.getContractFactory("VotingPlatform");
  const votingPlatform = await VotingPlatform.deploy();
  await votingPlatform.waitForDeployment();

  const address = await votingPlatform.getAddress();
  console.log("✅ VotingPlatform deployed to:", address);

  // ── Save deployment info ──────────────────────────────────────────────────
  const network = hre.network.name;
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir))
    fs.mkdirSync(deploymentsDir, { recursive: true });

  const artifactJson = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "artifacts",
        "contracts",
        "VotingPlatform.sol",
        "VotingPlatform.json",
      ),
      "utf8",
    ),
  );

  const deploymentData = {
    network,
    contractAddress: address,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifactJson.abi,
  };

  const outPath = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deploymentData, null, 2));
  console.log(`📄 Deployment info saved to: ${outPath}`);

  // ── Copy ABI + address to frontend ───────────────────────────────────────
  const frontendRoot = path.join(__dirname, "..", "..", "frontend");
  const frontendAbiDir = path.join(frontendRoot, "src", "lib", "abi");

  if (fs.existsSync(frontendRoot)) {
    if (!fs.existsSync(frontendAbiDir))
      fs.mkdirSync(frontendAbiDir, { recursive: true });
    fs.writeFileSync(
      path.join(frontendAbiDir, "VotingPlatform.json"),
      JSON.stringify({ address, abi: deploymentData.abi }, null, 2),
    );
    console.log(
      "📦 ABI + address copied to frontend/src/lib/abi/VotingPlatform.json",
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
