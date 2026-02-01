const fs = require('fs');
const path = require('path');

// Path to the compiled contract artifact
const artifactPath = path.join(__dirname, '../artifacts/contracts/EduCertificate.sol/EduCertificate.json');

// Read the artifact
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Extract ABI
const abi = artifact.abi;

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../exports');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save ABI to a separate file for frontend use
const outputPath = path.join(outputDir, 'EduCertificate.abi.json');
fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));

console.log('✅ ABI exported successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log('\n📋 Share this file with your frontend team.');
console.log('They can use it to interact with the contract (read-only operations).');
