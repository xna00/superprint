import 'quickwin/lib/polyfill.js'
import * as std from 'std'
import * as os from 'os'
import * as win from 'win'
import { ffiCall, bufferPtr, FFI_TYPE_UINT32, FFI_TYPE_SINT32, FFI_TYPE_POINTER } from 'ffi'
import { decodeWideAtPtr, strToWideBuf } from './utils.js'
import { ENTRY_HASH } from './config.js'
import { api } from './api.js'

const CHECK_INTERVAL = 5 * 60 * 1000

const _kernel32 = win.LoadLibrary('kernel32.dll')
const pGetModuleFileNameW = _kernel32 ? win.GetProcAddress(_kernel32, 'GetModuleFileNameW') : null
const pCreateProcessW = _kernel32 ? win.GetProcAddress(_kernel32, 'CreateProcessW') : null

function getExePath(): string | null {
  if (!pGetModuleFileNameW) return null
  const size = 1024
  const nameBuf = new ArrayBuffer(size * 2)
  const sizeArr = new Uint32Array(new ArrayBuffer(4))
  sizeArr[0] = size
  const ret = ffiCall(
    pGetModuleFileNameW,
    [FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
    [0, nameBuf, size],
    FFI_TYPE_UINT32
  )
  if (ret === 0) return null
  return decodeWideAtPtr(bufferPtr(nameBuf))
}

async function sha1File(filePath: string): Promise<string> {
  const f = std.open(filePath, 'rb')
  if (!f) return ''
  try {
    const chunks: ArrayBuffer[] = []
    while (true) {
      const buf = f.readAsArrayBuffer(65536)
      if (!buf || buf.byteLength === 0) break
      chunks.push(buf)
    }
    const totalLen = chunks.reduce((s, c) => s + c.byteLength, 0)
    const combined = new Uint8Array(totalLen)
    let offset = 0
    for (const chunk of chunks) {
      combined.set(new Uint8Array(chunk), offset)
      offset += chunk.byteLength
    }
    const hashBuffer = await crypto.subtle.digest('SHA-1', combined.buffer)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  } finally {
    f.close()
  }
}

async function tryDownload(urls: string[], destPath: string): Promise<boolean> {
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.arrayBuffer()
      const f = std.open(destPath, 'wb')
      if (!f) continue
      try {
        f.write(data)
      } finally {
        f.close()
      }
      console.log('[update] downloaded:', destPath)
      return true
    } catch {
      console.log('[update] download failed:', url)
    }
  }
  return false
}

function startNewProcess(exePath: string) {
  if (!pCreateProcessW) return false
  const cmdBuf = strToWideBuf('"' + exePath + '"')
  const startupInfo = new ArrayBuffer(68)
  const dv = new DataView(startupInfo)
  dv.setUint32(0, 68, true)
  const procInfo = new ArrayBuffer(24)
  const ret = ffiCall(
    pCreateProcessW,
    [
      FFI_TYPE_POINTER, FFI_TYPE_POINTER,
      FFI_TYPE_POINTER, FFI_TYPE_POINTER,
      FFI_TYPE_UINT32, FFI_TYPE_UINT32,
      FFI_TYPE_POINTER, FFI_TYPE_POINTER,
      FFI_TYPE_POINTER, FFI_TYPE_POINTER,
    ],
    [null, cmdBuf, null, null, 0, 0, null, null, startupInfo, procInfo],
    FFI_TYPE_SINT32
  )
  return ret !== 0
}

export async function checkAndUpdate() {
  const exePath = getExePath()
  if (!exePath) {
    console.log('[update] cannot get exe path')
    return
  }

  const dir = exePath.replace(/\\[^\\]+$/, '')
  const mainJsPath = dir + '\\main.js'
  const exeOldPath = exePath.replace(/\.exe$/i, '.old')

  const exeHash = await sha1File(exePath)
  const mainJsHash = await sha1File(mainJsPath)
  const entryJsHash = ENTRY_HASH

  console.log('[update] checking:', { exeHash, mainJsHash, entryJsHash })

  let res: any
  try {
    res = await api.version.checkDriverUpdate({ exeHash, mainJsHash, entryJsHash })
  } catch (e) {
    console.log('[update] check failed:', e)
    return
  }
  if (!res) return

  const { exeDownloadUrls, mainJsDownloadUrls, entryJsChanged } = res
  if (!exeDownloadUrls?.length && !mainJsDownloadUrls?.length && !entryJsChanged) {
    console.log('[update] up to date')
    return
  }

  let needRestart = false

  if (exeDownloadUrls?.length) {
    try { os.remove(exeOldPath) } catch {}
    try { os.rename(exePath, exeOldPath) } catch {}
    const ok = await tryDownload(exeDownloadUrls, exePath)
    if (ok) needRestart = true
  }

  if (mainJsDownloadUrls?.length) {
    const ok = await tryDownload(mainJsDownloadUrls, mainJsPath)
    if (ok) needRestart = true
  }

  if (entryJsChanged) needRestart = true

  if (needRestart) {
    console.log('[update] update applied, restarting...')
    const started = startNewProcess(exePath)
    if (!started) {
      console.log('[update] CreateProcessW failed, you may restart manually')
    }
    std.exit(0)
  }
}

export function startUpdateCheck() {
  function poll() {
    checkAndUpdate()
    os.setTimeout(poll, CHECK_INTERVAL)
  }
  checkAndUpdate()
  os.setTimeout(poll, CHECK_INTERVAL)
}
