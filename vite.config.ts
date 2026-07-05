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
    // 开发模式下模拟加载延迟，便于查看 LoadingScreen 效果
    // 生产环境会自动移除此配置
    middlewareMode: false,
  },
})
