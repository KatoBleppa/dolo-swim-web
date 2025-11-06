import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost', // Use localhost instead of 0.0.0.0 for better firewall compatibility
    port: 5174,
    open: true, // Automatically open browser
    strictPort: false, // Allow Vite to find another port if this one is busy
    hmr: {
      overlay: true
    }
  }
})
