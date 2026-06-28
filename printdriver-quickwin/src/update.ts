import 'quickwin/lib/polyfill.js'
import * as std from 'std'
import * as os from 'os'
import * as win from 'win'
import { ffiCall, bufferPtr, FFI_TYPE_UINT32, FFI_TYPE_SINT32, FFI_TYPE_POINTER } from 'ffi'
import { decodeWideAtPtr, strToWideBuf } from './utils.js'
import { ENTRY_HASH } from './config.js'
import { api } from './api.js'

const CHECK_INTERVAL = 5 * 60 * 1000

interface CheckUpdateResult {
  exeDownloadUrls: string[]
  mainJsDownloadUrls: string[]
  entryJsChanged: boolean
}

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
    const buf = new ArrayBuffer(65536)
    while (true) {
      const n = f.read(buf)
      if (n <= 0) break
      chunks.push(buf.slice(0, n))
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

async function tryFetch(urls: string[]) {
  for (const url of urls) {
    try {
      return await fetch(url)
    } catch (e) {
      console.log(e)
    }
  }
}

export async function checkAndUpdate() {
  const exePath = getExePath()
  if (!exePath) {
    console.log('[update] cannot get exe path')
    return
  }

  const dir = exePath.replace(/\\[^\\]+$/, '')
  const mainJsPath = dir + '\\main.js'

  const exeHash = await sha1File(exePath)
  const mainJsHash = await sha1File(mainJsPath)
  const entryJsHash = ENTRY_HASH

  console.log('[update] checking:', { exeHash, mainJsHash, entryJsHash })

  let res: CheckUpdateResult | undefined
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

  if (exeDownloadUrls.length) {
    const res = await tryFetch(exeDownloadUrls)
    if (res) {
      os.rename(exePath, exePath + '.old')
      const f = std.open(exePath, 'wb')
      if (f) {
        const buf = await res.arrayBuffer()
        f.write(buf)
      } else {
        os.rename(exePath + '.old', exePath)
      }
    }
    needRestart = true
  }

  if (mainJsDownloadUrls.length) {
    const res = await tryFetch(mainJsDownloadUrls)
    if (res) {
      os.rename(mainJsPath, mainJsPath + '.old')
      const f = std.open(mainJsPath, 'wb')
      if (f) {
        const buf = await res.arrayBuffer()
        f.write(buf)
      } else {
        os.rename(mainJsPath + '.old', mainJsPath)
      }
    }
    needRestart = true
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

export let timer: number | null = null

export async function startUpdateCheck() {
  try {
    await checkAndUpdate()
  } catch (e) {
    console.log(e)
  }
  timer = os.setTimeout(startUpdateCheck, CHECK_INTERVAL)
}
