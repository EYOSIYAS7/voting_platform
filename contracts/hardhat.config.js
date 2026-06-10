require("@nomicfoundation/hardhat-toolbox");
// Load from contracts/.env first, fall back to project-root .env
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    besu: {
      url: process.env.BESU_RPC_URL || "http://172.27.3.251/rpc",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      ...(process.env.BESU_CHAIN_ID
        ? { chainId: parseInt(process.env.BESU_CHAIN_ID) }
        : {}),
      timeout: 60000,
    },
  },
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
