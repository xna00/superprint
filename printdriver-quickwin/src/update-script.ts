import 'quickwin/lib/fetch.js'
import * as std from 'std'
import * as os from 'os'
import * as win from 'win'
import * as gui from 'gui'
import { ffiCall, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_SINT32 } from 'ffi'
import { strToWideBuf } from './utils.js'

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
      if (n.startsWith('QuickSuperPrint_') && n.endsWith('.exe')) {
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

function startProcess(exePath: string): boolean {
  const k32 = win.LoadLibrary('kernel32.dll')
  const p = k32 ? win.GetProcAddress(k32, 'CreateProcessW') : null
  if (!p) return false
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
  return ret !== 0
}

async function main() {
  const tmpDir = std.getenv('TEMP') || '.'
  cleanupOldTemp(tmpDir)

  const t = timestamp()
  const tmp = tempExePath(tmpDir, t)
  const urls = [
    'https://superprint6.xna00.top/printdriver/QuickSuperPrint.exe?t=' + t,
    'https://superprint.xna00.top/printdriver/QuickSuperPrint.exe?t=' + t,
  ]

  if (scriptArgs.includes('--selftest')) {
    const downloaded = await downloadTo(urls, tmp)
    const [st, err] = os.stat(tmp)
    const ok = downloaded && err === 0 && !!st && st.size > 0
    std.out.printf('selftest: downloaded=%s exists=%s size=%d\n',
      downloaded ? 'true' : 'false', ok ? 'true' : 'false', st ? st.size : -1)
    std.out.flush()
    if (ok) { try { os.remove(tmp) } catch (_) {} }
    std.exit(ok ? 0 : 1)
  }

  std.out.printf('Downloading update...\n')
  std.out.flush()

  if (!(await downloadTo(urls, tmp))) {
    gui.MessageBox('所有下载地址均失败')
    std.exit(1)
  }

  std.out.printf('Download complete, starting...\n')
  std.out.flush()
  if (!startProcess(tmp)) {
    gui.MessageBox('启动更新程序失败')
    std.exit(1)
  }
  std.exit(0)
}

main()
