import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ThemeProvider>
			<App />
			<Toaster
				position="top-right"
				toastOptions={{
					className: 'dark:bg-gray-800 dark:text-white',
					duration: 4000,
					success: {
						iconTheme: {
							primary: '#10b981',
							secondary: '#ffffff',
						},
					},
					error: {
						iconTheme: {
							primary: '#ef4444',
							secondary: '#ffffff',
						},
					},
				}}
			/>
		</ThemeProvider>
	</React.StrictMode>
);
