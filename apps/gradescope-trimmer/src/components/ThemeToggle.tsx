import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			className="p-2 rounded-lg bg-latte-surface0 dark:bg-mocha-surface0 hover:bg-latte-surface1 dark:hover:bg-mocha-surface1 transition-colors border border-latte-overlay0 dark:border-mocha-overlay0"
			aria-label="Toggle theme"
		>
			{theme === 'light' ? (
				<Moon className="w-5 h-5 text-latte-mauve dark:text-mocha-mauve" />
			) : (
				<Sun className="w-5 h-5 text-latte-yellow dark:text-mocha-yellow" />
			)}
		</button>
	);
};

export default ThemeToggle;
