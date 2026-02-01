import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate a certificate PDF with Vietnamese template
 * @param {object} data - Certificate data
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateCertificatePDF = async (data) => {
    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 595]); // A4 landscape

        // Load fonts
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

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

        // Header - "Digital Certificate Storing by DNC"
        page.drawText('Digital Certificate Storing by DNC', {
            x: width / 2 - 180,
            y: height - 80,
            size: 16,
            font: italicFont,
            color: primaryColor,
        });

        // Title - "CHỨNG CHỈ / CERTIFICATE"
        page.drawText('CHỨNG CHỈ', {
            x: width / 2 - 80,
            y: height - 130,
            size: 32,
            font: boldFont,
            color: darkColor,
        });

        page.drawText('CERTIFICATE', {
            x: width / 2 - 70,
            y: height - 160,
            size: 18,
            font: regularFont,
            color: lightColor,
        });

        // Certificate ID
        page.drawText(`Mã số / ID: ${data.certificateId || 'N/A'}`, {
            x: width / 2 - 100,
            y: height - 190,
            size: 11,
            font: regularFont,
            color: lightColor,
        });

        // Content
        let yPosition = height - 240;

        // Student name
        page.drawText('Chứng nhận / This is to certify that', {
            x: width / 2 - 120,
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
        const courseText = `đã hoàn thành khóa học / has successfully completed the course`;
        page.drawText(courseText, {
            x: width / 2 - 200,
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
            { label: 'Mã khóa học / Course Code:', value: data.courseCode || 'N/A' },
            { label: 'Hình thức / Type:', value: data.trainingType || 'N/A' },
            { label: 'Thời lượng / Duration:', value: data.duration || 'N/A' },
            { label: 'Kết quả / Result:', value: data.result || 'N/A' },
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
        page.drawText(`Đơn vị cấp / Issued by: ${data.issuerName || 'N/A'}`, {
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
            page.drawText(`Liên hệ / Contact: ${data.issuerContact}`, {
                x: 100,
                y: yPosition,
                size: 9,
                font: regularFont,
                color: lightColor,
            });
        }

        // Date
        const issuedDate = data.issuedAt
            ? new Date(data.issuedAt).toLocaleDateString('vi-VN')
            : new Date().toLocaleDateString('vi-VN');

        page.drawText(`Ngày cấp / Issued on: ${issuedDate}`, {
            x: width - 250,
            y: 100,
            size: 10,
            font: regularFont,
            color: darkColor,
        });

        // Footer - Blockchain verification note
        page.drawText('Chứng chỉ này được xác thực trên Blockchain Cronos', {
            x: width / 2 - 160,
            y: 60,
            size: 8,
            font: italicFont,
            color: lightColor,
        });

        page.drawText('This certificate is verified on Cronos Blockchain', {
            x: width / 2 - 145,
            y: 50,
            size: 8,
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
