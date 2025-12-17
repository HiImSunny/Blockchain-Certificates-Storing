// src/blockchain/provider.js
const { ethers } = require("ethers");

const RPC_URL = "http://127.0.0.1:8545";

const provider = new ethers.JsonRpcProvider(RPC_URL, {
  chainId: 2025,
  name: "private-poa"
});

module.exports = provider;
