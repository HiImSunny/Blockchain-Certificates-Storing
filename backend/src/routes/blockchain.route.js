// src/routes/blockchain.route.js
const express = require("express");
const provider = require("../blockchain/provider");

const router = express.Router();

// Test blockchain
router.get("/status", async (req, res) => {
  try {
    const block = await provider.getBlockNumber();
    res.json({
      success: true,
      blockNumber: block
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy balance
router.get("/balance/:address", async (req, res) => {
  try {
    const balance = await provider.getBalance(req.params.address);
    res.json({
      address: req.params.address,
      balance: balance.toString()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
