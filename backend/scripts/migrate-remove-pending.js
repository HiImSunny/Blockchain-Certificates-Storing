import Certificate from '../src/models/Certificate.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Migration script to remove PENDING status
 * Updates all PENDING certificates to ISSUED
 */
async function migratePendingToIssued() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully\n');

        // Count PENDING certificates before migration
        const pendingCount = await Certificate.countDocuments({ status: 'PENDING' });
        console.log(`Found ${pendingCount} PENDING certificates`);

        if (pendingCount === 0) {
            console.log('No PENDING certificates to migrate. Exiting...');
            await mongoose.connection.close();
            return;
        }

        // Update all PENDING to ISSUED
        console.log('\nUpdating PENDING certificates to ISSUED...');
        const result = await Certificate.updateMany(
            { status: 'PENDING' },
            { $set: { status: 'ISSUED' } }
        );

        console.log(`\n✅ Migration completed successfully!`);
        console.log(`   - Matched: ${result.matchedCount} documents`);
        console.log(`   - Modified: ${result.modifiedCount} documents`);

        // Verify migration
        const remainingPending = await Certificate.countDocuments({ status: 'PENDING' });
        const issuedCount = await Certificate.countDocuments({ status: 'ISSUED' });

        console.log(`\n📊 Post-migration stats:`);
        console.log(`   - PENDING: ${remainingPending}`);
        console.log(`   - ISSUED: ${issuedCount}`);
        console.log(`   - REVOKED: ${await Certificate.countDocuments({ status: 'REVOKED' })}`);

        if (remainingPending > 0) {
            console.warn(`\n⚠️  Warning: ${remainingPending} PENDING certificates still exist!`);
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run migration
migratePendingToIssued();
