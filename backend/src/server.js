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
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/cert`);
    console.log(`💚 Health: http://localhost:${PORT}/health\n`);
});
