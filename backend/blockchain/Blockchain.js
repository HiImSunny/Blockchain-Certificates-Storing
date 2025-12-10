// backend/blockchain/Blockchain.js
const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data; // Certificate data
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
      )
      .digest('hex');
  }

  // Simple Proof of Authority - no mining needed for private blockchain
  mineBlock(difficulty = 0) {
    // For private blockchain, we don't need complex mining
    // Just recalculate hash for integrity
    this.hash = this.calculateHash();
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 0; // No difficulty for private blockchain
    this.pendingTransactions = [];
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), {
      type: 'GENESIS_BLOCK',
      message: 'Certificate Blockchain Genesis Block'
    }, '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(certificateData) {
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      certificateData,
      this.getLatestBlock().hash
    );
    
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    
    return newBlock;
  }

  // Verify entire chain integrity
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Recalculate current block hash
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.error(`Block ${i} has been tampered!`);
        return false;
      }

      // Check if previous hash matches
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`Block ${i} previous hash mismatch!`);
        return false;
      }
    }
    return true;
  }

  // Find block by certificate ID
  findBlockByCertificateId(certificateId) {
    return this.chain.find(block => 
      block.data.certificateId === certificateId
    );
  }

  // Get all blocks (excluding genesis)
  getAllCertificateBlocks() {
    return this.chain.filter(block => block.index > 0);
  }

  // Get blockchain stats
  getStats() {
    return {
      totalBlocks: this.chain.length,
      totalCertificates: this.chain.length - 1, // Exclude genesis
      isValid: this.isChainValid(),
      latestBlock: this.getLatestBlock()
    };
  }
}

// Singleton instance
const blockchainInstance = new Blockchain();

module.exports = blockchainInstance;