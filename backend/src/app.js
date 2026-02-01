import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import certificateRoutes from './routes/certificate.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/cert', certificateRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'MulterError') {
        return res.status(400).json({ error: `Lỗi tải lên: ${err.message}` });
    }

    res.status(500).json({ error: err.message || 'Lỗi máy chủ nội bộ' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Không tìm thấy đường dẫn' });
});

export default app;
