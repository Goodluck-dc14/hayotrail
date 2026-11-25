// Prints the bytes32 values used in the demo, ready to paste into Remix or Etherscan.
// Usage: node scripts/ids.js
const { code, memberToken, visitId, sha256File, samples, TARIFFS } = require("./lib");

console.log("Procedure codes (procedureCode)");
for (const [p] of TARIFFS) console.log(`  ${p.padEnd(12)} ${code(p)}`);

console.log("\nVisit IDs (visitId)");
for (const v of ["VISIT-0001", "VISIT-0002", "VISIT-0003", "VISIT-0004", "VISIT-R001"]) console.log(`  ${v.padEnd(12)} ${visitId(v)}`);

console.log("\nMember tokens (memberToken)");
for (const m of ["MEMBER-A", "MEMBER-B", "MEMBER-C", "MEMBER-D", "MEMBER-R"]) console.log(`  ${m.padEnd(12)} ${memberToken(m)}`);

console.log("\nBill fingerprints (claimHash = SHA-256 of the file)");
for (const f of ["bill-001-consultation.txt", "bill-001-consultation-TAMPERED.txt", "bill-002-xray-overpriced.txt", "bill-003-lab-test.txt", "bill-004-malaria-test.txt"]) {
  console.log(`  ${f.padEnd(36)} ${sha256File(samples(f))}`);
}
