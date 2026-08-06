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
    await rcedit(exePath, { icon: icoPath })
    console.log('postbuild: icon set on', path.basename(exePath))
  }
}

async function main() {
  // 1. Copy main.js for dev (quickwin main.js)
  fs.copyFileSync(path.join(root, 'main.js'), path.join(dist, 'main.js'))

  // 2. Copy + rename + embed main.js into exe (with icon)
  const exeSrc = path.join(qwDir, 'win-mingw64.exe')
  const mainJs = fs.readFileSync(path.join(root, 'main.js'))
  if (fs.existsSync(exeSrc)) {
    const exeBuf = fs.readFileSync(exeSrc)
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32LE(mainJs.length)
    const magic = Buffer.from('QWJS', 'ascii')
    const out = path.join(dist, 'QuickSuperPrint.exe')
    fs.writeFileSync(out, Buffer.concat([exeBuf, mainJs, lenBuf, magic]))
    await setIconOn(out)
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

  // 5. Move .vite/manifest.json to vite_manifest.json (avoid hidden dir being stripped by upload-artifact)
  const manifestSrc = path.join(dist, '.vite', 'manifest.json')
  const manifestDst = path.join(dist, 'vite_manifest.json')
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDst)
    fs.rmSync(path.join(dist, '.vite'), { recursive: true, force: true })
    console.log('postbuild: moved .vite/manifest.json -> vite_manifest.json')
  }

  console.log('postbuild: done, entry hash =', hash)

  // 6. Build updater exe: nowasm runtime + brotli-compressed update-entry.js (QWBR) + icon
  const updaterExeSrc = path.join(qwDir, 'win-nowasm-mingw64.exe')
  const updateEntry = path.join(dist, 'update-entry.js')
  if (fs.existsSync(updaterExeSrc) && fs.existsSync(updateEntry)) {
    const zlib = require('zlib')
    const br = zlib.brotliCompressSync(fs.readFileSync(updateEntry))
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32LE(br.length)
    const magic = Buffer.from('QWBR', 'ascii')
    const out = path.join(dist, 'QuickSuperPrint_Setup.exe')
    fs.writeFileSync(out, Buffer.concat([fs.readFileSync(updaterExeSrc), br, lenBuf, magic]))
    console.log('postbuild: built QuickSuperPrint_Setup.exe (QWBR,', br.length, 'bytes)')
    await setIconOn(out)
  } else {
    console.log('postbuild: WARNING QuickSuperPrint_Setup.exe not built (missing nowasm exe or update-entry.js)')
  }
}

main().catch((err) => {
  console.error('postbuild: FAILED:', err)
  process.exit(1)
})
