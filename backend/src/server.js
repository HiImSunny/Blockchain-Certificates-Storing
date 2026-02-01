import app from './app.js';
import connectDB from './config/database.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/cert`);
    console.log(`💚 Health: http://localhost:${PORT}/health\n`);
});
