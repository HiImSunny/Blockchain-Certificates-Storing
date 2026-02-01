// Đặt file này vào: test/EduCertificate.test.js

import { expect } from "chai";
import { ethers } from "hardhat";

describe("EduCertificate", function () {
  let eduCertificate;
  let admin, officer1, officer2, user1, user2;
  
  beforeEach(async function () {
    [admin, officer1, officer2, user1, user2] = await ethers.getSigners();
    
    const EduCertificate = await ethers.getContractFactory("EduCertificate");
    eduCertificate = await EduCertificate.deploy(admin.address);
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await eduCertificate.admin()).to.equal(admin.address);
    });

    it("Should initialize nextCertId to 1", async function () {
      expect(await eduCertificate.nextCertId()).to.equal(1);
    });
  });

  describe("Officer Management", function () {
    it("Should allow admin to add officer", async function () {
      await expect(eduCertificate.connect(admin).addOfficer(officer1.address))
        .to.emit(eduCertificate, "OfficerAdded")
        .withArgs(officer1.address);
      
      expect(await eduCertificate.officers(officer1.address)).to.be.true;
    });

    it("Should allow admin to remove officer", async function () {
      await eduCertificate.connect(admin).addOfficer(officer1.address);
      
      await expect(eduCertificate.connect(admin).removeOfficer(officer1.address))
        .to.emit(eduCertificate, "OfficerRemoved")
        .withArgs(officer1.address);
      
      expect(await eduCertificate.officers(officer1.address)).to.be.false;
    });

    it("Should revert when non-admin tries to add officer", async function () {
      await expect(
        eduCertificate.connect(user1).addOfficer(officer1.address)
      ).to.be.revertedWith("Only admin");
    });

    it("Should revert when non-admin tries to remove officer", async function () {
      await eduCertificate.connect(admin).addOfficer(officer1.address);
      
      await expect(
        eduCertificate.connect(user1).removeOfficer(officer1.address)
      ).to.be.revertedWith("Only admin");
    });
  });

  describe("Certificate Issuance", function () {
    let certHash;

    beforeEach(async function () {
      certHash = ethers.keccak256(ethers.toUtf8Bytes("Certificate Data"));
      await eduCertificate.connect(admin).addOfficer(officer1.address);
    });

    it("Should allow admin to issue certificate", async function () {
      await expect(eduCertificate.connect(admin).issueCertificate(certHash))
        .to.emit(eduCertificate, "CertificateIssued")
        .withArgs(1, admin.address, certHash);
      
      expect(await eduCertificate.nextCertId()).to.equal(2);
    });

    it("Should allow officer to issue certificate", async function () {
      await expect(eduCertificate.connect(officer1).issueCertificate(certHash))
        .to.emit(eduCertificate, "CertificateIssued")
        .withArgs(1, officer1.address, certHash);
    });

    it("Should increment certId correctly", async function () {
      await eduCertificate.connect(officer1).issueCertificate(certHash);
      const certHash2 = ethers.keccak256(ethers.toUtf8Bytes("Certificate Data 2"));
      
      await expect(eduCertificate.connect(officer1).issueCertificate(certHash2))
        .to.emit(eduCertificate, "CertificateIssued")
        .withArgs(2, officer1.address, certHash2);
    });

    it("Should revert when unauthorized user tries to issue", async function () {
      await expect(
        eduCertificate.connect(user1).issueCertificate(certHash)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should store certificate data correctly", async function () {
      await eduCertificate.connect(officer1).issueCertificate(certHash);
      
      const cert = await eduCertificate.getCertificate(1);
      expect(cert.issuer).to.equal(officer1.address);
      expect(cert.certHash).to.equal(certHash);
      expect(cert.revoked).to.be.false;
      expect(cert.issuedAt).to.be.gt(0);
    });
  });

  describe("Certificate Update", function () {
    let certHash, newHash;

    beforeEach(async function () {
      certHash = ethers.keccak256(ethers.toUtf8Bytes("Original Data"));
      newHash = ethers.keccak256(ethers.toUtf8Bytes("Updated Data"));
      await eduCertificate.connect(admin).addOfficer(officer1.address);
      await eduCertificate.connect(officer1).issueCertificate(certHash);
    });

    it("Should allow issuer to update certificate", async function () {
      await expect(eduCertificate.connect(officer1).updateCertificate(1, newHash))
        .to.emit(eduCertificate, "CertificateUpdated")
        .withArgs(1, newHash);
      
      const cert = await eduCertificate.getCertificate(1);
      expect(cert.certHash).to.equal(newHash);
    });

    it("Should allow admin to update any certificate", async function () {
      await expect(eduCertificate.connect(admin).updateCertificate(1, newHash))
        .to.emit(eduCertificate, "CertificateUpdated")
        .withArgs(1, newHash);
    });

    it("Should revert when non-owner tries to update", async function () {
      await expect(
        eduCertificate.connect(officer2).updateCertificate(1, newHash)
      ).to.be.revertedWith("Not cert owner");
    });

    it("Should revert when updating revoked certificate", async function () {
      await eduCertificate.connect(officer1).revokeCertificate(1);
      
      await expect(
        eduCertificate.connect(officer1).updateCertificate(1, newHash)
      ).to.be.revertedWith("Certificate revoked");
    });
  });

  describe("Certificate Revocation", function () {
    let certHash;

    beforeEach(async function () {
      certHash = ethers.keccak256(ethers.toUtf8Bytes("Certificate Data"));
      await eduCertificate.connect(admin).addOfficer(officer1.address);
      await eduCertificate.connect(officer1).issueCertificate(certHash);
    });

    it("Should allow issuer to revoke certificate", async function () {
      await expect(eduCertificate.connect(officer1).revokeCertificate(1))
        .to.emit(eduCertificate, "CertificateRevoked")
        .withArgs(1);
      
      const cert = await eduCertificate.getCertificate(1);
      expect(cert.revoked).to.be.true;
    });

    it("Should allow admin to revoke any certificate", async function () {
      await expect(eduCertificate.connect(admin).revokeCertificate(1))
        .to.emit(eduCertificate, "CertificateRevoked")
        .withArgs(1);
    });

    it("Should revert when non-owner tries to revoke", async function () {
      await expect(
        eduCertificate.connect(officer2).revokeCertificate(1)
      ).to.be.revertedWith("Not cert owner");
    });

    it("Should allow revoking already revoked certificate", async function () {
      await eduCertificate.connect(officer1).revokeCertificate(1);
      
      await expect(eduCertificate.connect(officer1).revokeCertificate(1))
        .to.emit(eduCertificate, "CertificateRevoked")
        .withArgs(1);
    });
  });

  describe("Certificate Verification", function () {
    let certHash, wrongHash;

    beforeEach(async function () {
      certHash = ethers.keccak256(ethers.toUtf8Bytes("Certificate Data"));
      wrongHash = ethers.keccak256(ethers.toUtf8Bytes("Wrong Data"));
      await eduCertificate.connect(admin).addOfficer(officer1.address);
      await eduCertificate.connect(officer1).issueCertificate(certHash);
    });

    it("Should verify valid certificate with correct hash", async function () {
      const result = await eduCertificate.verifyCertificate(1, certHash);
      expect(result.valid).to.be.true;
      expect(result.revoked).to.be.false;
    });

    it("Should return invalid for wrong hash", async function () {
      const result = await eduCertificate.verifyCertificate(1, wrongHash);
      expect(result.valid).to.be.false;
      expect(result.revoked).to.be.false;
    });

    it("Should show revoked status", async function () {
      await eduCertificate.connect(officer1).revokeCertificate(1);
      
      const result = await eduCertificate.verifyCertificate(1, certHash);
      expect(result.valid).to.be.true;
      expect(result.revoked).to.be.true;
    });

    it("Should return false for non-existent certificate", async function () {
      const result = await eduCertificate.verifyCertificate(999, certHash);
      expect(result.valid).to.be.false;
      expect(result.revoked).to.be.false;
    });
  });

  describe("Get Certificate", function () {
    let certHash;

    beforeEach(async function () {
      certHash = ethers.keccak256(ethers.toUtf8Bytes("Certificate Data"));
    });

    it("Should return correct certificate data", async function () {
      await eduCertificate.connect(admin).addOfficer(officer1.address);
      await eduCertificate.connect(officer1).issueCertificate(certHash);
      
      const cert = await eduCertificate.getCertificate(1);
      expect(cert.issuer).to.equal(officer1.address);
      expect(cert.certHash).to.equal(certHash);
      expect(cert.revoked).to.be.false;
      expect(cert.issuedAt).to.be.gt(0);
    });

    it("Should return empty data for non-existent certificate", async function () {
      const cert = await eduCertificate.getCertificate(999);
      expect(cert.issuer).to.equal(ethers.ZeroAddress);
      expect(cert.certHash).to.equal(ethers.ZeroHash);
      expect(cert.issuedAt).to.equal(0);
      expect(cert.revoked).to.be.false;
    });
  });

  describe("Complex Scenarios", function () {
    let certHash1, certHash2, certHash3;

    beforeEach(async function () {
      certHash1 = ethers.keccak256(ethers.toUtf8Bytes("Cert 1"));
      certHash2 = ethers.keccak256(ethers.toUtf8Bytes("Cert 2"));
      certHash3 = ethers.keccak256(ethers.toUtf8Bytes("Cert 3"));
    });

    it("Should handle multiple officers issuing certificates", async function () {
      await eduCertificate.connect(admin).addOfficer(officer1.address);
      await eduCertificate.connect(admin).addOfficer(officer2.address);
      
      await eduCertificate.connect(officer1).issueCertificate(certHash1);
      await eduCertificate.connect(officer2).issueCertificate(certHash2);
      await eduCertificate.connect(admin).issueCertificate(certHash3);
      
      const cert1 = await eduCertificate.getCertificate(1);
      const cert2 = await eduCertificate.getCertificate(2);
      const cert3 = await eduCertificate.getCertificate(3);
      
      expect(cert1.issuer).to.equal(officer1.address);
      expect(cert2.issuer).to.equal(officer2.address);
      expect(cert3.issuer).to.equal(admin.address);
    });

    it("Should handle officer removal after issuing certificates", async function () {
      await eduCertificate.connect(admin).addOfficer(officer1.address);
      await eduCertificate.connect(officer1).issueCertificate(certHash1);
      
      await eduCertificate.connect(admin).removeOfficer(officer1.address);
      
      // Certificate should still exist
      const cert = await eduCertificate.getCertificate(1);
      expect(cert.issuer).to.equal(officer1.address);
      
      // But officer can't issue new certificates
      await expect(
        eduCertificate.connect(officer1).issueCertificate(certHash2)
      ).to.be.revertedWith("Not authorized");
      
      // Officer can still manage their old certificates
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("Updated"));
      await expect(eduCertificate.connect(officer1).updateCertificate(1, newHash))
        .to.emit(eduCertificate, "CertificateUpdated");
    });
  });
});