import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing the #root element.");

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<ThemeProvider>
			<App />
			<Toaster
				position="top-right"
				toastOptions={{
					className: "dark:bg-gray-800 dark:text-white",
					duration: 4000,
					success: {
						iconTheme: {
							primary: "#10b981",
							secondary: "#ffffff",
						},
					},
					error: {
						iconTheme: {
							primary: "#ef4444",
							secondary: "#ffffff",
						},
					},
				}}
			/>
		</ThemeProvider>
	</React.StrictMode>,
);
