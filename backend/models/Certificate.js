// backend/models/Certificate.js
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  // Certificate ID (unique identifier)
  certificateId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Student Information
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  
  gender: {
    type: String,
    enum: ['Nam', 'Nữ', 'Khác', 'Male', 'Female', 'Other'],
    required: true
  },
  
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  // Course Information
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  
  courseStartDate: {
    type: Date,
    required: true
  },
  
  courseEndDate: {
    type: Date,
    required: true
  },
  
  courseDuration: {
    type: Number, // in days
    required: true
  },
  
  location: {
    type: String,
    required: true,
    trim: true
  },
  
  // Certificate Details
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  registrationNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Photo and Document
  studentPhoto: {
    type: String, // Cloudinary URL
    required: true
  },
  
  certificateImage: {
    type: String, // Cloudinary URL for full certificate
    required: true
  },
  
  // Organization Information
  organizationName: {
    type: String,
    required: true,
    default: 'NAM CAN THO UNIVERSITY'
  },
  
  organizationWallet: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // Blockchain Data
  dataHash: {
    type: String, // Hash of all certificate data
    required: true
  },
  
  imageHash: {
    type: String, // Hash of certificate image
    required: true
  },
  
  blockchainHash: {
    type: String, // Block hash on blockchain
    required: true
  },
  
  blockIndex: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  
  // Metadata
  verificationCount: {
    type: Number,
    default: 0
  },
  
  lastVerifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for fast lookup
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ organizationWallet: 1 });
certificateSchema.index({ studentName: 1 });

// Virtual for formatted issue date
certificateSchema.virtual('formattedIssueDate').get(function() {
  return this.issueDate.toLocaleDateString('vi-VN');
});

module.exports = mongoose.model('Certificate', certificateSchema);