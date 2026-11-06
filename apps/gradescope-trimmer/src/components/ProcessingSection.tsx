import React from 'react';
import { Settings, Download, Loader2, FileCheck } from 'lucide-react';

interface ProcessingSectionProps {
	pagesToKeep: number;
	isProcessing: boolean;
	progress: { current: number; total: number } | null;
	onPagesToKeepChange: (pages: number) => void;
	onProcess: () => void;
}

const ProcessingSection: React.FC<ProcessingSectionProps> = ({
	pagesToKeep,
	isProcessing,
	progress,
	onPagesToKeepChange,
	onProcess,
}) => {
	return (
		<section className="bg-latte-mantle dark:bg-mocha-mantle rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl border border-latte-surface0 dark:border-mocha-surface0">
			<div className="flex items-center gap-2 mb-4">
				<Settings className="w-5 h-5 text-latte-blue dark:text-mocha-blue" />
				<h3 className="text-lg font-semibold text-latte-text dark:text-mocha-text">
					Processing Settings
				</h3>
			</div>
			<div className="space-y-4">
				<div>
					<label
						htmlFor="pages-to-keep"
						className="flex items-center gap-2 text-sm font-medium text-latte-subtext1 dark:text-mocha-subtext1 mb-2"
					>
						<FileCheck className="w-4 h-4" />
						Pages to Keep
					</label>
					<input
						id="pages-to-keep"
						type="number"
						min="1"
						value={pagesToKeep}
						onChange={(e) =>
							onPagesToKeepChange(
								Math.max(1, parseInt(e.target.value) || 1)
							)
						}
						className="w-32 px-3 py-2 border border-latte-surface0 dark:border-mocha-surface0 rounded-md shadow-sm bg-latte-base dark:bg-mocha-base text-latte-text dark:text-mocha-text focus:outline-none focus:ring-2 focus:ring-latte-blue dark:focus:ring-mocha-blue focus:border-latte-blue dark:focus:border-mocha-blue transition-colors"
					/>
					<p className="mt-1 text-xs text-latte-subtext0 dark:text-mocha-subtext0">
						Number of pages to keep from the beginning of each PDF
					</p>
				</div>

				<button
					onClick={onProcess}
					disabled={isProcessing}
					className="w-full bg-gradient-to-r from-latte-blue to-latte-sapphire dark:from-mocha-blue dark:to-mocha-sapphire hover:from-latte-sapphire hover:to-latte-sky dark:hover:from-mocha-sapphire dark:hover:to-mocha-sky disabled:from-latte-overlay0 disabled:to-latte-overlay1 dark:disabled:from-mocha-overlay0 dark:disabled:to-mocha-overlay1 text-latte-crust dark:text-mocha-crust font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{isProcessing ? (
						<>
							<Loader2 className="w-5 h-5 animate-spin" />
							<span>
								Processing... {progress?.current}/
								{progress?.total}
							</span>
						</>
					) : (
						<>
							<Download className="w-5 h-5" />
							<span>Process & Download</span>
						</>
					)}
				</button>

				{isProcessing && progress && (
					<div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
						<div className="flex justify-between text-sm text-latte-subtext0 dark:text-mocha-subtext0 mb-1">
							<span>Processing PDFs...</span>
							<span>
								{progress.current} / {progress.total}
							</span>
						</div>
						<div className="w-full bg-latte-surface0 dark:bg-mocha-surface0 rounded-full h-2.5 overflow-hidden">
							<div
								className="bg-gradient-to-r from-latte-blue to-latte-sapphire dark:from-mocha-blue dark:to-mocha-sapphire h-2.5 rounded-full transition-all duration-300 ease-out"
								style={{
									width: `${
										(progress.current / progress.total) *
										100
									}%`,
								}}
							/>
						</div>
					</div>
				)}
			</div>
		</section>
	);
};

export default ProcessingSection;
