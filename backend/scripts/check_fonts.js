import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fontsPath = join(__dirname, '..', 'src', 'assets', 'fonts');

console.log(`Checking fonts in: ${fontsPath}`);

try {
    const files = readdirSync(fontsPath);
    console.log('Files found:', files);

    files.forEach(file => {
        const filePath = join(fontsPath, file);
        try {
            const buffer = readFileSync(filePath);
            console.log(`\nFile: ${file}`);
            console.log(`Size: ${buffer.length} bytes`);

            // Check magic number
            const magic = buffer.subarray(0, 4).toString('hex');
            console.log(`Header (hex): ${magic}`);

            if (magic === '00010000') {
                console.log('✅ Valid TrueType Font signature');
            } else if (magic === '4f54544f') {
                console.log('✅ Valid OpenType Font signature');
            } else {
                console.log('❌ UNKNOWN signature');
            }

        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    });

} catch (e) {
    console.error('Error finding fonts directory:', e.message);
}
