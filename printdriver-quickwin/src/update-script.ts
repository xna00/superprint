import 'quickwin/lib/fetch.js'
import * as std from 'std'
import * as os from 'os'
import * as win from 'win'
import * as gui from 'gui'
import { ffiCall, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_SINT32 } from 'ffi'
import { strToWideBuf } from './utils.js'
import { ensureDefenderExclusions } from './security.js'
import { logInstall } from './install-log.js'

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

function timestamp(): string {
  const d = new Date()
  return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
         pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
}

function tempExePath(tmpDir: string, t: string): string {
  return tmpDir + '\\QuickSuperPrint_' + t + '.exe'
}

function cleanupOldTemp(tmpDir: string) {
  const r = os.readdir(tmpDir)
  const names = r ? r[0] : null
  if (names) {
    for (const n of names) {
      if (/^QuickSuperPrint_\d{14}\.exe$/.test(n)) {
        try { os.remove(tmpDir + '\\' + n) } catch (_) {}
      }
    }
  }
}

async function downloadTo(urls: string[], tmp: string): Promise<boolean> {
  for (const url of urls) {
    try {
      const resp = await fetch(url)
      if (resp.ok) {
        const buf = await resp.arrayBuffer()
        const f = std.open(tmp, 'wb')
        if (f) {
          f.write(buf, 0, buf.byteLength)
          f.close()
          return true
        }
      }
    } catch (e) {
      std.err.printf('Download failed: %s\n', String(e))
    }
  }
  return false
}

const _k32 = win.LoadLibrary('kernel32.dll')
const _pCreateProcessW = _k32 ? win.GetProcAddress(_k32, 'CreateProcessW') : null
const _pGetLastError = _k32 ? win.GetProcAddress(_k32, 'GetLastError') : null

function lastError(): number {
  if (!_pGetLastError) return -1
  return ffiCall(_pGetLastError, [], [], FFI_TYPE_SINT32)
}

function startProcess(exePath: string): boolean {
  const p = _pCreateProcessW
  if (!p) {
    logInstall('startProcess: CreateProcessW not available')
    return false
  }
  const cmd = strToWideBuf('"' + exePath + '"')
  const si = new ArrayBuffer(68)
  new DataView(si).setUint32(0, 68, true)
  const pi = new ArrayBuffer(24)
  const ret = ffiCall(p,
    [FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER,
     FFI_TYPE_UINT32, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_POINTER,
     FFI_TYPE_POINTER, FFI_TYPE_POINTER],
    [null, cmd, null, null, 0, 0, null, null, si, pi],
    FFI_TYPE_SINT32)
  if (ret === 0) {
    const gle = lastError()
    logInstall('startProcess FAILED GetLastError=' + gle + ' path=' + exePath)
  } else {
    logInstall('startProcess OK path=' + exePath)
  }
  return ret !== 0
}

async function main() {
  const localAppData = std.getenv('LOCALAPPDATA') || '.'
  const updateDir = localAppData + '\\SuperPrint'
  logInstall('=== Setup run start ===')
  logInstall('LOCALAPPDATA=' + localAppData)
  logInstall('updateDir=' + updateDir)
  os.mkdir(updateDir)
  cleanupOldTemp(updateDir)

  const t = timestamp()
  const tmp = tempExePath(updateDir, t)
  const urls = [
    'https://superprint6.xna00.top/printdriver/QuickSuperPrint.exe?t=' + t,
    'https://superprint.xna00.top/printdriver/QuickSuperPrint.exe?t=' + t,
  ]
  logInstall('tmp=' + tmp)
  logInstall('urls=' + urls.join(' | '))

  if (scriptArgs.includes('--selftest')) {
    logInstall('selftest mode: ' + scriptArgs.join(' '))
    std.out.printf('selftest: started\n')
    std.out.flush()
    const downloaded = await downloadTo(urls, tmp)
    const [st, err] = os.stat(tmp)
    const ok = downloaded && err === 0 && !!st && st.size > 0
    std.out.printf('selftest: downloaded=%s exists=%s size=%d\n',
      downloaded ? 'true' : 'false', ok ? 'true' : 'false', st ? st.size : -1)
    std.out.flush()
    if (ok) { try { os.remove(tmp) } catch (_) {} }
    logInstall('selftest done downloaded=' + downloaded + ' err=' + err + ' size=' + (st ? st.size : -1) + ' ok=' + ok)
    std.exit(ok ? 0 : 1)
  }

  const exOk = ensureDefenderExclusions()
  logInstall('ensureDefenderExclusions -> ' + exOk)

  std.out.printf('Downloading update...\n')
  std.out.flush()

  if (!(await downloadTo(urls, tmp))) {
    logInstall('download FAILED all urls')
    gui.MessageBox('所有下载地址均失败')
    std.exit(1)
  }
  const [st, err] = os.stat(tmp)
  logInstall('download ok, tmp stat err=' + err + ' size=' + (st ? st.size : -1))

  std.out.printf('Download complete, killing old instance...\n')
  std.out.flush()
  try { const p = std.popen('taskkill /im QuickSuperPrint.exe /f', 'r'); if (p) p.close() } catch (e) { std.err.printf('kill old instance failed: %s\n', String(e)) }
  logInstall('taskkill done')

  const [st2, err2] = os.stat(tmp)
  logInstall('before startProcess, tmp stat err=' + err2 + ' size=' + (st2 ? st2.size : -1))

  std.out.printf('Starting...\n')
  std.out.flush()
  if (!startProcess(tmp)) {
    gui.MessageBox('启动更新程序失败')
    std.exit(1)
  }
  std.exit(0)
}

main()
