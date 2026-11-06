import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative asset paths so the built site works from any folder, not just a domain root.
  base: './',
  plugins: [vue(), tailwindcss()],
  server: { port: 8080 },
});
