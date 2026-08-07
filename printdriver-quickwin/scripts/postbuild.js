const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { rcedit } = require('rcedit')

process.env.WINE_BINARY = 'wine'

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
const qwDir = path.dirname(require.resolve('quickwin/package.json'))

async function setIconOn(exePath) {
  const icoPath = path.join(root, 'assets', 'icon.ico')
  if (fs.existsSync(icoPath)) {
    const t0 = Date.now()
    console.log(`[postbuild] rcedit START ${path.basename(exePath)} t=${t0}`)
    await rcedit(exePath, { icon: icoPath })
    console.log(`[postbuild] rcedit END   ${path.basename(exePath)} ms=${Date.now() - t0}`)
  } else {
    console.log(`[postbuild] icon.ico NOT FOUND, skip ${path.basename(exePath)}`)
  }
}

async function main() {
  // 1. Copy main.js for dev (quickwin main.js)
  fs.copyFileSync(path.join(root, 'main.js'), path.join(dist, 'main.js'))

  // 2. Build main exe. rcedit FIRST (bare PE), THEN append JS payload —
  //    native Windows rcedit rewrites the whole file and drops appended data.
  const exeSrc = path.join(qwDir, 'win-mingw64.exe')
  const mainJs = fs.readFileSync(path.join(root, 'main.js'))
  if (fs.existsSync(exeSrc)) {
    const out = path.join(dist, 'QuickSuperPrint.exe')
    fs.writeFileSync(out, fs.readFileSync(exeSrc))
    await setIconOn(out)
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
  //    rcedit FIRST (bare PE), THEN append payload — native rcedit drops appended data.
  const updaterExeSrc = path.join(qwDir, 'win-nowasm-mingw64.exe')
  const updateEntry = path.join(dist, 'update-entry.js')
  if (fs.existsSync(updaterExeSrc) && fs.existsSync(updateEntry)) {
    const zlib = require('zlib')
    const br = zlib.brotliCompressSync(fs.readFileSync(updateEntry))
    const out = path.join(dist, 'QuickSuperPrint_Setup.exe')
    fs.writeFileSync(out, fs.readFileSync(updaterExeSrc))
    await setIconOn(out)
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
