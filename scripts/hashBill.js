// Prints the SHA-256 fingerprint of one or more bill files.
// Usage: node scripts/hashBill.js samples/bill-001-consultation.txt [more files...]
// With no arguments it hashes every file in samples/.
const fs = require("fs");
const path = require("path");
const { sha256File } = require("./lib");

let files = process.argv.slice(2);
if (files.length === 0) {
  const dir = path.join(__dirname, "..", "samples");
  files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).map((f) => path.join("samples", f));
}

for (const f of files) {
  const size = fs.statSync(f).size;
  console.log(`${path.basename(f).padEnd(40)} ${String(size).padStart(4)} bytes  ${sha256File(f)}`);
}
