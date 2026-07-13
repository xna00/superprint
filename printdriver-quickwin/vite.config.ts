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
    minify: false,
    modulePreload: false,
    rollupOptions: {
      input: 'dist-tsgo/entry.js',
      output: {
        format: 'es',
        entryFileNames: 'entry.js',
        chunkFileNames: 'chunks/[name]-[hash]--immutable--.js',
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            {
              name: 'lib',
              test: /quickwin[\\/]lib/,
              tags: ['$initial'],
              priority: 20,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              tags: ['$initial'],
              priority: 10,
            },
            {
              name: 'app',
              test(id) { return !id.includes('entry') },
              tags: ['$initial'],
              priority: 1,
            },
          ],
        },
      },
      external: (id) => {
        if (['gui', 'std', 'os', 'ffi', 'win', 'sock', 'wolfssl', 'brotli'].includes(id)) return true
        return false
      },
    },
  },
})

