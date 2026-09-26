import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'

export default defineConfig(({ mode }) => {
  const isElectron = mode !== 'mobile';

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      isElectron && electron({
        entry: 'electron/main.js',
      }),
    ].filter(Boolean),
  }
})
