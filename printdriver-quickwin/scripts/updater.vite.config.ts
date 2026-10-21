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
      input: 'src/update-script.ts',
      output: {
        format: 'es',
        entryFileNames: 'update-entry.js',
        codeSplitting: false,
      },
      external: ['gui', 'std', 'os', 'ffi', 'win', 'sock', 'wolfssl', 'brotli'],
    },
  },
})
