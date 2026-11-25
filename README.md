# HayoTrail

**A tamper-proof audit trail for health insurance claims on Ethereum, built for HayoHealth.**

Application area: **Healthcare** (health insurance claim verification)

## What it does

When a clinic in Rwanda bills an insurer, nobody can prove afterwards that the patient was really there, that the bill wasn't changed, or what the insurer was told before it paid. Each side keeps its own records and can edit them. That's how insurance cards get shared, bills get padded or sent twice, and disputes end up as one side's word against the other's.

HayoTrail is a Solidity smart contract that records four moments of every claim on the blockchain, where nobody can change them afterwards:

| # | Moment | Who | Function |
|---|---|---|---|
| 1 | The patient's identity was checked at the clinic (card + face) | HayoHealth (verifier) | `recordVisit` |
| 2 | The clinic submitted the bill. Only its SHA-256 fingerprint goes on-chain | Clinic (provider) | `submitClaim` |
| 3 | HayoHealth cleared the bill, or flagged it with a reason and evidence | HayoHealth (verifier) | `clearClaim` / `flagClaim` |
| 4 | The insurer approved or rejected it. This is final | Insurer | `decideClaim` |

The contract enforces these rules on-chain:

| Rule | Problem it blocks |
|---|---|
| No bill without a verified visit | Card sharing, ghost patients |
| The same bill document can't be submitted twice | Double billing |
| A visit can only be billed once | Double billing under a new document |
| A clinic can only bill its own visits | Billing another clinic's patient |
| Bills above the insurer's agreed tariff are flagged automatically | Tariff violations |
| Only the patient's insurer can decide, and only after screening. Decisions are final | Changing the record afterwards |
| Role-based access (OpenZeppelin `AccessControl`) and an emergency pause (`Pausable`) | Unauthorised use |

Two design choices:
- **No patient data on-chain.** A patient only appears as a hashed member token, and a bill only as the SHA-256 hash of its document.
- **It never moves money.** HayoTrail is a record that every party can trust. A flag means "anomaly for review", never "fraud". A person at the insurer always makes the decision.

All bills, clinics and patients in `samples/` are **fictional**.

## Versions

| Tool | Version |
|---|---|
| Solidity | 0.8.24 (optimizer on, 200 runs) |
| Hardhat | 2.29.1 |
| OpenZeppelin Contracts | 5.1.0 |
| ethers.js | 6 |
| Node.js | 18 or newer (developed on 24.13.0) |
| Network | Ethereum Sepolia testnet (chain ID 11155111) |

## Project layout

```
contracts/HayoTrail.sol      the smart contract
test/HayoTrail.test.js       41 automated tests (TC-01 to TC-41)
scripts/deploy.js            deploys and sets up the insurer, two clinics and tariffs
scripts/demo.js              runs the full claim story and checks every result
scripts/verify.js            publishes the source code on Etherscan
scripts/hashBill.js          prints the SHA-256 fingerprint of a bill file
scripts/ids.js               prints the bytes32 values used in the demo (for Remix / Etherscan)
remix/HayoTrail_flat.sol     the contract in one file, ready to paste into Remix
samples/                     fictional bill documents
deployments/                 addresses written by deploy.js
```

## Deployment guide

### 1. Install

```bash
npm install
npx hardhat compile
```

### 2. Run the tests

```bash
npx hardhat test
npx hardhat coverage
```

You should see `41 passing` and 100% coverage.

### 3. Try it on a local blockchain (optional)

Terminal 1:
```bash
npx hardhat node
```
Terminal 2:
```bash
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/demo.js --network localhost
```

### 4. Deploy to Sepolia with Hardhat

1. Get Sepolia ETH into a test wallet in MetaMask. Use a free faucet, for example the Google Cloud Web3 faucet. About 0.05 ETH is plenty: the whole deploy and demo uses about 3.8 million gas.
2. Copy `.env.example` to `.env` and fill it in:
   ```
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   PRIVATE_KEY=0x...your test wallet's private key...
   ETHERSCAN_API_KEY=...from etherscan.io > API Keys...
   ```
   `.env` is in `.gitignore`, so it never reaches GitHub. Only ever use a test wallet.
3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
   You only have one funded wallet, so the script makes three more wallets for the insurer and the two clinics from your key (the same ones every run) and sends each a little Sepolia ETH for gas. Their keys are never printed or saved.
4. Run the claim story on Sepolia (takes 3 to 5 minutes because it waits for real blocks):
   ```bash
   npx hardhat run scripts/demo.js --network sepolia
   ```
   It ends with `16/16 checks passed`. If it stops because of a network hiccup, run it again. Steps that already happened are skipped.
5. Publish the source code on Etherscan:
   ```bash
   npx hardhat run scripts/verify.js --network sepolia
   ```

### 5. Deploy and interact with Remix IDE

