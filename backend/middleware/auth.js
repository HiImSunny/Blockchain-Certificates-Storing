// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');

// Verify wallet signature and create JWT token
const verifyWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if organization exists and is whitelisted
    let organization = await Organization.findOne({ walletAddress: normalizedAddress });

    if (!organization) {
      // Check if wallet is in whitelist from env
      const whitelistedAddresses = process.env.WHITELISTED_ADDRESSES
        ? process.env.WHITELISTED_ADDRESSES.split(',').map(addr => addr.trim().toLowerCase())
        : [];

      if (!whitelistedAddresses.includes(normalizedAddress)) {
        return res.status(403).json({ 
          error: 'Wallet address not authorized. Please contact administrator.' 
        });
      }

      // Create new organization if whitelisted
      organization = new Organization({
        name: 'HADU VIET NAM TRAINING ACADEMY', // Default name
        walletAddress: normalizedAddress,
        isWhitelisted: true,
        isActive: true
      });
      await organization.save();
    }

    // Check if organization is active and whitelisted
    if (!organization.isActive || !organization.isWhitelisted) {
      return res.status(403).json({ 
        error: 'Organization account is not active or not authorized' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        organizationId: organization._id,
        walletAddress: normalizedAddress,
        role: organization.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    req.organization = organization;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Verify JWT token from headers
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const organization = await Organization.findById(decoded.organizationId);
    
    if (!organization || !organization.isActive) {
      return res.status(403).json({ error: 'Invalid or inactive organization' });
    }

    req.organization = organization;
    req.walletAddress = decoded.walletAddress;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  verifyWallet,
  verifyToken
};