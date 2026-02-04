import { generateCertificatePDF } from '../src/services/pdfService.js';
import { hashFile } from '../src/services/hashService.js';

const testData = {
    certificateId: 'TEST-123',
    studentName: 'Nguyen Van A',
    courseName: 'Blockchain 101',
    courseCode: 'BC101',
    trainingType: 'Online',
    duration: '3 Months',
    result: 'Excellent',
    issuedAt: new Date('2023-01-01').toISOString(),
    issuerName: 'Test Issuer',
    issuerWebsite: 'example.com',
    issuerContact: 'contact@example.com'
};

const run = async () => {
    console.log('Generating PDF 1...');
    const pdf1 = await generateCertificatePDF(testData);
    const hash1 = hashFile(pdf1);
    console.log('Hash 1:', hash1);

    // Wait a bit to ensure time changes if it's used
    await new Promise(r => setTimeout(r, 1000));

    console.log('Generating PDF 2 (Same Data)...');
    const pdf2 = await generateCertificatePDF(testData);
    const hash2 = hashFile(pdf2);
    console.log('Hash 2:', hash2);

    if (hash1 === hash2) {
        console.log('SUCCESS: PDF generation is deterministic.');
    } else {
        console.log('FAILURE: PDF generation is NOT deterministic.');
    }
};

import { writeFileSync } from 'fs';
run().catch(e => {
    writeFileSync('error_log.txt', e.stack);
    console.error('Error written to error_log.txt');
});
