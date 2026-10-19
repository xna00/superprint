import 'quickwin/lib/polyfill.js'
import * as std from 'std'
import * as os from 'os'
import { NULL } from 'quickwin/lib/ffi/ctype.js'
import { CreateProcess } from 'quickwin/lib/windows/kernel32.js'
import { PostQuitMessage } from 'quickwin/lib/windows/user32.js'
import { ShellNotifyIcon } from 'quickwin/lib/windows/shell32.js'
import { NOTIFYICONDATAW, PROCESS_INFORMATION } from 'quickwin/lib/windows/structs.js'
import { NotifyIconCmd } from 'quickwin/constants'
import { getExePath } from './utils.js'
import { releaseSingleInstanceMutex, STARTUPINFO_CB_LEGACY } from './win32.js'
import { ENTRY_HASH } from './config.js'
import { api } from './api.js'
import { mainHwnd, cleanupMain, hMutex } from './main.js'
import { logger } from './logger.js'
import hashWorkerUrl from './hash-worker?worker&url'

const CHECK_INTERVAL = 5 * 60 * 1000

interface CheckUpdateResult {
  exeDownloadUrls: string[]
  entryJsChanged: boolean
  updateExeDownloadUrls: string[]
}

let hashWorker: os.Worker | null = null
let _exeHash: string | null = null

function sha1File(filePath: string): Promise<string> {
    return new Promise((resolve) => {
        hashWorker = new os.Worker(hashWorkerUrl)
        hashWorker.onmessage = (e) => {
            hashWorker = null
            resolve((e.data as { hash: string }).hash)
        }
        hashWorker.postMessage({ filePath })
    })
}

async function getExeHash(exePath: string): Promise<string> {
    if (_exeHash) return _exeHash
    _exeHash = await sha1File(exePath)
    return _exeHash
}

/** 拉起新版 exe（不带工作目录、不继承句柄，与历史行为一致） */
function startNewProcess(exePath: string): boolean {
  const procInfo = PROCESS_INFORMATION.alloc()
  return CreateProcess(
    NULL, '"' + exePath + '" --run', NULL, NULL, 0, 0, NULL, NULL,
    { cb: STARTUPINFO_CB_LEGACY }, procInfo.ptr,
  ) !== 0
}

async function tryFetch(urls: string[]) {
  for (const url of urls) {
    try {
      return await fetch(url)
    } catch (e) {
      logger.log(e)
    }
  }
}

export let timer: ReturnType<typeof os.setTimeout> | null = null

export function clearUpdateTimer() {
  if (timer !== null) {
    os.clearTimeout(timer)
    timer = null
  }
}

export async function checkAndUpdate() {
  const exePath = getExePath()
  if (!exePath) {
    logger.log('[update] cannot get exe path')
    return
  }

  const exeHash = await getExeHash(exePath)
  const entryJsHash = ENTRY_HASH
  const exeDir = exePath.substring(0, exePath.lastIndexOf('\\'))
  const updateExeHash = await sha1File(exeDir + '\\QuickSuperPrint_Setup.exe')

  logger.log('[update] checking:', { exeHash, entryJsHash, updateExeHash })

  let res: CheckUpdateResult | undefined
  try {
    res = await api.version.checkDriverUpdate({ exeHash, entryJsHash, updateExeHash })
  } catch (e) {
    logger.log('[update] check failed:', e)
    return
  }
  if (!res) return

  const { exeDownloadUrls, entryJsChanged, updateExeDownloadUrls } = res
  if (!exeDownloadUrls?.length && !entryJsChanged && !updateExeDownloadUrls?.length) {
    logger.log('[update] up to date')
    return
  }

  if (updateExeDownloadUrls?.length) {
    logger.log('[update] downloading installer from:', updateExeDownloadUrls)
    const resp = await tryFetch(updateExeDownloadUrls)
    if (resp) {
      const buf = await resp.arrayBuffer()
      const f = std.open(exeDir + '\\QuickSuperPrint_Setup.exe', 'wb')
      if (f) { f.write(buf, 0, buf.byteLength); f.close() }
    }
  }

  let needRestart = false

  if (exeDownloadUrls.length) {
    logger.log('[update] downloading exe from:', exeDownloadUrls)
    const resp = await tryFetch(exeDownloadUrls)
    if (resp) {
      try { os.remove(exePath + '.old') } catch (_) {}
      os.rename(exePath, exePath + '.old')
      const f = std.open(exePath, 'wb')
      if (f) {
        const buf = await resp.arrayBuffer()
        logger.log('[update] exe buffer size:', buf.byteLength)
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
    logger.log('[update] update applied, restarting...')
    const started = startNewProcess(exePath)
    if (!started) {
      logger.log('[update] CreateProcessW failed, you may restart manually')
    }
    if (mainHwnd) ShellNotifyIcon(NotifyIconCmd.DELETE, { cbSize: NOTIFYICONDATAW.size, hWnd: mainHwnd, uID: 1 })
    if (hMutex) releaseSingleInstanceMutex(hMutex)
    cleanupMain()
    PostQuitMessage(0)
  }
}


export async function startUpdateCheck() {
  try {
    await checkAndUpdate()
  } catch (e) {
    logger.log(e)
  }
  timer = os.setTimeout(startUpdateCheck, CHECK_INTERVAL)
}
