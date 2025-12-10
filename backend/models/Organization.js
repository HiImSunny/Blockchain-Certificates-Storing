// backend/models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  address: {
    type: String,
    trim: true
  },
  
  isWhitelisted: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  certificatesIssued: {
    type: Number,
    default: 0
  },
  
  role: {
    type: String,
    enum: ['admin', 'issuer', 'validator'],
    default: 'issuer'
  }
}, {
  timestamps: true
});

// Index
organizationSchema.index({ walletAddress: 1 });

module.exports = mongoose.model('Organization', organizationSchema);