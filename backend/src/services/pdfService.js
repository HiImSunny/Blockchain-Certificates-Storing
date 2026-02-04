import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate a certificate PDF (Supports Unicode/Vietnamese)
 * @param {object} data - Certificate data
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateCertificatePDF = async (data) => {
    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        // Construct paths to font files correctly relative to this file
        // Current file is in: src/services/
        // Fonts are in: src/assets/fonts/
        const fontsPath = join(__dirname, '..', 'assets', 'fonts');

        const regularFontBytes = readFileSync(join(fontsPath, 'Roboto-Regular.ttf'));
        const boldFontBytes = readFileSync(join(fontsPath, 'Roboto-Bold.ttf'));
        const italicFontBytes = readFileSync(join(fontsPath, 'Roboto-Italic.ttf'));

        const regularFont = await pdfDoc.embedFont(regularFontBytes);
        const boldFont = await pdfDoc.embedFont(boldFontBytes);
        const italicFont = await pdfDoc.embedFont(italicFontBytes);

        const page = pdfDoc.addPage([842, 595]); // A4 landscape

        const { width, height } = page.getSize();

        // Colors
        const primaryColor = rgb(0.85, 0.4, 0.1); // Orange
        const darkColor = rgb(0.2, 0.2, 0.2);
        const lightColor = rgb(0.5, 0.5, 0.5);

        // Draw border
        page.drawRectangle({
            x: 30,
            y: 30,
            width: width - 60,
            height: height - 60,
            borderColor: primaryColor,
            borderWidth: 3,
        });

        page.drawRectangle({
            x: 40,
            y: 40,
            width: width - 80,
            height: height - 80,
            borderColor: darkColor,
            borderWidth: 1,
        });

        // Header
        page.drawText('Digital Certificate Storing by DNC', {
            x: width / 2 - 180,
            y: height - 80,
            size: 16,
            font: italicFont,
            color: primaryColor,
        });

        // Title
        page.drawText('CERTIFICATE', {
            x: width / 2 - 80,
            y: height - 130,
            size: 32,
            font: boldFont,
            color: darkColor,
        });

        page.drawText('OF COMPLETION', {
            x: width / 2 - 70,
            y: height - 160,
            size: 18,
            font: regularFont,
            color: lightColor,
        });

        // Certificate ID
        page.drawText(`Certificate ID: ${data.certificateId || 'N/A'}`, {
            x: width / 2 - 100,
            y: height - 190,
            size: 11,
            font: regularFont,
            color: lightColor,
        });

        // Content
        let yPosition = height - 240;

        // Student name
        page.drawText('This is to certify that', {
            x: width / 2 - 80,
            y: yPosition,
            size: 12,
            font: regularFont,
            color: darkColor,
        });

        yPosition -= 35;
        page.drawText(data.studentName || 'N/A', {
            x: width / 2 - (data.studentName?.length * 6 || 20),
            y: yPosition,
            size: 24,
            font: boldFont,
            color: primaryColor,
        });

        // Draw underline
        page.drawLine({
            start: { x: 150, y: yPosition - 5 },
            end: { x: width - 150, y: yPosition - 5 },
            thickness: 1,
            color: lightColor,
        });

        yPosition -= 50;

        // Course information
        page.drawText('has successfully completed the course', {
            x: width / 2 - 140,
            y: yPosition,
            size: 12,
            font: regularFont,
            color: darkColor,
        });

        yPosition -= 30;
        page.drawText(`"${data.courseName || 'N/A'}"`, {
            x: width / 2 - ((data.courseName?.length * 5) || 30),
            y: yPosition,
            size: 16,
            font: boldFont,
            color: darkColor,
        });

        yPosition -= 40;

        // Additional details
        const details = [
            { label: 'Course Code:', value: data.courseCode || 'N/A' },
            { label: 'Training Type:', value: data.trainingType || 'N/A' },
            { label: 'Duration:', value: data.duration || 'N/A' },
            { label: 'Result:', value: data.result || 'N/A' },
        ];

        details.forEach((detail) => {
            page.drawText(`${detail.label} ${detail.value}`, {
                x: 100,
                y: yPosition,
                size: 10,
                font: regularFont,
                color: darkColor,
            });
            yPosition -= 20;
        });

        // Issuer information
        yPosition -= 20;
        page.drawText(`Issued by: ${data.issuerName || 'N/A'}`, {
            x: 100,
            y: yPosition,
            size: 11,
            font: boldFont,
            color: darkColor,
        });

        yPosition -= 20;
        if (data.issuerWebsite) {
            page.drawText(`Website: ${data.issuerWebsite}`, {
                x: 100,
                y: yPosition,
                size: 9,
                font: regularFont,
                color: lightColor,
            });
            yPosition -= 15;
        }

        if (data.issuerContact) {
            page.drawText(`Contact: ${data.issuerContact}`, {
                x: 100,
                y: yPosition,
                size: 9,
                font: regularFont,
                color: lightColor,
            });
        }

        // Date
        const issuedDate = data.issuedAt
            ? new Date(data.issuedAt).toLocaleDateString('en-US')
            : new Date().toLocaleDateString('en-US');

        page.drawText(`Issued on: ${issuedDate}`, {
            x: width - 250,
            y: 100,
            size: 10,
            font: regularFont,
            color: darkColor,
        });

        // Footer - Blockchain verification note
        page.drawText('This certificate is verified on Cronos Blockchain', {
            x: width / 2 - 145,
            y: 60,
            size: 9,
            font: italicFont,
            color: lightColor,
        });

        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    }
};

/**
 * Save PDF to file system
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} outputPath - Output file path
 */
export const savePDF = (pdfBuffer, outputPath) => {
    try {
        writeFileSync(outputPath, pdfBuffer);
        return outputPath;
    } catch (error) {
        console.error('PDF save error:', error);
        throw new Error(`Failed to save PDF: ${error.message}`);
    }
};
