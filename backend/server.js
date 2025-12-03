// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const { Web3Storage, File: Web3File } = require("web3.storage");
const Certificate = require("./models/Certificate");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { customAlphabet } = require("nanoid");

const app = express();
const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const WEB3STORAGE_TOKEN = process.env.WEB3STORAGE_TOKEN;
const ADMIN_WALLET = (process.env.ADMIN_WALLET || "").toLowerCase();
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

if (!WEB3STORAGE_TOKEN) {
  console.error("WEB3STORAGE_TOKEN missing");
  process.exit(1);
}
if (!ADMIN_WALLET) {
  console.error("ADMIN_WALLET missing");
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

mongoose.connect(MONGODB_URI).then(() => console.log("MongoDB connected")).catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// helper: create short code
const nano = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

// admin upload
// expected form-data fields: file, title, walletAddress, message, signature, timestamp
app.post("/api/admin/upload", upload.single("file"), async (req, res) => {
  try {
    const { title, walletAddress, message, signature, timestamp } = req.body;
    if (!title || !walletAddress || !message || !signature || !timestamp) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // verify signature - signer must be ADMIN_WALLET
    const recovered = ethers.utils.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      return res.status(403).json({ message: "Signature not from admin wallet" });
    }

    // file must exist
    if (!req.file) return res.status(400).json({ message: "File missing" });

    // upload to Web3.Storage
    const storage = new Web3Storage({ token: WEB3STORAGE_TOKEN });

    const filePath = path.resolve(req.file.path);
    const buffer = fs.readFileSync(filePath);

    const web3File = new Web3File([buffer], req.file.originalname);
    const cid = await storage.put([web3File], { wrapWithDirectory: false });

    // remove local temp file
    fs.unlinkSync(filePath);

    // create unique code, ensure uniqueness
    let code;
    for (let i = 0; i < 5; i++) {
      code = nano();
      const exists = await Certificate.findOne({ code });
      if (!exists) break;
      code = null;
    }
    if (!code) {
      // fallback: timestamp-based
      code = "C" + Date.now().toString(36).toUpperCase().slice(-8);
    }

    const cert = new Certificate({
      code,
      cid,
      title,
      walletAddress,
      signature,
      message,
      timestamp: Number(timestamp)
    });
    await cert.save();

    return res.json({ message: "Uploaded", code, cid, cert });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// admin delete by code
// expects JSON body: { walletAddress, message, signature }
// message should be exactly `Delete cert:${code}|${walletAddress}|${timestamp}` and signature by ADMIN_WALLET
app.delete("/api/admin/:code", express.json(), async (req, res) => {
  try {
    const code = req.params.code;
    const { walletAddress, message, signature } = req.body;
    if (!walletAddress || !message || !signature) return res.status(400).json({ message: "Missing fields" });

    const recovered = ethers.utils.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      return res.status(403).json({ message: "Signature not from admin wallet" });
    }

    // check message content contains code and walletAddress (basic sanity)
    if (!message.includes(code) || !message.includes(walletAddress)) {
      return res.status(400).json({ message: "Message content mismatch" });
    }

    const doc = await Certificate.findOneAndDelete({ code });
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json({ message: "Deleted", code });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// public: get certificate by code
app.get("/api/certificates/code/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const doc = await Certificate.findOne({ code }).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// optional: list all (admin-only) - omitted auth for brevity if needed add signature check

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
