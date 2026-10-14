import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    // @ 代表 src 目录，路径一长也不容易写错
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // 固定 8080 端口，和讲义里的 http://localhost:8080/login 保持一致
    port: 8080,
    // 代理：浏览器直接请求天行会被跨域拦截，用 Vite 代理转发
    // 写 /tianapi/tianqi/index == 请求 https://apis.tianapi.com/tianqi/index
    proxy: {
      '/tianapi': {
        target: 'https://apis.tianapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tianapi/, ''),
      },
    },
  },
})
