import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Multi-page build: the main single-page site plus the separate Booking and Login pages.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Development only: forward API calls to the backend (`npm run dev:server`, port 4000) so the pages use relative /api URLs everywhere.
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/reset-password': 'http://localhost:4000',
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        booking: resolve(__dirname, 'booking.html'),
        login: resolve(__dirname, 'login.html'),
      },
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
