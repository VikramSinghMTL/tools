import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	// Relative asset paths so the built site works from any folder, not just a domain root.
	base: "./",
	plugins: [
		vue(),
		tailwindcss(),
		// A service worker that caches the whole app, so it works offline and can be installed.
		// It updates itself when a new version is deployed.
		VitePWA({
			registerType: "autoUpdate",
			injectRegister: "script-defer",
			manifest: false, // public/site.webmanifest is used as is.
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,webmanifest,txt}"],
			},
		}),
	],
	server: { port: 8080 },
});
