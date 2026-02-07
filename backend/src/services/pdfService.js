import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Tạo file PDF chứng chỉ (Chuẩn VN - Layout chính xác)
 * @param {object} data - Dữ liệu chứng chỉ
 * @returns {Promise<Buffer>} - Buffer PDF
 */
export const generateCertificatePDF = async (data) => {
    try {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit.default || fontkit);

        const fontsPath = join(__dirname, '..', 'assets', 'fonts');

        const regularFontBytes = readFileSync(join(fontsPath, 'TimesNewRoman-Regular.ttf'));
        const boldFontBytes = readFileSync(join(fontsPath, 'TimesNewRoman-Bold.ttf'));
        const italicFontBytes = readFileSync(join(fontsPath, 'TimesNewRoman-Italic.ttf'));

        const regularFont = await pdfDoc.embedFont(regularFontBytes);
        const boldFont = await pdfDoc.embedFont(boldFontBytes);
        const italicFont = await pdfDoc.embedFont(italicFontBytes);

        const page = pdfDoc.addPage([842, 595]); // A4 ngang
        const { width, height } = page.getSize();

        // Màu sắc
        const redColor = rgb(0.8, 0.1, 0.1);
        const orangeColor = rgb(0.85, 0.4, 0.1);
        const goldColor = rgb(0.85, 0.65, 0.1);
        const darkColor = rgb(0.1, 0.1, 0.1);
        const lightColor = rgb(0.4, 0.4, 0.4);

        // Viền vàng ngoài
        page.drawRectangle({
            x: 30,
            y: 30,
            width: width - 60,
            height: height - 60,
            borderColor: orangeColor,
            borderWidth: 5,
        });

        // Viền đen trong
        page.drawRectangle({
            x: 45,
            y: 45,
            width: width - 90,
            height: height - 90,
            borderColor: darkColor,
            borderWidth: 1.5,
        });

        // ========== HEADER ==========
        let yPos = height - 85;


        // CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        const title1 = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
        page.drawText(title1, {
            x: (width - boldFont.widthOfTextAtSize(title1, 13)) / 2,
            y: yPos,
            size: 13,
            font: boldFont,
            color: darkColor,
        });

        yPos -= 22;

        // Độc lập - Tự do - Hạnh phúc
        const title2 = 'Độc lập - Tự do - Hạnh phúc';
        page.drawText(title2, {
            x: (width - boldFont.widthOfTextAtSize(title2, 12)) / 2,
            y: yPos,
            size: 12,
            font: boldFont,
            color: darkColor,
        });

        yPos -= 50;



        // ========== TÊN TỔ CHỨC (nếu có) ==========
        if (data.issuerName) {
            const issuerNameUpper = data.issuerName.toUpperCase();
            // Use dynamic centering
            const issuerWidth = boldFont.widthOfTextAtSize(issuerNameUpper, 13);
            page.drawText(issuerNameUpper, {
                x: (width - issuerWidth) / 2,
                y: yPos,
                size: 13,
                font: boldFont,
                color: darkColor,
            });
            yPos -= 35;
        } else {
            yPos -= 10;
        }

        // ========== TEST (đã căn giữa) ==========
        if (data.testLabel) {
            const testText = 'TEST';
            const testWidth = regularFont.widthOfTextAtSize(testText, 11);
            page.drawText(testText, {
                x: (width - testWidth) / 2,
                y: yPos,
                size: 11,
                font: regularFont,
                color: darkColor,
            });
            yPos -= 25;
        }

        // ========== CHỨNG CHỈ (đã căn giữa) ==========
        yPos -= 20; // Extra spacing as requested
        const certTitle = 'CHỨNG CHỈ';
        const certTitleWidth = boldFont.widthOfTextAtSize(certTitle, 38);
        page.drawText(certTitle, {
            x: (width - certTitleWidth) / 2,
            y: yPos,
            size: 38,
            font: boldFont,
            color: orangeColor,
        });

        yPos -= 32;

        // HOÀN THÀNH KHÓA HỌC (đã căn giữa)
        const textComplete = 'HOÀN THÀNH KHÓA HỌC';
        const textCompleteWidth = regularFont.widthOfTextAtSize(textComplete, 15);
        page.drawText(textComplete, {
            x: (width - textCompleteWidth) / 2,
            y: yPos,
            size: 15,
            font: regularFont,
            color: darkColor,
        });

        yPos -= 25;

        // Số chứng chỉ
        const certId = `Số: ${data.certificateId || 'N/A'}`;
        page.drawText(certId, {
            x: width / 2 - (certId.length * 3),
            y: yPos,
            size: 10,
            font: italicFont,
            color: lightColor,
        });

        yPos -= 45;

        // ========== CHỨNG NHẬN ÔNG/BÀ ==========
        const leftMargin = 160;

        page.drawText('Chứng nhận ông/bà:', {
            x: leftMargin,
            y: yPos,
            size: 11,
            font: regularFont,
            color: darkColor,
        });

        yPos -= 30;

        // TÊN HỌC VIÊN (IN HOA, ĐỎ, TO)
        const studentNameUpper = (data.studentName || 'TEST').toUpperCase();
        const studentNameWidth = studentNameUpper.length * 9;
        page.drawText(studentNameUpper, {
            x: width / 2 - studentNameWidth / 2,
            y: yPos,
            size: 20,
            font: boldFont,
            color: orangeColor,
        });

        // Gạch dưới tên
        page.drawLine({
            start: { x: 240, y: yPos - 5 },
            end: { x: width - 240, y: yPos - 5 },
            thickness: 1,
            color: lightColor,
        });

        yPos -= 40;

        // ========== ĐÃ HOÀN THÀNH CHƯƠNG TRÌNH ==========
        page.drawText('Đã hoàn thành chương trình:', {
            x: leftMargin,
            y: yPos,
            size: 11,
            font: regularFont,
            color: darkColor,
        });

        yPos -= 30;

        // TÊN KHÓA HỌC (trong ngoặc kép, in đậm)
        const courseName = data.courseName || 'tét';
        const courseText = `"${courseName}"`;
        const courseWidth = courseText.length * 7;
        page.drawText(courseText, {
            x: width / 2 - courseWidth / 2,
            y: yPos,
            size: 15,
            font: boldFont,
            color: darkColor,
        });

        yPos -= 40;

        // ========== CHI TIẾT KHÓA HỌC (2 CỘT) ==========
        const col1X = leftMargin;
        const col2X = width / 2 + 20;

        // Cột 1
        page.drawText(`Mã khóa học: ${data.courseCode || 'N/A'}`, {
            x: col1X,
            y: yPos,
            size: 10,
            font: regularFont,
            color: darkColor,
        });

        page.drawText(`Hình thức: ${data.trainingType || 'Trực tuyến'}`, {
            x: col1X,
            y: yPos - 18,
            size: 10,
            font: regularFont,
            color: darkColor,
        });

        // Cột 2
        page.drawText(`Thời lượng: ${data.duration || 'N/A'}`, {
            x: col2X,
            y: yPos,
            size: 10,
            font: regularFont,
            color: darkColor,
        });

        page.drawText(`Kết quả: ${data.result || 'N/A'}`, {
            x: col2X,
            y: yPos - 18,
            size: 10,
            font: regularFont,
            color: darkColor,
        });

        yPos -= 55;

        // ========== FOOTER (Disclaimers) ==========
        let footerY = 85;

        const line1 = 'Đây là chứng chỉ số được xác thực trên Cronos Blockchain.';
        const line2 = `Chứng chỉ giấy gốc do ${data.issuerName || 'Tổ chức'} cấp có giá trị pháp lý chính thức.`;
        const line3 = 'Xác minh tính hợp lệ tại: https://blockchain-certificates-storing.vercel.app/';

        // Line 1
        page.drawText(line1, {
            x: (width - italicFont.widthOfTextAtSize(line1, 10)) / 2,
            y: footerY,
            size: 10,
            font: italicFont,
            color: darkColor,
        });

        // Line 2
        page.drawText(line2, {
            x: (width - italicFont.widthOfTextAtSize(line2, 10)) / 2,
            y: footerY - 15,
            size: 10,
            font: italicFont,
            color: darkColor,
        });

        // Line 3
        page.drawText(line3, {
            x: (width - italicFont.widthOfTextAtSize(line3, 10)) / 2,
            y: footerY - 30,
            size: 10,
            font: italicFont,
            color: darkColor,
        });

        // ========== METADATA ==========
        const creationDate = data.issuedAt ? new Date(data.issuedAt) : new Date();
        pdfDoc.setCreationDate(creationDate);
        pdfDoc.setModificationDate(creationDate);
        pdfDoc.setTitle('Chứng Chỉ Hoàn Thành Khóa Học');
        pdfDoc.setAuthor(data.issuerName || 'Hệ Thống Chứng Chỉ');
        pdfDoc.setProducer('Hệ Thống Chứng Chỉ Blockchain');

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error('Lỗi tạo PDF:', error);
        throw new Error(`Không thể tạo PDF: ${error.message}`);
    }
};

/**
 * Lưu PDF vào hệ thống file
 * @param {Buffer} pdfBuffer - Buffer PDF
 * @param {string} outputPath - Đường dẫn file output
 */
export const savePDF = (pdfBuffer, outputPath) => {
    try {
        writeFileSync(outputPath, pdfBuffer);
        return outputPath;
    } catch (error) {
        console.error('Lỗi lưu PDF:', error);
        throw new Error(`Không thể lưu PDF: ${error.message}`);
    }
};
