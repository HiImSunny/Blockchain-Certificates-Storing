import { generateCertificatePDF } from '../src/services/pdfService.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = join(__dirname, '../temp_output');
if (!existsSync(outputDir)) {
    mkdirSync(outputDir);
}

const testData = {
    certificateId: 'VN-TEST-2024',
    studentName: 'NGUYỄN THỊ B',
    courseName: 'QUẢN TRỊ KINH DOANH',
    courseCode: 'MBA-2024',
    trainingType: 'Trực tiếp',
    duration: '2 Năm',
    result: 'Giỏi',
    issuerName: 'Trường Đại Học Kinh Tế',
    issuedAt: new Date().toISOString()
};

async function run() {
    console.log('Generating PDF with new footer...');
    try {
        const buffer = await generateCertificatePDF(testData);
        const outputPath = join(outputDir, 'test_certificate_footer.pdf');
        writeFileSync(outputPath, buffer);
        console.log(`✅ PDF generated: ${outputPath}`);
    } catch (e) {
        console.error('❌ Failed:', e);
    }
}

run();
