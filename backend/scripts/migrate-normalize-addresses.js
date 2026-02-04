import mongoose from 'mongoose';
import Certificate from '../src/models/Certificate.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script to normalize all Ethereum addresses to lowercase
 * This ensures consistent address comparison regardless of checksum capitalization
 */
async function migrateNormalizeAddresses() {
    try {
        console.log('🔄 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Get count before migration
        const totalCerts = await Certificate.countDocuments();
        console.log(`📊 Total certificates in database: ${totalCerts}`);

        // Find certificates with uppercase characters in issuerAddress
        const certsToUpdate = await Certificate.find({
            issuerAddress: { $regex: /[A-F]/ } // Contains uppercase hex characters
        });

        console.log(`🔍 Found ${certsToUpdate.length} certificates with uppercase addresses\n`);

        if (certsToUpdate.length === 0) {
            console.log('✨ All addresses are already normalized!');
            process.exit(0);
        }

        // Show sample before migration
        console.log('📝 Sample addresses before migration:');
        certsToUpdate.slice(0, 3).forEach(cert => {
            console.log(`   - ${cert.certificateId}: ${cert.issuerAddress}`);
        });
        console.log('');

        // Perform migration using aggregation pipeline
        console.log('🚀 Starting migration...');
        const result = await Certificate.updateMany(
            {},
            [{ $set: { issuerAddress: { $toLower: '$issuerAddress' } } }]
        );

        console.log(`✅ Migration completed!`);
        console.log(`   - Matched: ${result.matchedCount}`);
        console.log(`   - Modified: ${result.modifiedCount}\n`);

        // Verify migration
        const verifyUppercase = await Certificate.find({
            issuerAddress: { $regex: /[A-F]/ }
        });

        if (verifyUppercase.length === 0) {
            console.log('✨ Verification passed! All addresses are now lowercase.');
        } else {
            console.warn(`⚠️  Warning: ${verifyUppercase.length} addresses still contain uppercase characters`);
        }

        // Show sample after migration
        const sampleAfter = await Certificate.find().limit(3);
        console.log('\n📝 Sample addresses after migration:');
        sampleAfter.forEach(cert => {
            console.log(`   - ${cert.certificateId}: ${cert.issuerAddress}`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run migration
migrateNormalizeAddresses();
