import React from 'react';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
	children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	return (
		<div className="bg-latte-base dark:bg-mocha-base min-h-screen transition-colors duration-300">
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				<header className="mb-8">
					<div className="flex justify-between items-start mb-4">
						<div className="flex-1">
							<h1 className="text-4xl font-bold text-latte-text dark:text-mocha-text mb-2 transition-colors">
								Gradescope PDF Trimmer
							</h1>
							<p className="text-lg text-latte-subtext0 dark:text-mocha-subtext0 transition-colors">
								Process Gradescope exports: trim PDFs and rename
								by student ID
							</p>
						</div>
						<ThemeToggle />
					</div>
				</header>

				<main className="space-y-6">{children}</main>

				<footer className="mt-12 pt-8 border-t border-latte-surface0 dark:border-mocha-surface0 transition-colors">
					<div className="text-center space-y-3">
						<p className="text-sm text-latte-subtext0 dark:text-mocha-subtext0">
							All processing happens in your browser. No data is
							sent to any server.
						</p>
						<div className="flex items-center justify-center gap-6 text-sm">
							<a
								href="mailto:vikram.singh@johnabbott.qc.ca"
								className="text-latte-blue dark:text-mocha-blue hover:text-latte-sapphire dark:hover:text-mocha-sapphire transition-colors"
							>
								Contact
							</a>
							<span className="text-latte-overlay0 dark:text-mocha-overlay0">
								•
							</span>
							<a
								href="https://github.com/VikramSinghMTL/gradescope-trimmer"
								target="_blank"
								rel="noopener noreferrer"
								className="text-latte-blue dark:text-mocha-blue hover:text-latte-sapphire dark:hover:text-mocha-sapphire transition-colors"
							>
								GitHub
							</a>
						</div>
						<p className="text-xs text-latte-subtext0 dark:text-mocha-subtext0">
							Version 1.0.0 | © 2025 Vikram Singh
						</p>
					</div>
				</footer>
			</div>
		</div>
	);
};

export default Layout;
