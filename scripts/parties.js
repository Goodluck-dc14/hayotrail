// Gets the four wallets used in the deploy and demo scripts.
//
//   admin    = HayoHealth (admin + verifier)  -> your own wallet (PRIVATE_KEY in .env)
//   insurer  = Demo Health Insurance Ltd
//   clinicA  = Kacyiru Family Clinic (demo)
//   clinicB  = Remera Health Centre (demo)
//
// On the local Hardhat node these are simply test accounts #0 to #3.
// On Sepolia you only have one funded wallet, so the other three are made
// from your private key in a fixed way (same wallets every run) and the
// deploy script sends each one a little Sepolia ETH for gas.
// Their keys are never printed or saved.
const { ethers, network } = require("hardhat");

const LABELS = ["insurer", "clinicA", "clinicB"];

async function getParties() {
  const [admin] = await ethers.getSigners();

  if (network.name !== "sepolia") {
    const [, insurer, clinicA, clinicB] = await ethers.getSigners();
    return { admin, insurer, clinicA, clinicB, isTestnet: false };
  }

  const pk = process.env.PRIVATE_KEY;
  const derived = LABELS.map((label) => {
    const key = ethers.keccak256(ethers.concat([ethers.getBytes(pk), ethers.toUtf8Bytes("hayotrail:" + label)]));
    // NonceManager keeps track of nonces locally, which avoids errors with busy public RPCs
    return new ethers.NonceManager(new ethers.Wallet(key, ethers.provider));
  });
  const [insurer, clinicA, clinicB] = derived;
  for (const w of derived) w.address = await w.getAddress();
  return { admin: new ethers.NonceManager(admin), adminAddress: admin.address, insurer, clinicA, clinicB, isTestnet: true };
}

/** On Sepolia, waits for N confirmations so the next read sees the change. */
async function send(txPromise, isTestnet) {
  const tx = await txPromise;
  const receipt = await tx.wait(isTestnet ? 2 : 1);
  return receipt;
}

/** Public RPCs can lag a block behind. Retry a read until it matches what we expect. */
async function readUntil(readFn, isOk, isTestnet, tries = 10) {
  let value;
  for (let i = 0; i < (isTestnet ? tries : 1); i++) {
    value = await readFn();
    if (isOk(value)) return value;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return value;
}

module.exports = { getParties, send, readUntil };
