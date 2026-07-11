import * as std from 'std'
import { STORAGE_FILE } from './config.js'

let _cache: Record<string, unknown> | null = null

function load(): Record<string, unknown> {
  if (_cache) return _cache
  const f = std.open(STORAGE_FILE, 'r')
  if (!f) { _cache = {}; return _cache }
  const content = f.readAsString()
  f.close()
  try { _cache = content ? JSON.parse(content) : {} } catch { _cache = {} }
  return _cache!
}

function save(): void {
  const f = std.open(STORAGE_FILE, 'w')
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
