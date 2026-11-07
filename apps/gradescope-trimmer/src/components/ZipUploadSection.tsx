import { CheckCircle, Upload } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";

interface ZipUploadSectionProps {
	zipFile: File | null;
	onZipUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ZipUploadSection: React.FC<ZipUploadSectionProps> = ({
	zipFile,
	onZipUpload,
}) => {
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.name.endsWith(".zip")) {
				// Manually set the file input's files and trigger the change event
				if (fileInputRef.current) {
					const dataTransfer = new DataTransfer();
					dataTransfer.items.add(file);
					fileInputRef.current.files = dataTransfer.files;

					// Trigger the change event
					const event = new Event("change", { bubbles: true });
					fileInputRef.current.dispatchEvent(event);
				}
			}
		}
	};

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<section className="bg-latte-mantle dark:bg-mocha-mantle rounded-lg shadow-lg transition-all duration-300 border border-latte-surface0 dark:border-mocha-surface0 overflow-hidden">
			<div className={`p-6 ${zipFile ? "pb-3" : ""}`}>
				<div className="flex items-center gap-2 mb-4">
					<Upload className="w-5 h-5 text-latte-blue dark:text-mocha-blue" />
					<h3 className="text-lg font-semibold text-latte-text dark:text-mocha-text">
						Upload Gradescope Export
					</h3>
				</div>

				{/* One file input, opened by the drop zone or the "Change file" button. */}
				<input
					ref={fileInputRef}
					id="zip-upload"
					type="file"
					accept=".zip"
					onChange={onZipUpload}
					className="hidden"
				/>

				{/* Show collapsed state when file is uploaded */}
				{zipFile ? (
					<div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-latte-green/10 dark:bg-mocha-green/10 border border-latte-green/20 dark:border-mocha-green/20 animate-in fade-in duration-300">
						<div className="flex items-center gap-2 flex-1 min-w-0">
							<CheckCircle className="w-5 h-5 shrink-0 text-latte-green dark:text-mocha-green" />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-latte-green dark:text-mocha-green">
									File uploaded successfully
								</p>
								<p className="text-xs text-latte-subtext1 dark:text-mocha-subtext1 truncate">
									{zipFile.name}
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={handleClick}
							className="px-3 py-1.5 text-xs font-medium text-latte-blue dark:text-mocha-blue hover:bg-latte-blue/10 dark:hover:bg-mocha-blue/10 rounded-sm transition-colors shrink-0"
						>
							Change file
						</button>
					</div>
				) : (
					/* Show full drop zone when no file is uploaded */
					<button
						type="button"
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onClick={handleClick}
						className={`
							relative block w-full border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer
							${
								isDragging
									? "border-latte-blue dark:border-mocha-blue bg-latte-blue/5 dark:bg-mocha-blue/5 scale-[1.02]"
									: "border-latte-surface1 dark:border-mocha-surface1 hover:border-latte-blue/50 dark:hover:border-mocha-blue/50 hover:bg-latte-surface0/30 dark:hover:bg-mocha-surface0/30"
							}
						`}
					>
						<span className="flex flex-col items-center justify-center text-center space-y-3">
							<span
								className={`
								p-4 rounded-full transition-all duration-300
								${
									isDragging
										? "bg-latte-blue/20 dark:bg-mocha-blue/20 scale-110"
										: "bg-latte-surface0 dark:bg-mocha-surface0"
								}
							`}
							>
								<Upload
									className={`
									w-8 h-8 transition-colors duration-300
									${
										isDragging
											? "text-latte-blue dark:text-mocha-blue"
											: "text-latte-subtext1 dark:text-mocha-subtext1"
									}
								`}
								/>
							</span>

							<span className="block">
								<span className="block text-base font-medium text-latte-text dark:text-mocha-text mb-1">
									{isDragging
										? "Drop your ZIP file here"
										: "Drag and drop your ZIP file here"}
								</span>
								<span className="block text-sm text-latte-subtext0 dark:text-mocha-subtext0">
									or click to browse
								</span>
							</span>

							<span className="block text-xs text-latte-subtext0 dark:text-mocha-subtext0 max-w-md">
								Upload the ZIP file exported from Gradescope (should contain
								submission_metadata.yml and PDF files)
							</span>
						</span>
					</button>
				)}
			</div>
		</section>
	);
};

export default ZipUploadSection;
