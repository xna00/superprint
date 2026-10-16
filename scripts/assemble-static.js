#!/usr/bin/env node
'use strict'

/**
 * 把各 workspace 的构建产物汇总到 server/static/（服务器实际托管的目录）。
 *
 *   npm run assemble   # 只做拷贝（假定已 build 过）
 *   npm run deploy     # build + assemble
 *
 * 注意：printdriver/ 那套 C++ 产物（PrintDriver.exe / Setup.exe）在 Linux 上建不出来，
 * 找不到来源时会保留 server/static/ 里已有的文件不动。
 */

const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

const rootDir = path.resolve(__dirname, '..')
const staticDir = path.join(rootDir, 'server', 'static')
const staticPrintdriverDir = path.join(staticDir, 'printdriver')

const log = (...args) => console.log('[assemble]', ...args)
const warn = (...args) => console.warn('[assemble] ⚠', ...args)

const mustExist = (p, what) => {
  if (!fs.existsSync(p)) {
    console.error(`[assemble] ✗ 找不到 ${what}：${path.relative(rootDir, p)}`)
    console.error('[assemble]   先执行 npm run build（或对应 workspace 的 build）')
    process.exit(1)
  }
}

const copyInto = (srcDir, dstDir) => {
  fs.mkdirSync(dstDir, { recursive: true })
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    fs.cpSync(path.join(srcDir, entry.name), path.join(dstDir, entry.name), { recursive: true })
  }
}

const dirSize = (dir) => {
  let total = 0
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name)
      if (entry.isDirectory()) walk(p)
      else total += fs.statSync(p).size
    }
  }
  if (fs.existsSync(dir)) walk(dir)
  return total
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`

fs.mkdirSync(staticDir, { recursive: true })

// ---------- 1. web/dist → server/static/ ----------
const webDist = path.join(rootDir, 'web', 'dist')
mustExist(webDist, 'web/dist')
// assets/ 下都是带 hash 的文件名，不先删会一直堆积历史版本
fs.rmSync(path.join(staticDir, 'assets'), { recursive: true, force: true })
copyInto(webDist, staticDir)
log(`web/dist → server/static/`)

// ---------- 2. printdriver-quickwin/dist → server/static/printdriver/ ----------
const quickwinDist = path.join(rootDir, 'printdriver-quickwin', 'dist')
mustExist(quickwinDist, 'printdriver-quickwin/dist')
for (const exe of ['QuickSuperPrint.exe', 'QuickSuperPrint_Setup.exe']) {
  if (!fs.existsSync(path.join(quickwinDist, exe))) {
    warn(`printdriver-quickwin/dist/${exe} 不存在，客户端会缺这个 exe`)
  }
}
fs.rmSync(staticPrintdriverDir, { recursive: true, force: true })
copyInto(quickwinDist, staticPrintdriverDir)
log(`printdriver-quickwin/dist → server/static/printdriver/`)

// ---------- 3. printdriver（C++，可选）→ server/static/ ----------
const printdriverSources = [
  path.join(rootDir, 'printdriver', 'output'), // 本地 / CI 的 C++ 构建产物
  path.join(rootDir, 'artifacts', 'printdriver'), // 旧的 CI 下载目录
]
const printdriverSrc = printdriverSources.find(
  (d) => fs.existsSync(path.join(d, 'PrintDriver.exe')) && fs.existsSync(path.join(d, 'Setup.exe')),
)

if (!printdriverSrc) {
  warn('没找到 PrintDriver.exe / Setup.exe，保留 server/static/ 里现有的驱动文件不动')
  warn(`  找过：${printdriverSources.map((d) => path.relative(rootDir, d)).join('、')}`)
} else {
  const copyFile = (name, as) => {
    fs.copyFileSync(path.join(printdriverSrc, name), path.join(staticDir, as))
  }
  copyFile('PrintDriver.exe', 'PrintDriver.exe')
  copyFile('Setup.exe', 'Setup.exe')

  const jsonPath = path.join(printdriverSrc, 'printdriver.json')
  if (fs.existsSync(jsonPath)) {
    fs.copyFileSync(jsonPath, path.join(staticDir, 'printdriver.json'))
    const { version } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    if (version) {
      copyFile('PrintDriver.exe', `PrintDriver-${version}.exe`)
      copyFile('Setup.exe', `Setup-${version}.exe`)
    }
    log(`printdriver → server/static/（PrintDriver/Setup.exe + printdriver.json, version ${version}）`)
  } else {
    warn('printdriver.json 不存在，跳过版本号副本（客户端 checkDriverUpdate 会拿不到版本）')
  }
}

// ---------- 4. 重建 .br ----------
// nodeAdapter 只要发现 <file>.br 就直接发它，陈旧的不删就会发旧内容。
// 规则与 api/uploadStatic.ts 保持一致：>1024 字节的文件才压。
const MIN_BR_SIZE = 1024
const brQuality = Number(process.env.BROTLI_QUALITY || 9)
let brCount = 0
let brBytes = 0

const regenerateBr = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      regenerateBr(p)
      continue
    }
    if (entry.name.endsWith('.br')) {
      fs.rmSync(p, { force: true })
      continue
    }
    if (fs.statSync(p).size <= MIN_BR_SIZE) continue
    const br = zlib.brotliCompressSync(fs.readFileSync(p), {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: brQuality },
    })
    fs.writeFileSync(p + '.br', br)
    brCount++
    brBytes += br.length
  }
}

const brStart = Date.now()
regenerateBr(staticDir)
log(`重建 .br 压缩：${brCount} 个（约 ${mb(brBytes)}，quality=${brQuality}，${Date.now() - brStart}ms）`)

// ---------- 汇总 ----------
log('')
log(`server/static/ 现在的内容（共 ${mb(dirSize(staticDir))}）：`)
for (const name of fs.readdirSync(staticDir).sort()) {
  const p = path.join(staticDir, name)
  if (fs.statSync(p).isDirectory()) log(`  [dir]  ${name}/  (${mb(dirSize(p))})`)
  else if (!name.endsWith('.br')) log(`  [file] ${name}  (${mb(fs.statSync(p).size)})`)
}
log('')
log('完成')
