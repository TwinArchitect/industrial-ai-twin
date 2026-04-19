import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
// @ts-ignore
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    glsl(), // 支持 .vert.glsl / .frag.glsl 文件直接 import
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
