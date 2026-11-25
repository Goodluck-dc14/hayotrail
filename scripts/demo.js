// Runs the full HayoTrail claim story against a deployed contract and checks every result.
//
//   Local:   npx hardhat run scripts/demo.js --network localhost
//   Sepolia: npx hardhat run scripts/demo.js --network sepolia
//
// Run deploy.js first. The demo is safe to run again after a network hiccup:
// steps that already happened on-chain are skipped, not repeated.
const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");
const { getParties, send, readUntil } = require("./parties");
const { sha256File, code, memberToken, visitId, STATUS, REASON, samples } = require("./lib");

let passed = 0;
let failed = 0;
function check(label, ok, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  (" + detail + ")" : ""}`);
}

/** Finds the revert data inside the different error shapes ethers and RPCs return. */
function revertData(err) {
  const seen = new Set();
  const stack = [err];
  while (stack.length) {
    const e = stack.pop();
    if (!e || typeof e !== "object" || seen.has(e)) continue;
    seen.add(e);
    if (typeof e.data === "string" && e.data.startsWith("0x") && e.data.length >= 10) return e.data;
    if (e.data && typeof e.data === "object") stack.push(e.data);
    for (const k of ["error", "info", "cause", "revert"]) if (e[k]) stack.push(e[k]);
  }
  const m = String(err && err.message).match(/0x[0-9a-fA-F]{8,}/);
  return m ? m[0] : null;
}

/** Simulates a call that should fail (no gas spent) and returns the custom error name. */
async function expectBlocked(trail, fnCall) {
  try {
    await fnCall();
    return "NOT BLOCKED";
  } catch (err) {
    if (err.revert && err.revert.name) return err.revert.name;
    const data = revertData(err);
    if (!data) return "unknown error";
    try {
      return trail.interface.parseError(data).name;
    } catch {
      return "unknown error";
    }
  }
}

const short = (h) => h.slice(0, 10) + "..." + h.slice(-6);

