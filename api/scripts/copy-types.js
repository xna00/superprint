import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiDir = path.resolve(__dirname, '..')
const serverDist = path.resolve(apiDir, '..', 'server', 'dist')
const outDir = path.resolve(apiDir, '__types__')

const REPLACEMENTS = [
  [/import\("undici-types"\)\.(\w+)/g, '$1'],
  [/import type \{ OutgoingHttpHeaders \} from "node:http";?\n?/g, ''],
  [/import type \{ IncomingMessage, ServerResponse \} from "node:http";?\n?/g, ''],
  [/import type \{ Server \} from "node:http";?\n?/g, ''],
  [/import \{ type StatementResultingChanges \} from 'node:sqlite';?\n?/g, ''],
  [/\bStatementResultingChanges\b/g, 'any'],
  [/ResponseInit\["headers"\]/g, 'any'],
  [/\bOutgoingHttpHeaders\b/g, 'any'],
]

function copyAndFix(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true })
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name)
    const dstPath = path.join(dstDir, entry.name)
    if (entry.isDirectory()) {
      copyAndFix(srcPath, dstPath)
    } else if (entry.name.endsWith('.d.ts')) {
      let content = fs.readFileSync(srcPath, 'utf-8')
      for (const [pattern, replacement] of REPLACEMENTS) {
        content = content.replace(pattern, replacement)
      }
      fs.writeFileSync(dstPath, content, 'utf-8')
      console.log('  fixed:', path.relative(apiDir, dstPath))
    }
  }
}

console.log('copying types from', serverDist)
console.log('output to', outDir)
copyAndFix(serverDist, outDir)
console.log('done')
