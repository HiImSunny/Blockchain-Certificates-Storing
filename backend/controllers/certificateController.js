// backend/controllers/certificateController.js
const Certificate = require('../models/Certificate');
const Organization = require('../models/Organization');
const blockchain = require('../blockchain/Blockchain');
const { uploadToCloudinary } = require('../config/cloudinary');
const crypto = require('crypto');
const fs = require('fs').promises;

// Helper: Generate Certificate ID
const generateCertificateId = async () => {
  const year = new Date().getFullYear();
  const lastCert = await Certificate.findOne()
    .sort({ createdAt: -1 })
    .select('certificateId');

  if (!lastCert) {
    return `CERT-${year}-001`;
  }

  const lastNumber = parseInt(lastCert.certificateId.split('-')[2]) || 0;
  const newNumber = String(lastNumber + 1).padStart(3, '0');
  return `CERT-${year}-${newNumber}`;
};

// Helper: Calculate hash of data
const calculateDataHash = (data) => {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
};

// Helper: Calculate hash of file
const calculateFileHash = async (filePath) => {
  const fileBuffer = await fs.readFile(filePath);
  return crypto
    .createHash('sha256')
    .update(fileBuffer)
    .digest('hex');
};

// Create Certificate
exports.createCertificate = async (req, res) => {
  try {
    const {
      certificateId,
      studentName,
      gender,
      dateOfBirth,
      courseName,
      courseStartDate,
      courseEndDate,
      courseDuration,
      location,
      registrationNumber,
      issueDate
    } = req.body;

    // Validate required files
    if (!req.files || !req.files.studentPhoto || !req.files.certificateImage) {
      return res.status(400).json({ 
        error: 'Both student photo and certificate image are required' 
      });
    }

    // Generate certificate ID if not provided
    const finalCertificateId = certificateId || await generateCertificateId();

    // Check if certificate ID already exists
    const existingCert = await Certificate.findOne({ certificateId: finalCertificateId });
    if (existingCert) {
      return res.status(400).json({ error: 'Certificate ID already exists' });
    }

    // Upload files to Cloudinary
    const studentPhotoUpload = await uploadToCloudinary(
      req.files.studentPhoto[0], 
      'certificates/photos'
    );
    const certificateImageUpload = await uploadToCloudinary(
      req.files.certificateImage[0], 
      'certificates/images'
    );

    // Calculate hashes
    const certificateData = {
      certificateId: finalCertificateId,
      studentName,
      gender,
      dateOfBirth,
      courseName,
      courseStartDate,
      courseEndDate,
      courseDuration,
      location,
      registrationNumber,
      issueDate: issueDate || new Date(),
      studentPhoto: studentPhotoUpload.url,
      certificateImage: certificateImageUpload.url,
      organizationWallet: req.organization.walletAddress
    };

    const dataHash = calculateDataHash(certificateData);
    const imageHash = await calculateFileHash(req.files.certificateImage[0].path);

    // Add to blockchain
    const blockchainData = {
      certificateId: finalCertificateId,
      dataHash,
      imageHash,
      certificateImageUrl: certificateImageUpload.url,
      organizationWallet: req.organization.walletAddress,
      timestamp: Date.now()
    };

    const newBlock = blockchain.addBlock(blockchainData);

    // Save to MongoDB
    const certificate = new Certificate({
      ...certificateData,
      dataHash,
      imageHash,
      blockchainHash: newBlock.hash,
      blockIndex: newBlock.index
    });

    await certificate.save();

    // Update organization certificate count
    await Organization.findByIdAndUpdate(
      req.organization._id,
      { $inc: { certificatesIssued: 1 } }
    );

    // Clean up temporary files
    await fs.unlink(req.files.studentPhoto[0].path);
    await fs.unlink(req.files.certificateImage[0].path);

    res.status(201).json({
      message: 'Certificate created and added to blockchain successfully',
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        blockchainHash: certificate.blockchainHash,
        blockIndex: certificate.blockIndex
      }
    });

  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({ error: 'Failed to create certificate', details: error.message });
  }
};

// Verify Certificate by ID
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    // Find certificate in MongoDB
    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({ 
        verified: false,
        error: 'Certificate not found' 
      });
    }

    // Find block in blockchain
    const block = blockchain.findBlockByCertificateId(certificateId);

    if (!block) {
      return res.status(404).json({ 
        verified: false,
        error: 'Certificate not found on blockchain' 
      });
    }

    // Verify blockchain integrity
    const isBlockchainValid = blockchain.isChainValid();

    // Verify hashes match
    const dataHashMatch = block.data.dataHash === certificate.dataHash;
    const imageHashMatch = block.data.imageHash === certificate.imageHash;
    const blockHashMatch = block.hash === certificate.blockchainHash;

    const isVerified = isBlockchainValid && dataHashMatch && imageHashMatch && blockHashMatch;

    // Update verification count
    if (isVerified) {
      certificate.verificationCount += 1;
      certificate.lastVerifiedAt = new Date();
      await certificate.save();
    }

    res.json({
      verified: isVerified,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        gender: certificate.gender,
        dateOfBirth: certificate.dateOfBirth,
        courseName: certificate.courseName,
        courseStartDate: certificate.courseStartDate,
        courseEndDate: certificate.courseEndDate,
        courseDuration: certificate.courseDuration,
        location: certificate.location,
        issueDate: certificate.issueDate,
        registrationNumber: certificate.registrationNumber,
        studentPhoto: certificate.studentPhoto,
        certificateImage: certificate.certificateImage,
        organizationName: certificate.organizationName,
        status: certificate.status,
        verificationCount: certificate.verificationCount
      },
      blockchain: {
        blockIndex: block.index,
        blockHash: block.hash,
        timestamp: block.timestamp,
        isChainValid: isBlockchainValid
      },
      verification: {
        dataHashMatch,
        imageHashMatch,
        blockHashMatch
      }
    });

  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Failed to verify certificate', details: error.message });
  }
};

// Get all certificates (for organization dashboard)
exports.getAllCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = search
      ? {
          $or: [
            { certificateId: { $regex: search, $options: 'i' } },
            { studentName: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const count = await Certificate.countDocuments(query);

    res.json({
      certificates,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCertificates: count
    });

  } catch (error) {
    console.error('Get all certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};

// Get certificates by organization
exports.getCertificatesByOrganization = async (req, res) => {
  try {
    const certificates = await Certificate.find({ 
      organizationWallet: req.organization.walletAddress 
    })
    .sort({ createdAt: -1 })
    .select('-__v');

    res.json({
      certificates,
      total: certificates.length
    });

  } catch (error) {
    console.error('Get organization certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch organization certificates' });
  }
};

// Get blockchain stats
exports.getBlockchainStats = async (req, res) => {
  try {
    const stats = blockchain.getStats();
    const totalCertificates = await Certificate.countDocuments();
    const activeCertificates = await Certificate.countDocuments({ status: 'active' });

    res.json({
      blockchain: stats,
      database: {
        totalCertificates,
        activeCertificates,
        revokedCertificates: await Certificate.countDocuments({ status: 'revoked' })
      }
    });

  } catch (error) {
    console.error('Get blockchain stats error:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain stats' });
  }
};

module.exports = exports;