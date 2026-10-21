// 构建产物断言：const enum 必须完全内联。
//
// 背景：const enum 会被转译器降级成 const 对象，跨模块引用时表现为
// `EnumName.MEMBER` 属性访问。rolldown 在拿到 TypeScript AST 时能把这些
// 属性访问折回字面量、并把无人引用的 builder tree-shake 掉；但一旦有插件
// 抢在 rolldown 之前把 TS 转成 JS（vite 的 builtin:vite-transform 就是），
// 折叠就静默失效 —— 构建照样绿、运行照样正确，只是体积白白多出来。
//
// 正因为失败模式是"绿 + 对 + 只是大"，光看构建工具是查不出来的。
// 所以这里不查"有没有报错"，直接查产物里还剩多少 const enum 属性访问。
// 任何一处残留都说明有 const enum 没被内联，直接 fail。

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
const qwDir = path.dirname(require.resolve('quickwin/package.json'))

const SRC_EXT = /\.(ts|tsx|d\.ts|js|mjs|cjs)$/

function collectConstEnumNames(dirs) {
  const names = new Set()
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) {
        walk(p)
        continue
      }
      if (!SRC_EXT.test(e.name)) continue
      const src = fs.readFileSync(p, 'utf8')
      for (const m of src.matchAll(/^\s*export\s+const\s+enum\s+([A-Za-z_$][\w$]*)/gm)) {
        names.add(m[1])
      }
    }
  }
  for (const dir of dirs) if (fs.existsSync(dir)) walk(dir)
  return names
}

function collectJsFiles(dir) {
  const out = []
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) {
        walk(p)
        continue
      }
      if (e.name.endsWith('.js')) out.push(p)
    }
  }
  walk(dir)
  return out
}

function main() {
  if (!fs.existsSync(dist)) {
    console.error('[check-const-enum] dist/ 不存在，请先跑 vite build')
    process.exit(1)
  }

  // 我们自己的 src + quickwin（依赖里 127 个 const enum 的大头）
  const names = collectConstEnumNames([path.join(root, 'src'), qwDir])
  if (names.size === 0) {
    console.log('[check-const-enum] 没有 const enum，跳过')
    return
  }

  // 合并成单个正则扫一遍。名字后必须紧跟 '.'，所以不会误命中更长的标识符
  // （`WmMsg.` 匹配不到 `WmMsg2.`），按长度降序只是稳妥起见。
  const alternation = [...names].sort((a, b) => b.length - a.length).join('|')
  const re = new RegExp(`\\b(${alternation})\\.`, 'g')

  const files = collectJsFiles(dist)
  const hits = []
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8')
    for (const m of src.matchAll(re)) {
      hits.push({ file: path.relative(root, f), name: m[1] })
    }
  }

  if (hits.length === 0) {
    console.log(
      `[check-const-enum] OK — ${names.size} 个 const enum，${files.length} 个产物文件，全部内联`,
    )
    return
  }

  const byKey = new Map()
  for (const h of hits) byKey.set(`${h.file}  ${h.name}`, (byKey.get(`${h.file}  ${h.name}`) || 0) + 1)
  const rows = [...byKey.entries()].sort((a, b) => b[1] - a[1])

  console.error(`[check-const-enum] FAIL — const enum 没有完全内联：${hits.length} 处属性访问残留`)
  console.error()
  for (const [k, c] of rows.slice(0, 15)) console.error(`  ${c}x  ${k}`)
  if (rows.length > 15) console.error(`  ... 还有 ${rows.length - 15} 组`)
  console.error()
  console.error('残留说明有插件在 rolldown 之前把 TS 转成了 JS，rolldown 再也看不到 TypeScript')
  console.error('声明，跨模块常量折叠静默失效。已知元凶是 vite 的 builtin:vite-transform（oxc 转译插件）。')
  console.error('修法：vite.config.ts / scripts/updater.vite.config.ts 设 `oxc: false`，')
  console.error('让 rolldown 自己的 transform 处理 TS/TSX。见 commit 1ee9633。')
  process.exit(1)
}

main()
