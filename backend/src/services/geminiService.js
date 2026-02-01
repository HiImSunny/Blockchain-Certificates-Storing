import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract text and structured data from a certificate image/PDF
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<{extractedText: string, structuredData: object}>}
 */
export const extractCertificateData = async (filePath, mimeType) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('Gemini API key not found, skipping AI extraction.');
            return { extractedText: '', structuredData: {} };
        }

        // List of models to try in order
        const modelsToTry = [
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-2.0-flash'
        ];

        let result = null;
        let usedModel = '';

        // Read file as base64
        const fileBuffer = readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');

        const prompt = `
You are an AI assistant that extracts information from educational certificates.
Analyze this certificate image/PDF and extract the following information in JSON format:

{
  "studentName": "Full name of the student/recipient",
  "studentId": "Student ID or identification number (if visible)",
  "dateOfBirth": "Date of birth (if visible, format: YYYY-MM-DD)",
  "courseName": "Name of the course or program",
  "courseCode": "Course code (if visible)",
  "trainingType": "Online, Offline, or Hybrid (if visible)",
  "duration": "Duration of the course (e.g., '3 months', '120 hours')",
  "result": "Result or grade (e.g., 'Pass', 'Distinction', '8.5/10')",
  "issuedAt": "Date of issuance (format: YYYY-MM-DD)",
  "issuerName": "Name of the issuing organization/institution",
  "issuerWebsite": "Website of the issuer (if visible)",
  "issuerContact": "Contact information (email/phone, if visible)"
}

IMPORTANT:
- Only extract information that is clearly visible in the certificate
- Use null for fields that are not visible or cannot be determined
- For Vietnamese text, preserve the original Vietnamese characters
- Be accurate and do not make assumptions
- Return ONLY the JSON object, no additional text
`;

        // Try models sequentially
        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType,
                        },
                    },
                ]);
                usedModel = modelName;
                break; // If successful, stop trying
            } catch (err) {
                console.warn(`Model ${modelName} failed:`, err.message);
                // Continue to next model
            }
        }

        if (!result) {
            console.warn('All Gemini models failed. AI extraction skipped.');
            return { extractedText: '', structuredData: {} };
        }

        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        let structuredData = {};
        try {
            // Try to parse the entire response as JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                structuredData = JSON.parse(jsonMatch[0]);
            } else {
                structuredData = JSON.parse(text);
            }
        } catch (parseError) {
            console.warn('Failed to parse Gemini response as JSON:', parseError);
            structuredData = { rawText: text };
        }

        return {
            extractedText: text,
            structuredData,
        };
    } catch (error) {
        console.error('Gemini AI extraction error:', error.message);
        // Do not throw, return empty to allow upload to proceed
        return { extractedText: '', structuredData: {} };
    }
};

/**
 * Extract text from a PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>}
 */
export const extractPdfText = async (filePath) => {
    try {
        const result = await extractCertificateData(filePath, 'application/pdf');
        return result.extractedText;
    } catch (error) {
        console.error('PDF text extraction error:', error);
        throw error;
    }
};

/**
 * Extract text from an image file
 * @param {string} filePath - Path to image file
 * @param {string} mimeType - MIME type (image/jpeg, image/png, etc.)
 * @returns {Promise<string>}
 */
export const extractImageText = async (filePath, mimeType = 'image/jpeg') => {
    try {
        const result = await extractCertificateData(filePath, mimeType);
        return result.extractedText;
    } catch (error) {
        console.error('Image text extraction error:', error);
        throw error;
    }
};
