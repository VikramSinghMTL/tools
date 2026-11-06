/**
 * ZIP Handler Service
 * Handles reading and writing ZIP files containing PDFs and metadata
 */

import JSZip from 'jszip';

export interface ZipContents {
	yamlFile: File | null;
	pdfFiles: Map<string, File>; // filename -> File
}

export class ZipHandler {
	/**
	 * Extract contents from uploaded Gradescope ZIP file
	 */
	static async extractZipContents(zipFile: File): Promise<ZipContents> {
		const zip = new JSZip();
		const contents = await zip.loadAsync(zipFile);

		const result: ZipContents = {
			yamlFile: null,
			pdfFiles: new Map(),
		};

		// Find YAML metadata file (search recursively in all folders)
		for (const [filename, file] of Object.entries(contents.files)) {
			if (filename.endsWith('submission_metadata.yml') && !file.dir) {
				const yamlContent = await file.async('text');
				result.yamlFile = new File(
					[yamlContent],
					'submission_metadata.yml',
					{ type: 'text/yaml' }
				);
				break;
			}
		}

		// Extract all PDF files (from any folder)
		for (const [filename, file] of Object.entries(contents.files)) {
			if (filename.endsWith('.pdf') && !file.dir) {
				const pdfBlob = await file.async('blob');
				// Extract just the filename without the folder path
				const baseFilename = filename.split('/').pop() || filename;
				const pdfFile = new File([pdfBlob], baseFilename, {
					type: 'application/pdf',
				});
				result.pdfFiles.set(baseFilename, pdfFile);
			}
		}

		return result;
	}

	/**
	 * Create a ZIP file with renamed and trimmed PDFs
	 */
	static async createZipFile(
		files: Map<string, Blob>,
		zipFilename: string = 'assignments.zip'
	): Promise<File> {
		const zip = new JSZip();

		// Add all files to the ZIP
		for (const [filename, blob] of files.entries()) {
			zip.file(filename, blob);
		}

		// Generate the ZIP file
		const zipBlob = await zip.generateAsync({ type: 'blob' });
		return new File([zipBlob], zipFilename, {
			type: 'application/zip',
		});
	}

	/**
	 * Trigger download of a file
	 */
	static downloadFile(file: File): void {
		const url = URL.createObjectURL(file);
		const link = document.createElement('a');
		link.href = url;
		link.download = file.name;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
}
