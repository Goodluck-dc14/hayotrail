// Publishes HayoTrail's source code on Etherscan so anyone can read it and use the
// "Read Contract" / "Write Contract" tabs. Needs ETHERSCAN_API_KEY in .env.
//
//   npx hardhat run scripts/verify.js --network sepolia
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const file = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(file)) throw new Error(`No deployment found. Run deploy.js on ${hre.network.name} first.`);
  if (!process.env.ETHERSCAN_API_KEY) throw new Error("Add ETHERSCAN_API_KEY=... to your .env file first (see README).");
  const dep = JSON.parse(fs.readFileSync(file, "utf8"));

  console.log(`Verifying HayoTrail at ${dep.contract} on ${hre.network.name}...`);
  try {
    await hre.run("verify:verify", { address: dep.contract, constructorArguments: [dep.admin] });
  } catch (err) {
    if (/already verified/i.test(err.message)) console.log("Already verified, nothing to do.");
    else throw err;
  }
  console.log(`Done: https://sepolia.etherscan.io/address/${dep.contract}#code`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
