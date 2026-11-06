import React from 'react';
import { CheckCircle, Users, FileText, Info } from 'lucide-react';
import type { SubmissionMetadata } from '../services/yamlParser';

interface MetadataSectionProps {
	metadata: SubmissionMetadata;
	pdfFilesCount: number;
	stats: {
		totalSubmissions: number;
		uniqueStudents: number;
		groupSubmissions: number;
	};
}

const MetadataSection: React.FC<MetadataSectionProps> = ({
	metadata,
	pdfFilesCount,
	stats,
}) => {
	return (
		<section className="bg-latte-green/10 dark:bg-mocha-green/10 border border-latte-green/30 dark:border-mocha-green/30 rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-top-2 duration-300">
			<div className="flex items-center gap-2 mb-4">
				<CheckCircle className="w-5 h-5 text-latte-green dark:text-mocha-green" />
				<h3 className="text-lg font-semibold text-latte-text dark:text-mocha-text">
					Metadata Loaded Successfully
				</h3>
			</div>
			<div className="space-y-4">
				<div className="grid grid-cols-3 gap-4 text-sm">
					<div className="text-latte-text dark:text-mocha-text bg-latte-mantle dark:bg-mocha-mantle p-3 rounded-lg border border-latte-surface0 dark:border-mocha-surface0">
						<div className="flex items-center gap-2 mb-1">
							<FileText className="w-4 h-4 text-latte-blue dark:text-mocha-blue" />
							<span className="font-medium">
								Total submissions:
							</span>
						</div>
						<span className="text-2xl font-bold text-latte-blue dark:text-mocha-blue">
							{stats.totalSubmissions}
						</span>
					</div>
					<div className="text-latte-text dark:text-mocha-text bg-latte-mantle dark:bg-mocha-mantle p-3 rounded-lg border border-latte-surface0 dark:border-mocha-surface0">
						<div className="flex items-center gap-2 mb-1">
							<Users className="w-4 h-4 text-latte-mauve dark:text-mocha-mauve" />
							<span className="font-medium">
								Unique students:
							</span>
						</div>
						<span className="text-2xl font-bold text-latte-mauve dark:text-mocha-mauve">
							{stats.uniqueStudents}
						</span>
					</div>
					<div className="text-latte-text dark:text-mocha-text bg-latte-mantle dark:bg-mocha-mantle p-3 rounded-lg border border-latte-surface0 dark:border-mocha-surface0">
						<div className="flex items-center gap-2 mb-1">
							<FileText className="w-4 h-4 text-latte-teal dark:text-mocha-teal" />
							<span className="font-medium">PDF files:</span>
						</div>
						<span className="text-2xl font-bold text-latte-teal dark:text-mocha-teal">
							{pdfFilesCount}
						</span>
					</div>
				</div>
				{stats.groupSubmissions > 0 && (
					<div className="flex items-start gap-2 text-latte-yellow dark:text-mocha-yellow text-sm bg-latte-yellow/10 dark:bg-mocha-yellow/10 p-3 rounded-lg border border-latte-yellow/30 dark:border-mocha-yellow/30">
						<Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<p>
							<span className="font-medium">Note:</span>{' '}
							{stats.groupSubmissions} group submission
							{stats.groupSubmissions > 1 ? 's' : ''} found (will
							use first student's ID)
						</p>
					</div>
				)}
				<div className="mt-4">
					<h4 className="text-sm font-medium text-latte-text dark:text-mocha-text mb-2">
						Submission Details
					</h4>
					<div className="max-h-64 overflow-y-auto border border-latte-surface0 dark:border-mocha-surface0 rounded-md bg-latte-mantle dark:bg-mocha-mantle">
						<table className="min-w-full divide-y divide-latte-surface0 dark:divide-mocha-surface0">
							<thead className="bg-latte-crust dark:bg-mocha-crust sticky top-0">
								<tr>
									<th className="px-4 py-2 text-left text-xs font-medium text-latte-subtext0 dark:text-mocha-subtext0 uppercase tracking-wider">
										PDF File
									</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-latte-subtext0 dark:text-mocha-subtext0 uppercase tracking-wider">
										Student Name
									</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-latte-subtext0 dark:text-mocha-subtext0 uppercase tracking-wider">
										Student ID
									</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-latte-subtext0 dark:text-mocha-subtext0 uppercase tracking-wider">
										Email
									</th>
								</tr>
							</thead>
							<tbody className="bg-latte-mantle dark:bg-mocha-mantle divide-y divide-latte-surface0 dark:divide-mocha-surface0">
								{Object.entries(metadata).map(
									([filename, submission]) => {
										const submitter =
											submission.submitters[0];
										return (
											<tr
												key={filename}
												className="hover:bg-latte-surface0/50 dark:hover:bg-mocha-surface0/50 transition-colors"
											>
												<td className="px-4 py-2 text-sm text-latte-text dark:text-mocha-text font-mono">
													{filename}
												</td>
												<td className="px-4 py-2 text-sm text-latte-text dark:text-mocha-text">
													{submitter?.name || 'N/A'}
													{submission.submitters
														.length > 1 && (
														<span className="ml-1 text-xs text-latte-subtext0 dark:text-mocha-subtext0">
															(+
															{submission
																.submitters
																.length -
																1}{' '}
															more)
														</span>
													)}
												</td>
												<td className="px-4 py-2 text-sm text-latte-subtext1 dark:text-mocha-subtext1">
													{submitter?.sid || 'N/A'}
												</td>
												<td className="px-4 py-2 text-sm text-latte-subtext1 dark:text-mocha-subtext1">
													{submitter?.email || 'N/A'}
												</td>
											</tr>
										);
									}
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</section>
	);
};

export default MetadataSection;
