const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')

// 1. Copy main.js for dev (quickwin main.js)
fs.copyFileSync(path.join(root, 'main.js'), path.join(dist, 'main.js'))

// 2. Copy + rename + embed main.js into exe
const exeSrc = path.join(root, 'node_modules', 'quickwin', 'win-mingw64.exe')
const mainJs = fs.readFileSync(path.join(root, 'main.js'))
if (fs.existsSync(exeSrc)) {
  const exeBuf = fs.readFileSync(exeSrc)
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32LE(mainJs.length)
  const magic = Buffer.from('QWJS', 'ascii')
  fs.writeFileSync(path.join(dist, 'QuickSuperPrint.exe'), Buffer.concat([exeBuf, mainJs, lenBuf, magic]))
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
