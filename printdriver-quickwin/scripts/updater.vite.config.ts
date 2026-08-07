import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    DEBUG: 'false',
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: 'dist-tsgo/update-script.js',
      output: {
        format: 'es',
        entryFileNames: 'update-entry.js',
        codeSplitting: false,
      },
      external: ['gui', 'std', 'os', 'ffi', 'win', 'sock', 'wolfssl', 'brotli'],
    },
  },
})
