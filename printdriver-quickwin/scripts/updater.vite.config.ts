import { defineConfig } from 'vite'

export default defineConfig({
  // 同 vite.config.ts：oxc 转译插件会破坏 rolldown 的跨模块 const enum 折叠
  oxc: false,
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
