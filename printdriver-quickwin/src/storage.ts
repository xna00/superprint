import * as std from 'std'
import { STORAGE_FILE } from './config.js'
import { getExePath } from './utils.js'

let _cache: Record<string, unknown> | null = null

function storagePath(): string {
  const p = getExePath().split('\\')
  p.pop()
  return p.join('\\') + '\\' + STORAGE_FILE
}

function load(): Record<string, unknown> {
  if (_cache) return _cache
  const f = std.open(storagePath(), 'r')
  if (!f) { _cache = {}; return _cache }
  const content = f.readAsString()
  f.close()
  try { _cache = content ? JSON.parse(content) : {} } catch { _cache = {} }
  return _cache!
}

function save(): void {
  const f = std.open(storagePath(), 'w')
  if (!f) return
  f.puts(JSON.stringify(_cache ?? {}))
  f.close()
}

export function storageGet(key: string): unknown {
  return load()[key] ?? null
}

export function storageSet(key: string, val: unknown): void {
  load()[key] = val
  save()
}

export function getCookie(): string | null {
  const v = storageGet('cookie')
  return typeof v === 'string' ? v : null
}

export function setCookie(val: string): void {
  storageSet('cookie', val)
}

export function getRenderEngine(): 'pdfium' | 'mupdf' {
  const v = storageGet('renderEngine')
  return v === 'mupdf' ? 'mupdf' : 'pdfium'
}

export function setRenderEngine(v: 'pdfium' | 'mupdf'): void {
  storageSet('renderEngine', v)
}
