import { defineConfig } from 'vite'

export default defineConfig({
  base: '',
  define: {
    DEBUG: 'false',
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })),
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash]--immutable--.js',
        chunkFileNames: 'assets/[name]-[hash]--immutable--.js',
        assetFileNames: 'assets/[name]-[hash]--immutable--[extname]',
      },
      external: ['gui', 'std', 'os', 'ffi', 'win', 'sock', 'wolfssl', 'brotli'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    minify: true,
    modulePreload: false,
    rollupOptions: {
      input: 'dist-tsgo/entry.js',
      output: {
        format: 'es',
        entryFileNames: 'entry.js',
        chunkFileNames: 'chunks/[name]-[hash]--immutable--.js',
        manualChunks(id) {
          if (id.includes('quickwin\\lib\\') || id.includes('quickwin/lib/')) {
            return 'lib'
          }
          if (!id.includes('dist-tsgo\\entry') && !id.includes('dist-tsgo/entry')) {
            return 'vendor'
          }
        },
      },
      external: (id) => {
        if (['gui', 'std', 'os', 'ffi', 'win', 'sock', 'wolfssl', 'brotli'].includes(id)) return true
        return false
      },
    },
  },
})
