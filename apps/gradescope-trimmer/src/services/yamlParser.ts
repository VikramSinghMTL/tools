/**
 * YAML Parser Service
 * Parses Gradescope submission_metadata.yml file
 */

import yaml from 'js-yaml';

export interface Submitter {
	name: string;
	sid: string;
	email: string;
}

export interface Submission {
	submitters: Submitter[];
	createdAt: Date;
	score: number;
	originalFilename: string;
}

export interface SubmissionMetadata {
	[pdfFilename: string]: Submission;
}

export class YAMLParser {
	/**
	 * Parse submission_metadata.yml content
	 */
	static parse(yamlContent: string): SubmissionMetadata {
		try {
			const rawData = yaml.load(yamlContent) as any;
			const metadata: SubmissionMetadata = {};

			for (const [pdfFilename, data] of Object.entries(rawData)) {
				const submissionData = data as any;

				metadata[pdfFilename] = {
					submitters: submissionData[':submitters'].map((s: any) => ({
						name: s[':name'],
						sid: s[':sid'],
						email: s[':email'],
					})),
					createdAt: new Date(submissionData[':created_at']),
					score: submissionData[':score'],
					originalFilename: submissionData[':original_filename'],
				};
			}

			return metadata;
		} catch (error) {
			throw new Error(
				`Failed to parse YAML: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	/**
	 * Get student ID for a given PDF filename
	 */
	static getStudentId(
		metadata: SubmissionMetadata,
		pdfFilename: string
	): string | null {
		const submission = metadata[pdfFilename];
		if (!submission || submission.submitters.length === 0) {
			return null;
		}
		// Return the first submitter's ID
		return submission.submitters[0].sid;
	}

	/**
	 * Get all PDF filenames from metadata
	 */
	static getPdfFilenames(metadata: SubmissionMetadata): string[] {
		return Object.keys(metadata);
	}

	/**
	 * Get statistics about the submissions
	 */
	static getStats(metadata: SubmissionMetadata): {
		totalSubmissions: number;
		uniqueStudents: number;
		groupSubmissions: number;
	} {
		const entries = Object.values(metadata);
		const uniqueStudents = new Set(
			entries.flatMap((e) => e.submitters.map((s) => s.sid))
		);

		return {
			totalSubmissions: entries.length,
			uniqueStudents: uniqueStudents.size,
			groupSubmissions: entries.filter((e) => e.submitters.length > 1)
				.length,
		};
	}
}
