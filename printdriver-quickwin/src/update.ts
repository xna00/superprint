import 'quickwin/lib/polyfill.js'
import * as std from 'std'
import * as os from 'os'
import * as win from 'win'
import { ffiCall, bufferPtr, FFI_TYPE_UINT32, FFI_TYPE_SINT32, FFI_TYPE_POINTER } from 'ffi'
import { decodeWideAtPtr, strToWideBuf } from './utils.js'
import { ENTRY_HASH } from './config.js'
import { api } from './api.js'
import { cleanupWs } from './ws.js'
import { printWorker } from './main.js'

const CHECK_INTERVAL = 5 * 60 * 1000

interface CheckUpdateResult {
  exeDownloadUrls: string[]
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
    f.seek(0, 2); const size = f.tell(); f.seek(0, 0)
    const buf = new ArrayBuffer(size); f.read(buf, 0, size);
    const hashBuffer = await crypto.subtle.digest('SHA-1', buf)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  } finally {
    f.close()
  }
}


function startNewProcess(exePath: string) {
  if (!pCreateProcessW) return false
  const cmdBuf = strToWideBuf('"' + exePath + '" --run')
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

export let timer: number | null = null

export async function checkAndUpdate() {
  const exePath = getExePath()
  if (!exePath) {
    console.log('[update] cannot get exe path')
    return
  }

  const exeHash = await sha1File(exePath)
  const entryJsHash = ENTRY_HASH

  console.log('[update] checking:', { exeHash, entryJsHash })

  let res: CheckUpdateResult | undefined
  try {
    res = await api.version.checkDriverUpdate({ exeHash, entryJsHash })
  } catch (e) {
    console.log('[update] check failed:', e)
    return
  }
  if (!res) return

  const { exeDownloadUrls, entryJsChanged } = res
  if (!exeDownloadUrls?.length && !entryJsChanged) {
    console.log('[update] up to date')
    return
  }

  let needRestart = false

  if (exeDownloadUrls.length) {
    console.log('[update] downloading exe from:', exeDownloadUrls)
    const resp = await tryFetch(exeDownloadUrls)
    if (resp) {
      os.rename(exePath, exePath + '.old')
      const f = std.open(exePath, 'wb')
      if (f) {
        const buf = await resp.arrayBuffer()
        console.log('[update] exe buffer size:', buf.byteLength)
        f.write(buf, 0, buf.byteLength)
        f.close()
      } else {
        os.rename(exePath + '.old', exePath)
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
    {

      cleanupWs()
      if (printWorker) {
        printWorker.onmessage = null
        printWorker.postMessage({ type: 'done' })
      }
      if (timer !== null) {
        os.clearTimeout(timer)
      }
    }
    std.exit(0)
  }
}


export async function startUpdateCheck() {
  try {
    await checkAndUpdate()
  } catch (e) {
    console.log(e)
  }
  timer = os.setTimeout(startUpdateCheck, CHECK_INTERVAL)
}
