import cloudinary from '../src/config/cloudinary.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../temp_output/test_certificate.pdf');

async function testUpload() {
    console.log('Uploading test PDF to Cloudinary...');
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'certificates_test',
            resource_type: 'raw', // Try raw to avoid processing
            type: 'upload',
            access_mode: 'public',
            timeout: 60000 // Increase timeout
        });

        console.log('✅ Upload successful!');
        console.log('URL:', result.secure_url);
        console.log('Public ID:', result.public_id);
        console.log('Resource Type:', result.resource_type);
        console.log('Format:', result.format);
    } catch (e) {
        console.error('❌ Upload Failed:', e);
    }
}

testUpload();
