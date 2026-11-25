// Automated tests for HayoTrail.
// Each test has an ID (TC-01, TC-02, ...) that matches the Test Cases document.
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { sha256File, code, memberToken, visitId, samples } = require("../scripts/lib");

// Status and reason numbers, same order as the enums in the contract
const S = { None: 0, Submitted: 1, Cleared: 2, Flagged: 3, Approved: 4, Rejected: 5 };
const R = { None: 0, IdentityMismatch: 1, DuplicateService: 2, TariffViolation: 3, ClinicalMismatch: 4, Other: 5 };

const BILL1 = sha256File(samples("bill-001-consultation.txt"));
const BILL1_TAMPERED = sha256File(samples("bill-001-consultation-TAMPERED.txt"));
const BILL2 = sha256File(samples("bill-002-xray-overpriced.txt"));
const GP = code("CONSULT-GP");
const XRAY = code("XRAY-CHEST");
const V1 = visitId("VISIT-0001");
const V2 = visitId("VISIT-0002");
const MEMBER_A = memberToken("MEMBER-A");
const EVIDENCE = ethers.id("evidence: face check score 0.41 below threshold");

describe("HayoTrail", function () {
  // A fresh contract with an insurer, two clinics and tariffs, reused by every test
  async function deployFixture() {
    const [admin, insurer, clinicA, clinicB, stranger, insurer2] = await ethers.getSigners();
    const trail = await ethers.deployContract("HayoTrail", [admin.address]);

    await trail.registerInsurer(insurer.address, "Demo Health Insurance Ltd");
    await trail.registerInsurer(insurer2.address, "Other Insurer Ltd");
    await trail.registerProvider(clinicA.address, "Kacyiru Family Clinic");
    await trail.registerProvider(clinicB.address, "Remera Health Centre");
    await trail.connect(insurer).setTariff(GP, 15000);
    await trail.connect(insurer).setTariff(XRAY, 30000);

    return { trail, admin, insurer, clinicA, clinicB, stranger, insurer2 };
  }

  // Same as above, plus one verified visit at clinic A
  async function visitFixture() {
    const f = await deployFixture();
    await f.trail.recordVisit(V1, MEMBER_A, f.clinicA.address, f.insurer.address);
    return f;
  }

  // Same as above, plus bill 1 submitted for that visit
  async function submittedFixture() {
    const f = await visitFixture();
    await f.trail.connect(f.clinicA).submitClaim(BILL1, V1, GP, 15000);
    return f;
  }

  describe("Deployment and roles", function () {
    it("TC-01: gives the admin the admin and verifier roles", async function () {
      const { trail, admin } = await loadFixture(deployFixture);
      expect(await trail.hasRole(await trail.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
      expect(await trail.hasRole(await trail.VERIFIER_ROLE(), admin.address)).to.equal(true);
    });

    it("TC-02: rejects deployment with a zero admin address", async function () {
      const Factory = await ethers.getContractFactory("HayoTrail");
      await expect(Factory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(Factory, "ZeroAddress");
    });

    it("TC-03: registers a clinic, stores its name and emits ProviderRegistered", async function () {
      const { trail, stranger } = await loadFixture(deployFixture);
      await expect(trail.registerProvider(stranger.address, "Test Clinic"))
        .to.emit(trail, "ProviderRegistered")
        .withArgs(stranger.address, "Test Clinic");
      expect(await trail.hasRole(await trail.PROVIDER_ROLE(), stranger.address)).to.equal(true);
      expect(await trail.partyName(stranger.address)).to.equal("Test Clinic");
    });

    it("TC-04: registers an insurer and emits InsurerRegistered", async function () {
      const { trail, stranger } = await loadFixture(deployFixture);
      await expect(trail.registerInsurer(stranger.address, "New Insurer"))
        .to.emit(trail, "InsurerRegistered")
        .withArgs(stranger.address, "New Insurer");
      expect(await trail.hasRole(await trail.INSURER_ROLE(), stranger.address)).to.equal(true);
    });

    it("TC-05: blocks a non-admin from registering a clinic", async function () {
      const { trail, stranger } = await loadFixture(deployFixture);
      await expect(trail.connect(stranger).registerProvider(stranger.address, "Fake Clinic"))
        .to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
      await expect(trail.connect(stranger).registerInsurer(stranger.address, "Fake Insurer"))
        .to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
    });

    it("TC-06: rejects registering the zero address", async function () {
      const { trail } = await loadFixture(deployFixture);
      await expect(trail.registerProvider(ethers.ZeroAddress, "x")).to.be.revertedWithCustomError(trail, "ZeroAddress");
      await expect(trail.registerInsurer(ethers.ZeroAddress, "x")).to.be.revertedWithCustomError(trail, "ZeroAddress");
    });
  });

  describe("Tariffs", function () {
    it("TC-07: lets an insurer set an agreed price and emits TariffSet", async function () {
      const { trail, insurer } = await loadFixture(deployFixture);
      const LAB = code("LAB-FBC");
      await expect(trail.connect(insurer).setTariff(LAB, 10000))
        .to.emit(trail, "TariffSet")
        .withArgs(insurer.address, LAB, 10000);
      expect(await trail.tariffOf(insurer.address, LAB)).to.equal(10000);
    });

    it("TC-08: blocks a clinic from setting tariffs", async function () {
      const { trail, clinicA } = await loadFixture(deployFixture);
      await expect(trail.connect(clinicA).setTariff(GP, 99999))
        .to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
    });

    it("TC-09: rejects a zero tariff or empty procedure code", async function () {
      const { trail, insurer } = await loadFixture(deployFixture);
      await expect(trail.connect(insurer).setTariff(GP, 0)).to.be.revertedWithCustomError(trail, "ZeroValue");
      await expect(trail.connect(insurer).setTariff(ethers.ZeroHash, 100)).to.be.revertedWithCustomError(trail, "ZeroValue");
    });
  });

  describe("Moment 1: identity check (recordVisit)", function () {
    it("TC-10: records a verified visit with the member token, clinic and insurer", async function () {
      const { trail, clinicA, insurer } = await loadFixture(deployFixture);
      await expect(trail.recordVisit(V1, MEMBER_A, clinicA.address, insurer.address))
        .to.emit(trail, "VisitVerified")
        .withArgs(V1, MEMBER_A, clinicA.address, insurer.address);
      const visit = await trail.getVisit(V1);
      expect(visit.memberToken).to.equal(MEMBER_A);
      expect(visit.provider).to.equal(clinicA.address);
      expect(visit.verifiedAt).to.be.greaterThan(0);
      expect(visit.claimed).to.equal(false);
      expect(await trail.totalVisits()).to.equal(1);
    });

    it("TC-11: rejects recording the same visit twice", async function () {
      const { trail, clinicA, insurer } = await loadFixture(visitFixture);
      await expect(trail.recordVisit(V1, MEMBER_A, clinicA.address, insurer.address))
        .to.be.revertedWithCustomError(trail, "VisitAlreadyRecorded");
    });

    it("TC-12: only HayoHealth (verifier) can record visits", async function () {
      const { trail, clinicA, insurer } = await loadFixture(deployFixture);
      await expect(trail.connect(clinicA).recordVisit(V1, MEMBER_A, clinicA.address, insurer.address))
        .to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
    });

    it("TC-13: rejects a visit at an unregistered clinic or with an unregistered insurer", async function () {
      const { trail, clinicA, insurer, stranger } = await loadFixture(deployFixture);
      await expect(trail.recordVisit(V1, MEMBER_A, stranger.address, insurer.address))
        .to.be.revertedWithCustomError(trail, "NotAProvider");
      await expect(trail.recordVisit(V1, MEMBER_A, clinicA.address, stranger.address))
        .to.be.revertedWithCustomError(trail, "NotAnInsurer");
    });

    it("TC-14: rejects an empty visit ID or member token", async function () {
      const { trail, clinicA, insurer } = await loadFixture(deployFixture);
      await expect(trail.recordVisit(ethers.ZeroHash, MEMBER_A, clinicA.address, insurer.address))
        .to.be.revertedWithCustomError(trail, "ZeroValue");
      await expect(trail.recordVisit(V1, ethers.ZeroHash, clinicA.address, insurer.address))
        .to.be.revertedWithCustomError(trail, "ZeroValue");
    });
  });

  describe("Moment 2: clinic submits a bill (submitClaim)", function () {
    it("TC-15: a clinic submits a bill for its verified visit", async function () {
      const { trail, clinicA, insurer } = await loadFixture(visitFixture);
      await expect(trail.connect(clinicA).submitClaim(BILL1, V1, GP, 15000))
        .to.emit(trail, "ClaimSubmitted")
        .withArgs(BILL1, V1, clinicA.address, GP, 15000);
      const claim = await trail.getClaim(BILL1);
      expect(claim.status).to.equal(S.Submitted);
      expect(claim.amount).to.equal(15000);
      expect(claim.insurer).to.equal(insurer.address);
      expect((await trail.getVisit(V1)).claimed).to.equal(true);
    });

    it("TC-16: blocks a bill with no verified visit (card sharing / ghost patient)", async function () {
      const { trail, clinicA } = await loadFixture(deployFixture);
      await expect(trail.connect(clinicA).submitClaim(BILL1, V1, GP, 15000))
        .to.be.revertedWithCustomError(trail, "VisitNotFound");
    });

    it("TC-17: blocks the same bill document being submitted twice (double billing)", async function () {
      const { trail, clinicA, insurer } = await loadFixture(submittedFixture);
      await trail.recordVisit(V2, MEMBER_A, clinicA.address, insurer.address);
      await expect(trail.connect(clinicA).submitClaim(BILL1, V2, GP, 15000))
        .to.be.revertedWithCustomError(trail, "ClaimAlreadyExists");
    });

    it("TC-18: blocks a second bill for the same visit under a new document", async function () {
      const { trail, clinicA } = await loadFixture(submittedFixture);
      await expect(trail.connect(clinicA).submitClaim(BILL1_TAMPERED, V1, GP, 18000))
        .to.be.revertedWithCustomError(trail, "VisitAlreadyClaimed");
    });

    it("TC-19: blocks a clinic from billing another clinic's visit", async function () {
      const { trail, clinicB } = await loadFixture(visitFixture);
      await expect(trail.connect(clinicB).submitClaim(BILL1, V1, GP, 15000))
        .to.be.revertedWithCustomError(trail, "WrongProvider");
    });

    it("TC-20: blocks an unregistered wallet from submitting bills", async function () {
      const { trail, stranger } = await loadFixture(visitFixture);
      await expect(trail.connect(stranger).submitClaim(BILL1, V1, GP, 15000))
        .to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
    });

    it("TC-21: rejects a zero amount or empty hash", async function () {
      const { trail, clinicA } = await loadFixture(visitFixture);
      await expect(trail.connect(clinicA).submitClaim(BILL1, V1, GP, 0)).to.be.revertedWithCustomError(trail, "ZeroValue");
      await expect(trail.connect(clinicA).submitClaim(ethers.ZeroHash, V1, GP, 100)).to.be.revertedWithCustomError(trail, "ZeroValue");
      await expect(trail.connect(clinicA).submitClaim(BILL1, V1, ethers.ZeroHash, 100)).to.be.revertedWithCustomError(trail, "ZeroValue");
    });

    it("TC-22: automatically flags a bill above the agreed tariff (TariffViolation)", async function () {
      const { trail, clinicA, insurer } = await loadFixture(deployFixture);
      await trail.recordVisit(V2, MEMBER_A, clinicA.address, insurer.address);
      await expect(trail.connect(clinicA).submitClaim(BILL2, V2, XRAY, 45000))
        .to.emit(trail, "ClaimFlagged")
        .withArgs(BILL2, R.TariffViolation, ethers.ZeroHash, clinicA.address);
      const claim = await trail.getClaim(BILL2);
      expect(claim.status).to.equal(S.Flagged);
      expect(claim.flagReason).to.equal(R.TariffViolation);
    });

    it("TC-23: does not flag a bill exactly at the tariff", async function () {
      const { trail } = await loadFixture(submittedFixture); // 15000 against a 15000 tariff
      expect((await trail.getClaim(BILL1)).status).to.equal(S.Submitted);
    });
  });

  describe("Moment 3: HayoHealth screening (clearClaim / flagClaim)", function () {
    it("TC-24: HayoHealth clears a clean bill", async function () {
      const { trail, admin } = await loadFixture(submittedFixture);
      await expect(trail.clearClaim(BILL1)).to.emit(trail, "ClaimCleared").withArgs(BILL1, admin.address);
      const claim = await trail.getClaim(BILL1);
      expect(claim.status).to.equal(S.Cleared);
      expect(claim.screenedAt).to.be.greaterThan(0);
    });

    it("TC-25: HayoHealth flags a bill with a reason and evidence hash", async function () {
      const { trail, admin } = await loadFixture(submittedFixture);
      await expect(trail.flagClaim(BILL1, R.IdentityMismatch, EVIDENCE))
        .to.emit(trail, "ClaimFlagged")
        .withArgs(BILL1, R.IdentityMismatch, EVIDENCE, admin.address);
      const claim = await trail.getClaim(BILL1);
      expect(claim.status).to.equal(S.Flagged);
      expect(claim.evidenceHash).to.equal(EVIDENCE);
    });

    it("TC-26: rejects a flag with reason None", async function () {
      const { trail } = await loadFixture(submittedFixture);
      await expect(trail.flagClaim(BILL1, R.None, EVIDENCE)).to.be.revertedWithCustomError(trail, "InvalidFlagReason");
    });

    it("TC-27: a bill cannot be screened twice", async function () {
      const { trail } = await loadFixture(submittedFixture);
      await trail.clearClaim(BILL1);
      await expect(trail.clearClaim(BILL1)).to.be.revertedWithCustomError(trail, "InvalidStatus");
      await expect(trail.flagClaim(BILL1, R.Other, EVIDENCE)).to.be.revertedWithCustomError(trail, "InvalidStatus");
    });

    it("TC-28: a clinic cannot clear its own bill, and unknown bills cannot be screened", async function () {
      const { trail, clinicA } = await loadFixture(submittedFixture);
      await expect(trail.connect(clinicA).clearClaim(BILL1)).to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
      await expect(trail.connect(clinicA).flagClaim(BILL1, R.Other, EVIDENCE)).to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
      await expect(trail.flagClaim(BILL2, R.Other, EVIDENCE)).to.be.revertedWithCustomError(trail, "ClaimNotFound");
      await expect(trail.clearClaim(BILL2)).to.be.revertedWithCustomError(trail, "ClaimNotFound");
    });
  });

  describe("Moment 4: insurer decision (decideClaim)", function () {
    it("TC-29: the insurer approves a cleared bill", async function () {
      const { trail, insurer } = await loadFixture(submittedFixture);
      await trail.clearClaim(BILL1);
      await expect(trail.connect(insurer).decideClaim(BILL1, true))
        .to.emit(trail, "ClaimDecided")
        .withArgs(BILL1, true, insurer.address);
      expect((await trail.getClaim(BILL1)).status).to.equal(S.Approved);
    });

    it("TC-30: the insurer rejects a flagged bill", async function () {
      const { trail, insurer } = await loadFixture(submittedFixture);
      await trail.flagClaim(BILL1, R.ClinicalMismatch, EVIDENCE);
      await trail.connect(insurer).decideClaim(BILL1, false);
      expect((await trail.getClaim(BILL1)).status).to.equal(S.Rejected);
    });

    it("TC-31: the insurer cannot decide before screening", async function () {
      const { trail, insurer } = await loadFixture(submittedFixture);
      await expect(trail.connect(insurer).decideClaim(BILL1, true)).to.be.revertedWithCustomError(trail, "InvalidStatus");
    });

    it("TC-32: a decision is final and cannot be changed", async function () {
      const { trail, insurer } = await loadFixture(submittedFixture);
      await trail.clearClaim(BILL1);
      await trail.connect(insurer).decideClaim(BILL1, true);
      await expect(trail.connect(insurer).decideClaim(BILL1, false)).to.be.revertedWithCustomError(trail, "InvalidStatus");
    });

    it("TC-33: only the patient's own insurer can decide", async function () {
      const { trail, insurer2, clinicA } = await loadFixture(submittedFixture);
      await trail.clearClaim(BILL1);
      await expect(trail.connect(insurer2).decideClaim(BILL1, true)).to.be.revertedWithCustomError(trail, "WrongInsurer");
      await expect(trail.connect(clinicA).decideClaim(BILL1, true)).to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
    });

    it("TC-34: deciding on a bill that does not exist is rejected", async function () {
      const { trail, insurer } = await loadFixture(deployFixture);
      await expect(trail.connect(insurer).decideClaim(BILL1, true)).to.be.revertedWithCustomError(trail, "ClaimNotFound");
    });
  });

  describe("Read functions, statistics and safety", function () {
    it("TC-35: verifyClaimDocument confirms the real bill and catches a tampered copy", async function () {
      const { trail } = await loadFixture(submittedFixture);
      const real = await trail.verifyClaimDocument(BILL1);
      expect(real.recorded).to.equal(true);
      expect(real.status).to.equal(S.Submitted);
      const fake = await trail.verifyClaimDocument(BILL1_TAMPERED);
      expect(fake.recorded).to.equal(false);
      expect(fake.status).to.equal(S.None);
    });

    it("TC-36: getProviderStats counts submitted, flagged, approved and rejected bills", async function () {
      const { trail, clinicA, insurer } = await loadFixture(submittedFixture);
      await trail.clearClaim(BILL1);
      await trail.connect(insurer).decideClaim(BILL1, true);
      await trail.recordVisit(V2, MEMBER_A, clinicA.address, insurer.address);
      await trail.connect(clinicA).submitClaim(BILL2, V2, XRAY, 45000); // auto-flagged
      await trail.connect(insurer).decideClaim(BILL2, false);

      const [submitted, flagged, approved, rejected] = await trail.getProviderStats(clinicA.address);
      expect([submitted, flagged, approved, rejected]).to.deep.equal([2n, 1n, 1n, 1n]);
      expect(await trail.totalClaims()).to.equal(2);
    });

    it("TC-37: pause stops new records, and unpause restores them", async function () {
      const { trail, clinicA, insurer } = await loadFixture(deployFixture);
      await trail.pause();
      await expect(trail.recordVisit(V1, MEMBER_A, clinicA.address, insurer.address))
        .to.be.revertedWithCustomError(trail, "EnforcedPause");
      await trail.unpause();
      await expect(trail.recordVisit(V1, MEMBER_A, clinicA.address, insurer.address)).to.emit(trail, "VisitVerified");
    });

    it("TC-38: only the admin can pause", async function () {
      const { trail, stranger } = await loadFixture(deployFixture);
      await expect(trail.connect(stranger).pause()).to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
      await expect(trail.connect(stranger).unpause()).to.be.revertedWithCustomError(trail, "AccessControlUnauthorizedAccount");
    });

    it("TC-39: no readable patient data is stored, only the hashed member token", async function () {
      const { trail } = await loadFixture(visitFixture);
      const visit = await trail.getVisit(V1);
      expect(visit.memberToken).to.match(/^0x[0-9a-f]{64}$/);
      expect(visit.memberToken).to.not.equal(ethers.hexlify(ethers.toUtf8Bytes("MEMBER-A")).padEnd(66, "0"));
    });

    it("TC-40: full claim story from identity check to approval", async function () {
      const { trail, clinicA, insurer } = await loadFixture(deployFixture);
      await trail.recordVisit(V1, MEMBER_A, clinicA.address, insurer.address);
      await trail.connect(clinicA).submitClaim(BILL1, V1, GP, 15000);
      await trail.clearClaim(BILL1);
      await trail.connect(insurer).decideClaim(BILL1, true);
      const claim = await trail.getClaim(BILL1);
      expect(claim.status).to.equal(S.Approved);
      expect(claim.submittedAt).to.be.greaterThan(0);
      expect(claim.screenedAt).to.be.greaterThanOrEqual(claim.submittedAt);
      expect(claim.decidedAt).to.be.greaterThanOrEqual(claim.screenedAt);
    });

    it("TC-41: while paused, bills, screening and decisions are all blocked", async function () {
      const { trail, clinicA, insurer } = await loadFixture(submittedFixture);
      await trail.recordVisit(V2, MEMBER_A, clinicA.address, insurer.address);
      await trail.pause();
      await expect(trail.connect(clinicA).submitClaim(BILL2, V2, XRAY, 30000)).to.be.revertedWithCustomError(trail, "EnforcedPause");
      await expect(trail.clearClaim(BILL1)).to.be.revertedWithCustomError(trail, "EnforcedPause");
      await expect(trail.flagClaim(BILL1, R.Other, EVIDENCE)).to.be.revertedWithCustomError(trail, "EnforcedPause");
      await expect(trail.connect(insurer).decideClaim(BILL1, true)).to.be.revertedWithCustomError(trail, "EnforcedPause");
    });
  });
});
