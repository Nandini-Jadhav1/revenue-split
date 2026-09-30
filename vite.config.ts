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
    'import.meta.env.VITE_CONTRACT_ADDRESS': JSON.stringify(
      process.env.VITE_CONTRACT_ADDRESS || '02005a9c0897f1da76135dd6977be415f3cf374466986b24d77eb60cbe4eeef45a8e'
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
