const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ResEdit = require('resedit')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
const qwDir = path.dirname(require.resolve('quickwin/package.json'))

// 塞图标用 resedit（纯 JS），不再依赖 rcedit + wine：Windows / Linux 服务器 / CI 都能跑，
// 产物字节一致，也就不再有"没 wine 就跳过图标、服务器构建的 exe 没图标"这个降级分支。
// 图标组 ID / lang 跟 rcedit 的行为对齐（0 / 1033）；stub 自身没有图标组，这里是新建。
const ICON_GROUP_ID = 0
const ICON_LANG = 1033

function setIconOn(exePath) {
  const icoPath = path.join(root, 'assets', 'icon.ico')
  if (process.env.SKIP_ICON) {
    console.log(`[postbuild] SKIP_ICON=1, skip icon ${path.basename(exePath)}`)
    return
  }
  if (!fs.existsSync(icoPath)) {
    console.log(`[postbuild] icon.ico NOT FOUND, skip ${path.basename(exePath)}`)
    return
  }
  const t0 = Date.now()
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath))
  const res = ResEdit.NtExecutableResource.from(exe)
  const icons = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath)).icons.map((i) => i.data)
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries)
  const targets = groups.length ? groups : [{ id: ICON_GROUP_ID, lang: ICON_LANG }]
  for (const g of targets) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, g.id, g.lang, icons)
  }
  res.outputResource(exe)
  fs.writeFileSync(exePath, Buffer.from(exe.generate()))
  console.log(
    `[postbuild] icon set ${path.basename(exePath)} groups=${targets.map((g) => `${g.id}/${g.lang}`).join(',')} ms=${Date.now() - t0}`,
  )
}

async function main() {
  // 1. Copy main.js for dev (quickwin main.js)
  fs.copyFileSync(path.join(root, 'main.js'), path.join(dist, 'main.js'))

  // 2. Build main exe. setIcon FIRST (bare PE), THEN append JS payload —
  //    原生 rcedit 会重写整个文件、把追加的数据丢掉（resedit 能保留 overlay，但统一"先图标后追加"最省心）。
  const exeSrc = path.join(qwDir, 'qwin.exe')
  const mainJs = fs.readFileSync(path.join(root, 'main.js'))
  if (fs.existsSync(exeSrc)) {
    const out = path.join(dist, 'QuickSuperPrint.exe')
    fs.writeFileSync(out, fs.readFileSync(exeSrc))
    setIconOn(out)
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32LE(mainJs.length)
    const magic = Buffer.from('QWJS', 'ascii')
    fs.appendFileSync(out, Buffer.concat([mainJs, lenBuf, magic]))
  }

  // 3. Compute entry.js SHA-1
  const hash = crypto.createHash('sha1').update(fs.readFileSync(path.join(dist, 'entry.js'))).digest('hex')

  // 4. Replace __ENTRY_HASH__ in all dist .js files
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(p)
      } else if (entry.name.endsWith('.js')) {
        const content = fs.readFileSync(p, 'utf-8')
        if (content.includes('__ENTRY_HASH__')) {
          fs.writeFileSync(p, content.replace(/__ENTRY_HASH__/g, hash))
        }
      }
    }
  }
  walk(dist)

  // 5. Generate metadata.json (buildTime + entryHash + dynamic chunk preload list),
  //    then drop .vite (hidden dir gets stripped by upload-artifact).
  const manifestSrc = path.join(dist, '.vite', 'manifest.json')
  const preload = []
  if (fs.existsSync(manifestSrc)) {
    const manifest = JSON.parse(fs.readFileSync(manifestSrc, 'utf-8'))
    for (const [src, info] of Object.entries(manifest)) {
      if (info.isDynamicEntry && info.file && info.file.endsWith('.js')) {
        preload.push(info.file)
      }
    }
    fs.rmSync(path.join(dist, '.vite'), { recursive: true, force: true })
  }
  const now = new Date()
  const metadata = {
    buildTime: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    buildTimestamp: now.getTime(),
    entryHash: hash,
    preload,
  }
  fs.writeFileSync(path.join(dist, 'metadata.json'), JSON.stringify(metadata, null, 2))
  console.log('postbuild: wrote metadata.json', JSON.stringify(metadata))

  console.log('postbuild: done, entry hash =', hash)

  // 6. Build updater exe: nowasm runtime + brotli-compressed update-entry.js (QWBR).
  //    setIcon FIRST (bare PE), THEN append payload — native rcedit drops appended data.
  const updaterExeSrc = path.join(qwDir, 'qwin-nowasm.exe')
  const updateEntry = path.join(dist, 'update-entry.js')
  if (fs.existsSync(updaterExeSrc) && fs.existsSync(updateEntry)) {
    const zlib = require('zlib')
    const br = zlib.brotliCompressSync(fs.readFileSync(updateEntry))
    const out = path.join(dist, 'QuickSuperPrint_Setup.exe')
    fs.writeFileSync(out, fs.readFileSync(updaterExeSrc))
    setIconOn(out)
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32LE(br.length)
    const magic = Buffer.from('QWBR', 'ascii')
    fs.appendFileSync(out, Buffer.concat([br, lenBuf, magic]))
    console.log('postbuild: built QuickSuperPrint_Setup.exe (QWBR,', br.length, 'bytes)')
  } else {
    console.log('postbuild: WARNING QuickSuperPrint_Setup.exe not built (missing nowasm exe or update-entry.js)')
  }
}

main().catch((err) => {
  console.error('postbuild: FAILED:', err)
  process.exit(1)
})
