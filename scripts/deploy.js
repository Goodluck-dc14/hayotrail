// Deploys HayoTrail and sets it up with one insurer, two clinics and the agreed tariffs.
//
//   Local:   npx hardhat run scripts/deploy.js --network localhost
//   Sepolia: npx hardhat run scripts/deploy.js --network sepolia
//
// The contract address is saved to deployments/<network>.json for demo.js and verify.js.
const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");
const { getParties, send } = require("./parties");
const { code, TARIFFS } = require("./lib");

// Each demo wallet (insurer, clinic A, clinic B) uses well under 700,000 gas in deploy + demo.
// We send enough for that at today's gas price, with a minimum of 0.001 ETH.
const GAS_BUDGET_PER_WALLET = 700000n;
const MIN_TOP_UP = ethers.parseEther("0.001");

async function main() {
  const { admin, adminAddress, insurer, clinicA, clinicB, isTestnet } = await getParties();
  const adminAddr = adminAddress || admin.address;
  const { chainId } = await ethers.provider.getNetwork();

  console.log("==============================================");
  console.log(" HayoTrail deployment");
  console.log("==============================================");
  console.log(`Network:        ${network.name} (chain ID ${chainId})`);
  console.log(`Deployer/admin: ${adminAddr} (HayoHealth)`);
  console.log(`Balance:        ${ethers.formatEther(await ethers.provider.getBalance(adminAddr))} ETH\n`);

  // 1. On Sepolia, make sure the insurer and clinic wallets have a little ETH for gas
  if (isTestnet) {
    console.log("Step 1: funding demo wallets with Sepolia ETH for gas");
    const fee = await ethers.provider.getFeeData();
    const price = fee.maxFeePerGas || fee.gasPrice;
    let topUp = price * GAS_BUDGET_PER_WALLET;
    if (topUp < MIN_TOP_UP) topUp = MIN_TOP_UP;
    console.log(`  gas price now about ${ethers.formatUnits(price, "gwei")} gwei, so each wallet gets ${ethers.formatEther(topUp)} ETH`);
    for (const [name, w] of [["insurer", insurer], ["clinicA", clinicA], ["clinicB", clinicB]]) {
      const bal = await ethers.provider.getBalance(w.address);
      if (bal < topUp / 2n) {
        await send(admin.sendTransaction({ to: w.address, value: topUp - bal }), isTestnet);
        console.log(`  sent ${ethers.formatEther(topUp - bal)} ETH to ${name.padEnd(8)} ${w.address}`);
      } else {
        console.log(`  ${name.padEnd(8)} ${w.address} already has ${ethers.formatEther(bal)} ETH`);
      }
    }
    console.log("");
  }

  // 2. Deploy the contract. The constructor gives the admin the admin + verifier roles.
  console.log("Step 2: deploying HayoTrail");
  const Factory = await ethers.getContractFactory("HayoTrail", admin);
  const trail = await Factory.deploy(adminAddr);
  const deployTx = trail.deploymentTransaction();
  await deployTx.wait(isTestnet ? 2 : 1);
  const address = await trail.getAddress();
  const deployReceipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
  console.log(`  HayoTrail deployed at: ${address}`);
  console.log(`  tx: ${deployTx.hash} (block ${deployReceipt.blockNumber})\n`);

  // 3. Register the parties
  console.log("Step 3: registering the insurer and clinics");
  let r = await send(trail.registerInsurer(insurer.address, "Demo Health Insurance Ltd"), isTestnet);
  console.log(`  insurer  ${insurer.address}  Demo Health Insurance Ltd      tx ${r.hash}`);
  r = await send(trail.registerProvider(clinicA.address, "Kacyiru Family Clinic (demo)"), isTestnet);
  console.log(`  clinic A ${clinicA.address}  Kacyiru Family Clinic (demo)   tx ${r.hash}`);
  r = await send(trail.registerProvider(clinicB.address, "Remera Health Centre (demo)"), isTestnet);
  console.log(`  clinic B ${clinicB.address}  Remera Health Centre (demo)    tx ${r.hash}\n`);

  // 4. The insurer records its agreed prices
  console.log("Step 4: insurer sets agreed tariffs (RWF)");
  const asInsurer = trail.connect(insurer);
  for (const [proc, max] of TARIFFS) {
    r = await send(asInsurer.setTariff(code(proc), max), isTestnet);
    console.log(`  ${proc.padEnd(12)} max ${String(max).padStart(6)}   tx ${r.hash}`);
  }

  // 5. Save the addresses (never any keys) for the other scripts
  const out = {
    network: network.name,
    chainId: Number(chainId),
    contract: address,
    deployTx: deployTx.hash,
    deployBlock: deployReceipt.blockNumber,
    admin: adminAddr,
    insurer: insurer.address,
    clinicA: clinicA.address,
    clinicB: clinicB.address,
    deployedAt: new Date().toISOString(),
  };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${network.name}.json`), JSON.stringify(out, null, 2) + "\n");

  console.log(`\nSaved to deployments/${network.name}.json`);
  if (isTestnet) console.log(`Etherscan: https://sepolia.etherscan.io/address/${address}`);
  console.log("Deployment complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
