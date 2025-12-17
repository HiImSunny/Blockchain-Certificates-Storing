// src/server.js
const express = require("express");
const cors = require("cors");

const blockchainRoute = require("./routes/blockchain.route");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/blockchain", blockchainRoute);

const PORT = 4000;
app.listen(PORT, () => {
  console.log("Backend running at http://localhost:" + PORT);
});
