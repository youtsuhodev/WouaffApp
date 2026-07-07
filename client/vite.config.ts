import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'process', 'stream', 'buffer'],
      globals: { process: true, Buffer: true },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7284',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:7284',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
