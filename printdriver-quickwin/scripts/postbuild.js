const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')

// 1. Copy main.js
fs.copyFileSync(path.join(root, 'main.js'), path.join(dist, 'main.js'))

// 2. Copy + rename exe
const exeSrc = path.join(root, 'node_modules', 'quickwin', 'win-mingw64.exe')
if (fs.existsSync(exeSrc)) {
  fs.copyFileSync(exeSrc, path.join(dist, 'QuickSuperPrint.exe'))
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

console.log('postbuild: done, entry hash =', hash)
