import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@auth': path.resolve(__dirname, '../auth'),
      '@interviews': path.resolve(__dirname, '../interviews'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'axios': path.resolve(__dirname, 'node_modules/axios'),
    },
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
