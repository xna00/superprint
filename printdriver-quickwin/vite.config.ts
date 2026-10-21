import { defineConfig } from 'vite'

export default defineConfig({
  base: '',
  // 关掉 vite 的 oxc 转译插件 (builtin:vite-transform)。它抢在 rolldown 自己的 TS
  // transform 之前把 `const enum` 转成 const 对象，rolldown 就再也看不到 TypeScript
  // 声明，跨模块常量折叠失效 —— 导致 const enum 成员在跨 chunk 时保持属性访问
  // (如 Sentinel.INVALID_FILE_ATTRIBUTES)，vendor 多出 25 个未 tree-shake 的 builder。
  // 关掉后由 rolldown 自己处理 TS/TSX，const enum 完全内联，JS 总体积 -27 kB。
  oxc: false,
  define: {
    DEBUG: 'false',
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
    manifest: true,
    modulePreload: false,
    rollupOptions: {
      input: 'src/entry.ts',
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

