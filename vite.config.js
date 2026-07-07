import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base-Pfad fuer GitHub Pages: https://manoaverner-maker.github.io/aspl-kommentatoren/
export default defineConfig({
  plugins: [react()],
  base: '/aspl-kommentatoren/',
})
