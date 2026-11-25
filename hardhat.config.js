require("@nomicfoundation/hardhat-toolbox");

// Sepolia settings come from a .env file (see README). Never commit .env.
require("dotenv").config();
const { SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Local blockchain started with: npx hardhat node
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Ethereum Sepolia testnet. Only added when the .env values exist,
    // so local work never breaks for someone without a .env file.
    ...(SEPOLIA_RPC_URL && PRIVATE_KEY
      ? {
          sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
          },
        }
      : {}),
  },
  // Used by scripts/verify.js to publish the source code on Etherscan
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
  },
  sourcify: { enabled: false },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};
