
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsDir = path.join(__dirname, 'src', 'assets', 'fonts');

if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
    { name: 'Roboto-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf' },
    { name: 'Roboto-Bold.ttf', url: 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf' },
    { name: 'Roboto-Italic.ttf', url: 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Italic.ttf' }
];

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log(`Downloaded ${path.basename(dest)}`);
                    resolve();
                });
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

(async () => {
    try {
        for (const font of fonts) {
            console.log(`Downloading ${font.name}...`);
            await downloadFile(font.url, path.join(fontsDir, font.name));
        }
        console.log('All fonts downloaded successfully!');
    } catch (error) {
        console.error('Download failed:', error);
    }
})();
