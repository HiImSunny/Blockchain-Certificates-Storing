import dotenv from 'dotenv';
import app from './app.js';
// import connectDB from './config/database.js';

// Load environment variables first
dotenv.config();

const PORT = process.env.PORT || 5000;

// MongoDB connection removed - using Blockchain only
// connectDB();

// Start server
app.listen(PORT, () => {
    const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📡 API: ${BASE_URL}/api/cert`);
    console.log(`💚 Health: ${BASE_URL}/health\n`);
});
