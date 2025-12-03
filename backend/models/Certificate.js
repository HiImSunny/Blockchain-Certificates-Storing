// backend/models/Certificate.js
const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // mã tra cứu
  cid: { type: String, required: true },
  title: { type: String, required: true },
  walletAddress: { type: String, required: true }, // owner (uploader) address
  signature: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Certificate", CertificateSchema);
