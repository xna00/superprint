import { defineConfig } from 'vite'

export default defineConfig({
  define: { DEBUG: 'false' },
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
        chunkFileNames: 'chunks/[name]-[hash].js',
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
