import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	base: "/gradescope-trimmer/",
	plugins: [react(), tailwindcss()],
	build: {
		rolldownOptions: {
			output: {
				// Separate chunks for the big libraries, so they stay cached when only the app changes.
				codeSplitting: {
					groups: [
						{
							name: "react",
							test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
						},
						{ name: "pdf", test: /node_modules[\\/]pdf-lib[\\/]/ },
						{ name: "zip", test: /node_modules[\\/]jszip[\\/]/ },
					],
				},
			},
		},
	},
});
