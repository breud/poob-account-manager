import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // './' base so file:// asset paths resolve correctly inside Electron
  base: './',
  server: {
    port: 5173,
  },
})
