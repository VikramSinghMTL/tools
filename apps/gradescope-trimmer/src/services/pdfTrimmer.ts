/**
 * PDF Trimmer Service
 * Trims PDFs to keep only the first N pages
 */

import { PDFDocument } from 'pdf-lib';

export class PDFTrimmer {
	/**
	 * Trim a PDF to keep only the first N pages
	 */
	static async trimPdf(file: File, pagesToKeep: number): Promise<Blob> {
		try {
			// Read the PDF
			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);

			// Check if trimming is needed
			const totalPages = pdfDoc.getPageCount();
			if (totalPages <= pagesToKeep) {
				// No trimming needed, return as-is
				return new Blob([arrayBuffer], { type: 'application/pdf' });
			}

			// Create a new PDF with only the first N pages
			const trimmedPdf = await PDFDocument.create();
			const pagesToCopy = await trimmedPdf.copyPages(
				pdfDoc,
				Array.from({ length: pagesToKeep }, (_, i) => i)
			);

			// Add pages to the new document
			for (const page of pagesToCopy) {
				trimmedPdf.addPage(page);
			}

			// Save the trimmed PDF
			const trimmedBytes = await trimmedPdf.save();
			return new Blob([trimmedBytes as BlobPart], {
				type: 'application/pdf',
			});
		} catch (error) {
			throw new Error(
				`Failed to trim PDF: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	/**
	 * Batch trim multiple PDFs
	 */
	static async trimPdfs(
		files: Map<string, File>,
		pagesToKeep: number,
		onProgress?: (current: number, total: number) => void
	): Promise<Map<string, Blob>> {
		const result = new Map<string, Blob>();
		const total = files.size;
		let current = 0;

		for (const [filename, file] of files.entries()) {
			try {
				const trimmedBlob = await this.trimPdf(file, pagesToKeep);
				result.set(filename, trimmedBlob);
			} catch (error) {
				console.error(`Failed to trim ${filename}:`, error);
				// Continue processing other files
			}

			current++;
			if (onProgress) {
				onProgress(current, total);
			}
		}

		return result;
	}

	/**
	 * Get page count of a PDF
	 */
	static async getPageCount(file: File): Promise<number> {
		try {
			const arrayBuffer = await file.arrayBuffer();
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			return pdfDoc.getPageCount();
		} catch (error) {
			throw new Error(
				`Failed to read PDF: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}
}
