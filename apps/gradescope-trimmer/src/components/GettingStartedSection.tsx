import React from 'react';
import {
	Lightbulb,
	Download as DownloadIcon,
	Upload,
	Settings,
	FileDown,
} from 'lucide-react';

const GettingStartedSection: React.FC = () => {
	return (
		<section className="bg-gradient-to-br from-latte-blue/10 to-latte-mauve/10 dark:from-mocha-blue/10 dark:to-mocha-mauve/10 border border-latte-blue/30 dark:border-mocha-blue/30 rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex items-center gap-2 mb-4">
				<Lightbulb className="w-5 h-5 text-latte-yellow dark:text-mocha-yellow" />
				<h3 className="text-lg font-semibold text-latte-text dark:text-mocha-text">
					Getting Started
				</h3>
			</div>
			<div className="text-latte-text dark:text-mocha-text space-y-3">
				<div className="flex items-start gap-3 p-3 bg-latte-mantle/50 dark:bg-mocha-mantle/50 rounded-lg border border-latte-surface0/50 dark:border-mocha-surface0/50">
					<DownloadIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-latte-blue dark:text-mocha-blue" />
					<div>
						<strong>Step 1:</strong> Export submissions from
						Gradescope as a ZIP file
					</div>
				</div>
				<div className="flex items-start gap-3 p-3 bg-latte-mantle/50 dark:bg-mocha-mantle/50 rounded-lg border border-latte-surface0/50 dark:border-mocha-surface0/50">
					<Upload className="w-5 h-5 mt-0.5 flex-shrink-0 text-latte-green dark:text-mocha-green" />
					<div>
						<strong>Step 2:</strong> Upload the ZIP file here
					</div>
				</div>
				<div className="flex items-start gap-3 p-3 bg-latte-mantle/50 dark:bg-mocha-mantle/50 rounded-lg border border-latte-surface0/50 dark:border-mocha-surface0/50">
					<Settings className="w-5 h-5 mt-0.5 flex-shrink-0 text-latte-mauve dark:text-mocha-mauve" />
					<div>
						<strong>Step 3:</strong> Set how many pages to keep from
						each PDF
					</div>
				</div>
				<div className="flex items-start gap-3 p-3 bg-latte-mantle/50 dark:bg-mocha-mantle/50 rounded-lg border border-latte-surface0/50 dark:border-mocha-surface0/50">
					<FileDown className="w-5 h-5 mt-0.5 flex-shrink-0 text-latte-teal dark:text-mocha-teal" />
					<div>
						<strong>Step 4:</strong> Click "Process & Download" to
						get a ZIP with renamed, trimmed PDFs
					</div>
				</div>
			</div>
		</section>
	);
};

export default GettingStartedSection;