1. Open [remix.ethereum.org](https://remix.ethereum.org), create a file called `HayoTrail_flat.sol` and paste in the contents of `remix/HayoTrail_flat.sol`.
2. **Solidity Compiler** tab: choose compiler `0.8.24`. Under Advanced Configurations, tick **Enable optimization** (200 runs). Click **Compile**.
3. **Deploy & Run** tab: set Environment to **Injected Provider - MetaMask**, with MetaMask on Sepolia. Choose `HayoTrail`, paste your wallet address into the `admin` box next to Deploy, click **Deploy** and confirm in MetaMask.
4. Under **Deployed Contracts**, run these in order. For this short walk-through, one wallet plays every role. The scripted demo uses four separate wallets.

| Function | Inputs |
|---|---|
| `registerInsurer` | your address, `Demo Health Insurance Ltd` |
| `registerProvider` | your address, `Kacyiru Family Clinic (demo)` |
| `setTariff` | `0xc93fa1fed6ed3a03d4893abe5991e482f1f736333b0e2b0274d347e16c3d1aa8`, `15000` |
| `recordVisit` | `0x301ab0467a309ca2690b01ec17d88859d423135324d3ed5e0c6194a8d79d22be`, `0x6f12a6122c509bd435cc167dc8291c54b9b15550ded8cf9459152b67ce8bbfec`, your address, your address |
| `submitClaim` | `0x53a75e4df74694ec62619aec6223b941dd4278cfc1cb1d73bbd46f655b0a978f`, `0x301ab0467a309ca2690b01ec17d88859d423135324d3ed5e0c6194a8d79d22be`, `0xc93fa1fed6ed3a03d4893abe5991e482f1f736333b0e2b0274d347e16c3d1aa8`, `15000` |
| `clearClaim` | `0x53a75e4df74694ec62619aec6223b941dd4278cfc1cb1d73bbd46f655b0a978f` |
| `decideClaim` | `0x53a75e4df74694ec62619aec6223b941dd4278cfc1cb1d73bbd46f655b0a978f`, `true` |
| `getClaim` (free) | `0x53a75e4df74694ec62619aec6223b941dd4278cfc1cb1d73bbd46f655b0a978f` → status `4` (Approved) |

These values come from `node scripts/ids.js`: the procedure code `CONSULT-GP`, visit `VISIT-R001`, member token `MEMBER-R` and the SHA-256 of `samples/bill-001-consultation.txt`.

To use Remix with the contract deployed by Hardhat instead, compile as above, paste its address into **At Address** and click it.

### 6. Check a bill yourself

Anyone can check whether a bill document is the one that was recorded:

```bash
node scripts/hashBill.js samples/bill-001-consultation.txt
```

Paste the hash into `verifyClaimDocument` (or `getClaim`) on Etherscan's **Read Contract** tab. The tampered copy `samples/bill-001-consultation-TAMPERED.txt` gives a different hash and returns `recorded = false`.

## Reading the numbers on Etherscan

| `status` | Meaning | | `flagReason` | Meaning |
|---|---|---|---|---|
| 0 | None | | 0 | None |
| 1 | Submitted | | 1 | IdentityMismatch (card sharing) |
| 2 | Cleared | | 2 | DuplicateService |
| 3 | Flagged | | 3 | TariffViolation |
| 4 | Approved | | 4 | ClinicalMismatch |
| 5 | Rejected | | 5 | Other |

## Sepolia deployment

Filled in after deployment:

| Item | Value |
|---|---|
| HayoTrail (Hardhat) | _see deployments/sepolia.json_ |
| HayoTrail (Remix) | _address from Remix_ |

## Problems I ran into and how I fixed them

- **Only one funded wallet on Sepolia.** The demo needs four parties. The deploy script makes the insurer and clinic wallets from my key in a fixed way and funds them with a little Sepolia ETH, so the roles stay separate, as they would in real life.
- **Public RPCs can be a block behind.** In an earlier project a balance read straight after a transfer showed an old value. The scripts now wait for two confirmations on Sepolia and retry reads until they see the change.
- **Reverted calls show unclear errors.** The demo tests the "should be blocked" cases with `staticCall` (no gas, nothing written) and decodes the contract's custom error names, so the output says exactly which rule stopped it.
- **Windows line endings change file hashes.** Git on Windows can turn LF into CRLF, which changes a file's SHA-256. `.gitattributes` keeps the sample bills byte-for-byte the same.

## Known limitations

- The identity check and screening rules run off-chain in HayoHealth's engine. The contract records their results, but it trusts the verifier role to report honestly. A next step would be to have the verifier sign each check so it can be proven separately.
- A visit can only have one bill. A real visit with several services would bundle them into one bill document.
- Tariffs are a single maximum price per procedure per insurer.

## License

MIT. Uses OpenZeppelin Contracts 5.1.0 (MIT).
