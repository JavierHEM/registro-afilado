import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@headlessui/react', '@heroicons/react'],
    include: ['firebase/auth'],
  }
})