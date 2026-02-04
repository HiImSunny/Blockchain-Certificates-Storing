import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
    {
        // Certificate ID (unique identifier)
        certificateId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Blockchain data
        certHash: {
            type: String,
            required: true,
            index: true,
        },
        blockchainCertId: {
            type: Number, // certId from smart contract
            index: true,
        },
        txHash: {
            type: String,
        },
        issuerAddress: {
            type: String,
            required: true,
            lowercase: true, // Normalize to lowercase for consistent comparison
        },

        // File storage
        fileUrl: {
            type: String,
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
        },
        fileType: {
            type: String,
            enum: ['pdf', 'image'],
            required: true,
        },

        // Certificate metadata
        studentName: {
            type: String,
            required: true,
        },
        studentId: {
            type: String,
        },
        dateOfBirth: {
            type: Date,
        },
        courseName: {
            type: String,
            required: true,
        },
        courseCode: {
            type: String,
        },
        trainingType: {
            type: String,
            enum: ['Online', 'Offline', 'Hybrid'],
        },
        duration: {
            type: String,
        },
        result: {
            type: String,
        },
        issuedAt: {
            type: Date,
            required: true,
        },

        // Issuer information
        issuerName: {
            type: String,
            required: true,
        },
        issuerWebsite: {
            type: String,
        },
        issuerContact: {
            type: String,
        },

        // Status
        status: {
            type: String,
            enum: ['ISSUED', 'REVOKED'],
            default: 'ISSUED',
            index: true,
        },
        issuedAt: {
            type: Date,
            required: true, // Keeping original 'required: true'
            default: Date.now, // Adding default as per instruction
        },
        revokedAt: {
            type: Date,
        },
        revokeTxHash: {
            type: String,
        },

        // Additional metadata
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
certificateSchema.index({ certificateId: 1, status: 1 });
certificateSchema.index({ certHash: 1 });
certificateSchema.index({ issuerAddress: 1 });
certificateSchema.index({ studentName: 'text', courseName: 'text' });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
