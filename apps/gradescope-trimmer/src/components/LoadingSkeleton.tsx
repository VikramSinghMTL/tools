import React from 'react';

const LoadingSkeleton: React.FC = () => {
	return (
		<section className="bg-latte-mantle dark:bg-mocha-mantle rounded-lg shadow p-6 animate-pulse border border-latte-surface0 dark:border-mocha-surface0">
			<div className="space-y-4">
				<div className="h-6 bg-latte-surface0 dark:bg-mocha-surface0 rounded w-1/3"></div>
				<div className="space-y-3">
					<div className="h-4 bg-latte-surface0 dark:bg-mocha-surface0 rounded w-full"></div>
					<div className="h-4 bg-latte-surface0 dark:bg-mocha-surface0 rounded w-5/6"></div>
					<div className="h-4 bg-latte-surface0 dark:bg-mocha-surface0 rounded w-4/6"></div>
				</div>
			</div>
		</section>
	);
};

export default LoadingSkeleton;
