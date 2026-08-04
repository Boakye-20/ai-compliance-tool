const MAX_FILE_BYTES = 10 * 1024 * 1024; // ten megabytes
const PDF_MAGIC = Buffer.from('%PDF');

export interface FileValidationResult {
    valid: boolean;
    reason?: string;
}

// Checks size, declared type or extension, and the file's magic bytes, so a
// renamed or mislabelled non-PDF file is rejected before it reaches the
// extraction pipeline.
export function validatePdfUpload(file: File, buffer: Buffer): FileValidationResult {
    if (file.size === 0) {
        return { valid: false, reason: 'The uploaded file is empty.' };
    }
    if (file.size > MAX_FILE_BYTES) {
        return { valid: false, reason: 'The file exceeds the ten megabyte limit.' };
    }

    const looksLikePdfName = file.name?.toLowerCase().endsWith('.pdf') ?? false;
    const looksLikePdfType = file.type === 'application/pdf';
    if (!looksLikePdfName && !looksLikePdfType) {
        return { valid: false, reason: 'Only PDF documents are accepted.' };
    }

    if (buffer.length < 4 || buffer.subarray(0, 4).compare(PDF_MAGIC) !== 0) {
        return { valid: false, reason: 'The file content does not match the PDF format.' };
    }

    return { valid: true };
}
