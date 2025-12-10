// backend/controllers/organizationController.js
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

// Login with wallet
exports.login = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Check if organization exists
    let organization = await Organization.findOne({ walletAddress: normalizedAddress });

    // Check whitelist
    const whitelistedAddresses = process.env.WHITELISTED_ADDRESSES
      ? process.env.WHITELISTED_ADDRESSES.split(',').map(addr => addr.trim().toLowerCase())
      : [];

    const isWhitelisted = whitelistedAddresses.includes(normalizedAddress);

    if (!organization) {
      if (!isWhitelisted) {
        return res.status(403).json({ 
          error: 'Wallet address not authorized. Please contact administrator.',
          isWhitelisted: false
        });
      }

      // Create new organization
      organization = new Organization({
        name: 'NAM CAN THO UNIVERSITY',
        walletAddress: normalizedAddress,
        isWhitelisted: true,
        isActive: true
      });
      await organization.save();
    }

    if (!organization.isActive) {
      return res.status(403).json({ error: 'Organization account is not active' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        organizationId: organization._id,
        walletAddress: normalizedAddress,
        role: organization.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      organization: {
        id: organization._id,
        name: organization.name,
        walletAddress: organization.walletAddress,
        role: organization.role,
        certificatesIssued: organization.certificatesIssued
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

// Get organization profile
exports.getProfile = async (req, res) => {
  try {
    const organization = await Organization.findById(req.organization._id)
      .select('-__v');

    res.json({ organization });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update organization profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const organization = await Organization.findByIdAndUpdate(
      req.organization._id,
      { name, email, phone, address },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      message: 'Profile updated successfully',
      organization
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Check if wallet is whitelisted
exports.checkWhitelist = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const normalizedAddress = walletAddress.toLowerCase();

    const organization = await Organization.findOne({ walletAddress: normalizedAddress });

    const whitelistedAddresses = process.env.WHITELISTED_ADDRESSES
      ? process.env.WHITELISTED_ADDRESSES.split(',').map(addr => addr.trim().toLowerCase())
      : [];

    const isWhitelisted = organization 
      ? organization.isWhitelisted 
      : whitelistedAddresses.includes(normalizedAddress);

    res.json({
      walletAddress: normalizedAddress,
      isWhitelisted,
      isActive: organization ? organization.isActive : false,
      organization: organization ? {
        name: organization.name,
        certificatesIssued: organization.certificatesIssued
      } : null
    });

  } catch (error) {
    console.error('Check whitelist error:', error);
    res.status(500).json({ error: 'Failed to check whitelist status' });
  }
};

module.exports = exports;