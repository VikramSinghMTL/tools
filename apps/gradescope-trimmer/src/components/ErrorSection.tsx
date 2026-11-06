import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorSectionProps {
	error: string;
}

const ErrorSection: React.FC<ErrorSectionProps> = ({ error }) => {
	return (
		<section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-top-2 duration-300">
			<div className="flex items-start gap-3">
				<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
				<div>
					<h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
						Error
					</h3>
					<p className="text-red-700 dark:text-red-400">{error}</p>
				</div>
			</div>
		</section>
	);
};

export default ErrorSection;
