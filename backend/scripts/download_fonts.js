import { createWriteStream } from 'fs';
import { get } from 'https';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fontsPath = join(__dirname, '..', 'src', 'assets', 'fonts');

const files = [
    { name: 'TimesNewRoman-Regular.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/apache/tinos/Tinos-Regular.ttf' },
    { name: 'TimesNewRoman-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/apache/tinos/Tinos-Bold.ttf' },
    { name: 'TimesNewRoman-Italic.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/apache/tinos/Tinos-Italic.ttf' }
];

console.log(`Downloading fonts to: ${fontsPath}`);

files.forEach(file => {
    const filePath = join(fontsPath, file.name);
    const fileStream = createWriteStream(filePath);

    get(file.url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`❌ Failed to download ${file.name}: Status Code ${response.statusCode}`);
            return;
        }

        response.pipe(fileStream);

        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`✅ Downloaded ${file.name}`);
        });
    }).on('error', (err) => {
        console.error(`❌ Error downloading ${file.name}: ${err.message}`);
    });
});
