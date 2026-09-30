import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    // Expose CONTRACT_ADDRESS as a compile-time constant for production builds
    'VITE_CONTRACT_ADDRESS': JSON.stringify(
      process.env.VITE_CONTRACT_ADDRESS || '0xdd549ae8216a1a2a22b85e84e69d1f8a3a7396e45c9cd2af543d673b41e05214'
    ),
  },
  optimizeDeps: {
    // Exclude Node.js-only SDK packages from browser bundle optimization
    exclude: [
      '@midnight-ntwrk/midnight-js-node-zk-config-provider',
      '@midnight-ntwrk/midnight-js-level-private-state-provider',
      '@midnight-ntwrk/midnight-js-http-client-proof-provider',
      '@midnight-ntwrk/testkit-js',
      '@midnight-ntwrk/wallet-sdk',
    ],
  },
});
