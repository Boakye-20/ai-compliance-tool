import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer, {
            max: 30, // limit to first 30 pages for cost/performance
        });
        return data.text || '';
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF');
    }
}
