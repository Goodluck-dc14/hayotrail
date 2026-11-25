// Shared helpers used by the deploy, demo and hash scripts and by the tests.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ethers } = require("ethers");

/** SHA-256 of a file's exact bytes, as a 0x-prefixed bytes32 string. */
function sha256File(filePath) {
  const bytes = fs.readFileSync(filePath);
  return "0x" + crypto.createHash("sha256").update(bytes).digest("hex");
}

/** Procedure codes are stored on-chain as keccak256 of a short text code. */
const code = (text) => ethers.id(text);

/** A pseudonymous member token. In real life HayoHealth would use a secret salt; here it is fixed for the demo. */
const memberToken = (memberId) => ethers.id("HAYO-MEMBER:" + memberId);

/** A visit ID made from the visit reference. */
const visitId = (ref) => ethers.id("HAYO-VISIT:" + ref);

const STATUS = ["None", "Submitted", "Cleared", "Flagged", "Approved", "Rejected"];
const REASON = ["None", "IdentityMismatch", "DuplicateService", "TariffViolation", "ClinicalMismatch", "Other"];

/** Agreed prices the demo insurer sets (RWF). */
const TARIFFS = [
  ["CONSULT-GP", 15000],
  ["XRAY-CHEST", 30000],
  ["LAB-FBC", 10000],
  ["LAB-MALARIA", 6000],
];

const samples = (file) => path.join(__dirname, "..", "samples", file);

module.exports = { sha256File, code, memberToken, visitId, STATUS, REASON, TARIFFS, samples };