async function main() {
  const file = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(file)) throw new Error(`No deployment found. Run deploy.js on ${network.name} first.`);
  const dep = JSON.parse(fs.readFileSync(file, "utf8"));

  const { admin, insurer, clinicA, clinicB, isTestnet } = await getParties();
  const trail = await ethers.getContractAt("HayoTrail", dep.contract, admin);
  const asInsurer = trail.connect(insurer);
  const asClinicA = trail.connect(clinicA);
  const asClinicB = trail.connect(clinicB);

  console.log("==============================================");
  console.log(" HayoTrail interaction demo");
  console.log("==============================================");
  console.log(`Network:  ${network.name}`);
  console.log(`Contract: ${dep.contract}\n`);

  console.log("Step 0: the parties on-chain");
  for (const [label, addr] of [["HayoHealth", dep.admin], ["Insurer", dep.insurer], ["Clinic A", dep.clinicA], ["Clinic B", dep.clinicB]]) {
    const name = label === "HayoHealth" ? "HayoHealth (admin + verifier)" : await trail.partyName(addr);
    console.log(`  ${label.padEnd(10)} ${addr}  ${name}`);
  }
  console.log("");

  // The four claims in the story
  const stories = [
    { title: "Clean consultation bill (approved)", bill: "bill-001-consultation.txt", visit: "VISIT-0001", member: "MEMBER-A", clinic: "A", proc: "CONSULT-GP", amount: 15000, screen: "clear", approve: true },
    { title: "Overpriced X-ray (auto-flagged by the tariff rule, rejected)", bill: "bill-002-xray-overpriced.txt", visit: "VISIT-0002", member: "MEMBER-B", clinic: "A", proc: "XRAY-CHEST", amount: 45000, screen: "auto", approve: false },
    { title: "Lab test flagged by HayoHealth, insurer reviews and approves", bill: "bill-003-lab-test.txt", visit: "VISIT-0003", member: "MEMBER-C", clinic: "A", proc: "LAB-FBC", amount: 8000, screen: "flag", approve: true },
    { title: "Malaria test at clinic B (approved)", bill: "bill-004-malaria-test.txt", visit: "VISIT-0004", member: "MEMBER-D", clinic: "B", proc: "LAB-MALARIA", amount: 5000, screen: "clear", approve: true },
  ];

  let step = 1;
  for (const s of stories) {
    console.log(`Step ${step++}: ${s.title}`);
    const hash = sha256File(samples(s.bill));
    const vId = visitId(s.visit);
    const clinic = s.clinic === "A" ? clinicA : clinicB;
    const asClinic = s.clinic === "A" ? asClinicA : asClinicB;
    console.log(`  bill ${s.bill}  SHA-256 ${short(hash)}`);

    // Moment 1: identity check
    if ((await trail.getVisit(vId)).verifiedAt === 0n) {
      const r = await send(trail.recordVisit(vId, memberToken(s.member), clinic.address, insurer.address), isTestnet);
      console.log(`  1. HayoHealth recordVisit      tx ${r.hash}`);
    } else console.log("  1. visit already recorded, skipping");

    // Moment 2: clinic submits the bill
    if ((await trail.getClaim(hash)).status === 0n) {
      const r = await send(asClinic.submitClaim(hash, vId, code(s.proc), s.amount), isTestnet);
      console.log(`  2. Clinic ${s.clinic} submitClaim ${String(s.amount).padStart(6)} RWF  tx ${r.hash}`);
    } else console.log("  2. bill already submitted, skipping");

    // Moment 3: screening
    let claim = await readUntil(() => trail.getClaim(hash), (c) => c.status !== 0n, isTestnet);
    if (claim.status === 1n && s.screen === "clear") {
      const r = await send(trail.clearClaim(hash), isTestnet);
      console.log(`  3. HayoHealth clearClaim       tx ${r.hash}`);
    } else if (claim.status === 1n && s.screen === "flag") {
      const evidence = ethers.id("Same full blood count billed for MEMBER-C two days earlier at another clinic");
      const r = await send(trail.flagClaim(hash, 2 /* DuplicateService */, evidence), isTestnet);
      console.log(`  3. HayoHealth flagClaim (DuplicateService)  tx ${r.hash}`);
    } else if (s.screen === "auto") {
      console.log(`  3. flagged automatically on submit (amount above the ${s.proc} tariff)`);
    } else console.log("  3. already screened, skipping");

    // Moment 4: insurer decision
    claim = await readUntil(() => trail.getClaim(hash), (c) => c.status === 2n || c.status === 3n || c.status >= 4n, isTestnet);
    if (claim.status === 2n || claim.status === 3n) {
      const r = await send(asInsurer.decideClaim(hash, s.approve), isTestnet);
      console.log(`  4. Insurer decideClaim(${s.approve ? "approve" : "reject"})  tx ${r.hash}`);
    } else console.log("  4. already decided, skipping");

    const want = s.approve ? 4n : 5n;
    claim = await readUntil(() => trail.getClaim(hash), (c) => c.status === want, isTestnet);
    check(`final status is ${STATUS[Number(want)]}`, claim.status === want, `got ${STATUS[Number(claim.status)]}`);
    if (s.screen === "auto") check("flag reason is TariffViolation", claim.flagReason === 3n, `got ${REASON[Number(claim.flagReason)]}`);
    if (s.screen === "flag") check("flag reason DuplicateService is kept on record", claim.flagReason === 2n, `got ${REASON[Number(claim.flagReason)]}`);
    console.log("");
  }

  // Blocked actions: simulated with staticCall, so no gas is spent and nothing is written
  console.log(`Step ${step++}: attempts the contract must block (simulated, no gas)`);
  const bill1 = sha256File(samples("bill-001-consultation.txt"));
  const tampered = sha256File(samples("bill-001-consultation-TAMPERED.txt"));
  const v1 = visitId("VISIT-0001");

  let e = await expectBlocked(trail, () => asClinicA.submitClaim.staticCall(bill1, visitId("VISIT-0002"), code("CONSULT-GP"), 15000));
  check("same bill submitted again -> ClaimAlreadyExists", e === "ClaimAlreadyExists", e);
  e = await expectBlocked(trail, () => asClinicA.submitClaim.staticCall(tampered, visitId("VISIT-9999"), code("CONSULT-GP"), 15000));
  check("bill with no verified visit -> VisitNotFound", e === "VisitNotFound", e);
  e = await expectBlocked(trail, () => asClinicB.submitClaim.staticCall(tampered, v1, code("CONSULT-GP"), 15000));
  check("clinic B billing clinic A's patient -> WrongProvider", e === "WrongProvider", e);
  e = await expectBlocked(trail, () => asClinicA.submitClaim.staticCall(tampered, v1, code("CONSULT-GP"), 18000));
  check("second bill for the same visit -> VisitAlreadyClaimed", e === "VisitAlreadyClaimed", e);
  e = await expectBlocked(trail, () => asInsurer.decideClaim.staticCall(bill1, false));
  check("insurer changing a final decision -> InvalidStatus", e === "InvalidStatus", e);
  e = await expectBlocked(trail, () => asClinicA.clearClaim.staticCall(bill1));
  check("clinic clearing a bill itself -> AccessControlUnauthorizedAccount", e === "AccessControlUnauthorizedAccount", e);
  console.log("");

  // Anyone can check a document
  console.log(`Step ${step++}: checking bill documents (free read calls)`);
  const real = await trail.verifyClaimDocument(bill1);
  check("original bill 001 is recorded and Approved", real.recorded && real.status === 4n, `recorded=${real.recorded}, status=${STATUS[Number(real.status)]}`);
  const fake = await trail.verifyClaimDocument(tampered);
  check("tampered copy (15000 changed to 18000) is NOT recorded", !fake.recorded, `recorded=${fake.recorded}`);
  console.log("");

  // Track records
  console.log(`Step ${step++}: clinic track records (getProviderStats)`);
  for (const [label, addr, want] of [["Clinic A", dep.clinicA, [3n, 2n, 2n, 1n]], ["Clinic B", dep.clinicB, [1n, 0n, 1n, 0n]]]) {
    const st = await readUntil(() => trail.getProviderStats(addr), (v) => v[0] === want[0] && v[2] + v[3] === want[2] + want[3], isTestnet);
    const got = [st[0], st[1], st[2], st[3]];
    console.log(`  ${label}: submitted ${got[0]}, flagged ${got[1]}, approved ${got[2]}, rejected ${got[3]}`);
    check(`${label} stats are correct`, got.every((x, i) => x === want[i]));
  }

  console.log("\n==============================================");
  console.log(` ${passed}/${passed + failed} checks passed`);
  console.log("==============================================");
  if (isTestnet) console.log(`See every transaction: https://sepolia.etherscan.io/address/${dep.contract}`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
