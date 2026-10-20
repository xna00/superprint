import 'quickwin/lib/fetch.js'
import * as std from 'std'
import * as os from 'os'
import { NULL } from 'quickwin/lib/ffi/ctype.js'
import { CreateProcess, MoveFileEx } from 'quickwin/lib/windows/kernel32.js'
import { PROCESS_INFORMATION } from 'quickwin/lib/windows/structs.js'
import { MoveFileFlag } from 'quickwin/constants'
import { alertBox, STARTUPINFO_CB_LEGACY } from './win32.js'
import { ensureInstalled, missingInstallFiles } from './install.js'

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

function startProcess(exePath: string, args?: string): boolean {
  const procInfo = PROCESS_INFORMATION.alloc()
  const cmdLine = '"' + exePath + '"' + (args ? ' ' + args : '')
  return CreateProcess(
    NULL, cmdLine, NULL, NULL, 0, 0, NULL, NULL,
    { cb: STARTUPINFO_CB_LEGACY }, procInfo.ptr,
  ) !== 0
}

function moveFileExW(oldPath: string, newPath: string): boolean {
  return MoveFileEx(oldPath, newPath, MoveFileFlag.REPLACE_EXISTING | MoveFileFlag.COPY_ALLOWED) !== 0
}

async function main() {
  const localAppData = std.getenv('LOCALAPPDATA') || '.'
  const tmpDir = std.getenv('TEMP') || '.'
  cleanupOldTemp(tmpDir)

  const t = timestamp()
  const tmp = tempExePath(tmpDir, t)
  const urls = [
    'https://superprint.112287.xyz/printdriver/QuickSuperPrint.exe?t=' + t,
    'https://superprint.xna00.top/printdriver/QuickSuperPrint.exe?t=' + t,
  ]

  if (scriptArgs.includes('--selftest')) {
    std.out.printf('selftest: started\n')
    std.out.flush()
    const downloaded = await downloadTo(urls, tmp)
    const [st, err] = os.stat(tmp)
    const ok = downloaded && err === 0 && !!st && st.size > 0
    std.out.printf('selftest: downloaded=%s exists=%s size=%d\n',
      downloaded ? 'true' : 'false', ok ? 'true' : 'false', st ? st.size : -1)
    std.out.flush()
    if (ok) { try { os.remove(tmp) } catch (_) {} }
    std.exit(ok ? 0 : 1)
  }

  if (scriptArgs.includes('--install-only')) {
    // CI 用：跑完整安装（下载+落盘+快捷方式+开机自启）但不启动程序、不弹窗，退出码反映结果。
    // 下载失败不算失败——快捷方式不依赖网络（CDN 可达性由 --selftest 负责），否则一次跨境抖动
    // 就把 CI 判红，而它挡住的正是安装逻辑本身的回归。
    std.out.printf('install-only: start\n')
    std.out.flush()
    const installDir = localAppData + '\\SuperPrint'
    const target = installDir + '\\QuickSuperPrint.exe'
    try { os.mkdir(installDir) } catch (_) {}
    const downloaded = await downloadTo(urls, tmp)
    const moved = downloaded && moveFileExW(tmp, target)
    try { os.remove(tmp) } catch (_) {}
    std.out.printf('install-only: downloaded=%s moved=%s\n',
      downloaded ? 'true' : 'false', moved ? 'true' : 'false')

    await ensureInstalled()
    const missing = missingInstallFiles()
    std.out.printf('install-only: missing=%d %s\n', missing.length, missing.join('|'))
    std.out.flush()
    std.exit(missing.length === 0 ? 0 : 1)
  }

  std.out.printf('Downloading update...\n')
  std.out.flush()

  if (!(await downloadTo(urls, tmp))) {
    alertBox('所有下载地址均失败')
    std.exit(1)
  }

  std.out.printf('Download complete, killing old instance...\n')
  std.out.flush()
  try { const p = std.popen('taskkill /im QuickSuperPrint.exe /f', 'r'); if (p) p.close() } catch (e) { std.err.printf('kill old instance failed: %s\n', String(e)) }

  const installDir = localAppData + '\\SuperPrint'
  const target = installDir + '\\QuickSuperPrint.exe'
  try { os.mkdir(installDir) } catch (_) {}

  os.sleep(500) // 等旧进程完全退出，避免 MoveFileExW 被占用映像拦截
  let moved = false
  for (let i = 0; i < 3 && !moved; i++) {
    moved = moveFileExW(tmp, target)
    if (!moved) os.sleep(1000)
  }
  if (!moved) {
    alertBox('替换程序文件失败')
    std.exit(1)
  }
  try { os.remove(tmp) } catch (_) {}

  std.out.printf('Starting...\n')
  std.out.flush()
  // 启动器也补一次：快捷方式/开机自启在拉起 app 之前就位；app 侧那次是幂等的兜底
  // （用户可能绕过 Setup 直接跑 QuickSuperPrint.exe）。不能让它挡住启动——exe 已经落盘，
  // 装完就算出岔子也得把程序拉起来。
  try { await ensureInstalled() } catch (e) { std.err.printf('ensureInstalled failed: %s\n', String(e)) }
  // 若由主程序的兜底逻辑带 --noretry 启动，则透传给新实例，避免其再次触发兜底造成死循环
  const passArgs = scriptArgs.includes('--noretry') ? '--run --noretry' : '--run'
  if (!startProcess(target, passArgs)) {
    alertBox('启动更新程序失败')
    std.exit(1)
  }
  std.exit(0)
}

main()
