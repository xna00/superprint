import * as std from 'std'
import * as win from 'win'
import * as os from 'os'
import { ffiCall, readByte, FFI_TYPE_UINT32, FFI_TYPE_SINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT64 } from 'ffi'
import * as gui from 'gui'
import { strToWideBuf, readPtr, getExePath, guidStrToBytes } from './utils.js'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const _k32 = win.LoadLibrary('kernel32.dll')
function k32proc(name: string): number | null {
  return _k32 ? win.GetProcAddress(_k32, name) : null
}
function gle(): number {
  const p = k32proc('GetLastError')
  return p ? ffiCall(p, [], [], FFI_TYPE_SINT32) as number : 0
}

function readQword(addr: number): number {
  const b0 = readByte(addr)
  const b1 = readByte(addr + 1)
  const b2 = readByte(addr + 2)
  const b3 = readByte(addr + 3)
  const b4 = readByte(addr + 4)
  const b5 = readByte(addr + 5)
  const b6 = readByte(addr + 6)
  const b7 = readByte(addr + 7)
  const low = b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
  const high = b4 | (b5 << 8) | (b6 << 16) | (b7 << 24)
  return (high >>> 0) * 4294967296 + (low >>> 0)
}

function copyFile(src: string, dst: string): boolean {
  const f = std.open(src, 'rb')
  if (!f) return false
  f.seek(0, 2)
  const size = f.tell()
  f.seek(0, 0)
  const buf = new ArrayBuffer(size)
  const n = f.read(buf, 0, size)
  f.close()
  if (n !== size) return false
  const g = std.open(dst, 'wb')
  if (!g) return false
  g.write(buf, 0, size)
  g.close()
  return true
}

function mkdirW(path: string): boolean {
  const p = k32proc('CreateDirectoryW')
  if (!p) return false
  const ok = ffiCall(p,
    [FFI_TYPE_POINTER, FFI_TYPE_POINTER],
    [strToWideBuf(path), null],
    FFI_TYPE_SINT32) as number
  if (ok) return true
  return gle() === gui.ErrorCode.ALREADY_EXISTS
}

function deleteFileW(path: string): boolean {
  const p = k32proc('DeleteFileW')
  if (!p) return false
  const ok = ffiCall(p, [FFI_TYPE_POINTER], [strToWideBuf(path)], FFI_TYPE_SINT32) as number
  if (ok) return true
  return gle() === gui.ErrorCode.FILE_NOT_FOUND
}

function removeDirW(path: string): boolean {
  const p = k32proc('RemoveDirectoryW')
  if (!p) return false
  const ok = ffiCall(p, [FFI_TYPE_POINTER], [strToWideBuf(path)], FFI_TYPE_SINT32) as number
  if (ok) return true
  return gle() === gui.ErrorCode.FILE_NOT_FOUND
}

function moveFileW(oldPath: string, newPath: string): boolean {
  const p = k32proc('MoveFileExW')
  if (!p) return false
  const hr = ffiCall(p,
    [FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
    [strToWideBuf(oldPath), strToWideBuf(newPath), 1], // MOVEFILE_REPLACE_EXISTING = 1
    FFI_TYPE_SINT32) as number
  return hr !== 0
}

function spawnDetached(cmdLine: string, cwd: string): void {
  const p = k32proc('CreateProcessW')
  if (!p) throw new Error('加载 kernel32.dll 失败')
  const si = new ArrayBuffer(256)
  const siDv = new DataView(si)
  siDv.setUint32(0, 104, true)
  const pi = new ArrayBuffer(24)
  const ok = ffiCall(p,
    [FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER,
     FFI_TYPE_POINTER, FFI_TYPE_SINT32, FFI_TYPE_UINT32,
     FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER,
     FFI_TYPE_POINTER],
    [null, strToWideBuf(cmdLine), null, null, 0, gui.ProcessCreationFlag.NO_WINDOW,
     null, strToWideBuf(cwd), si, pi],
    FFI_TYPE_SINT32) as number
  if (!ok) throw new Error('CreateProcessW 失败')
}

// ---------------------------------------------------------------------------
// registry  (advapi32.dll)
// ---------------------------------------------------------------------------

function regSetRun(cmdLine: string): boolean {
  const a32 = win.LoadLibrary('advapi32.dll')
  if (!a32) return false
  const pCreate = win.GetProcAddress(a32, 'RegCreateKeyExW')
  const pSet = win.GetProcAddress(a32, 'RegSetValueExW')
  const pClose = win.GetProcAddress(a32, 'RegCloseKey')
  if (!pCreate || !pSet || !pClose) return false

  const keyW = strToWideBuf('Software\\Microsoft\\Windows\\CurrentVersion\\Run')
  const hKeyBuf = new ArrayBuffer(8)

  const hr = ffiCall(pCreate,
    [FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
    [gui.HKey.CURRENT_USER, keyW, 0, null, 0, gui.RegAccess.SET_VALUE, null, hKeyBuf, null],
    FFI_TYPE_SINT32) as number
  if (hr !== 0) return false

  const hKey = readPtr(new DataView(hKeyBuf), 0)
  const nameW = strToWideBuf('SuperPrint')
  const dataW = strToWideBuf(cmdLine)
  const hr2 = ffiCall(pSet,
    [FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
    [hKey, nameW, 0, gui.RegType.SZ, dataW, cmdLine.length * 2 + 2],
    FFI_TYPE_SINT32) as number
  ffiCall(pClose, [FFI_TYPE_UINT32], [hKey], FFI_TYPE_SINT32)
  return hr2 === 0
}

function regDeleteRun(): boolean {
  const a32 = win.LoadLibrary('advapi32.dll')
  if (!a32) return false
  const pDel = win.GetProcAddress(a32, 'RegDeleteKeyValueW')
  if (!pDel) return false
  const keyW = strToWideBuf('Software\\Microsoft\\Windows\\CurrentVersion\\Run')
  const nameW = strToWideBuf('SuperPrint')
  const hr = ffiCall(pDel,
    [FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
    [gui.HKey.CURRENT_USER, keyW, nameW],
    FFI_TYPE_SINT32) as number
  // ERROR_FILE_NOT_FOUND → value doesn't exist, success
  return hr === 0 || hr === gui.ErrorCode.FILE_NOT_FOUND
}

// ---------------------------------------------------------------------------
// shortcuts  (COM IShellLink + IPersistFile)
// ---------------------------------------------------------------------------

const CLSID_ShellLink = new Uint8Array([
  0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46,
]).buffer

const IID_IShellLinkW = guidStrToBytes(gui.Guid.IID_ISHELLLINKW)
const IID_IPersistFile = guidStrToBytes(gui.Guid.IID_IPERSISTFILE)

const VT_IDX_QI = 0
const VT_IDX_RELEASE = 2
const VT_IDX_SET_PATH = 20
const VT_IDX_SET_ARGS = 11
const VT_IDX_SET_WORKDIR = 9
const VT_IDX_SET_DESC = 7
const VT_IDX_PERSIST_SAVE = 6

function callComVoid(vtable: number, idx: number, thisPtr: number, arg2?: ArrayBuffer): void {
  const fn = readQword(vtable + idx * 8)
  if (arg2) {
    ffiCall(fn, [FFI_TYPE_UINT64, FFI_TYPE_POINTER], [thisPtr, arg2], FFI_TYPE_SINT32)
  } else {
    ffiCall(fn, [FFI_TYPE_UINT64], [thisPtr], FFI_TYPE_SINT32)
  }
}

function createShortcut(targetPath: string, args: string, shortcutPath: string, desc: string): boolean {
  const ole32 = win.LoadLibrary('ole32.dll')
  if (!ole32) throw new Error('加载 ole32.dll 失败')
  const pInit = win.GetProcAddress(ole32, 'CoInitialize')
  const pInst = win.GetProcAddress(ole32, 'CoCreateInstance')
  const pUninit = win.GetProcAddress(ole32, 'CoUninitialize')
  if (!pInit || !pInst || !pUninit) throw new Error('获取 COM 函数地址失败')

  ffiCall(pInit, [FFI_TYPE_POINTER], [null], FFI_TYPE_SINT32)

  const ppv = new ArrayBuffer(8)
  const hr = ffiCall(pInst,
    [FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
    [CLSID_ShellLink, null, 1, IID_IShellLinkW, ppv],
    FFI_TYPE_SINT32) as number

  if (hr !== 0) {
    ffiCall(pUninit, [], [], FFI_TYPE_SINT32)
    throw new Error('CoCreateInstance 失败')
  }

  const pSL = readPtr(new DataView(ppv), 0)
  const vt = readQword(pSL)

  callComVoid(vt, VT_IDX_SET_PATH, pSL, strToWideBuf(targetPath))
  if (args) callComVoid(vt, VT_IDX_SET_ARGS, pSL, strToWideBuf(args))
  const idx = targetPath.lastIndexOf('\\')
  if (idx !== -1) callComVoid(vt, VT_IDX_SET_WORKDIR, pSL, strToWideBuf(targetPath.substring(0, idx)))
  if (desc) callComVoid(vt, VT_IDX_SET_DESC, pSL, strToWideBuf(desc))

  const ppf = new ArrayBuffer(8)
  const pQI = readQword(vt + VT_IDX_QI * 8)
  const hrQI = ffiCall(pQI,
    [FFI_TYPE_UINT64, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
    [pSL, IID_IPersistFile, ppf],
    FFI_TYPE_SINT32) as number

  if (hrQI !== 0) {
    callComVoid(vt, VT_IDX_RELEASE, pSL)
    ffiCall(pUninit, [], [], FFI_TYPE_SINT32)
    throw new Error('QueryInterface(IPersistFile) 失败')
  }

  const pPF = readPtr(new DataView(ppf), 0)
  const pfVt = readQword(pPF)
  const pSave = readQword(pfVt + VT_IDX_PERSIST_SAVE * 8)
  const hrSave = ffiCall(pSave,
    [FFI_TYPE_UINT64, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
    [pPF, strToWideBuf(shortcutPath), 1],
    FFI_TYPE_SINT32) as number

  callComVoid(pfVt, VT_IDX_RELEASE, pPF)
  callComVoid(vt, VT_IDX_RELEASE, pSL)
  ffiCall(pUninit, [], [], FFI_TYPE_SINT32)

  if (hrSave !== 0) throw new Error('IPersistFile::Save 失败')
  return true
}

// ---------------------------------------------------------------------------
// step definitions (for GUI install/uninstall)
// ---------------------------------------------------------------------------

export interface InstallStep {
  key: string
  label: string
}

export const INSTALL_STEPS: InstallStep[] = [
  { key: 'copy', label: '复制文件到安装目录' },
  { key: 'regrun', label: '注册系统开机自启' },
  { key: 'startmenu', label: '添加开始菜单快捷方式' },
  { key: 'desktop', label: '添加桌面快捷方式' },
]

export const UNINSTALL_STEPS: InstallStep[] = [
  { key: 'remove_shortcuts', label: '删除快捷方式' },
  { key: 'remove_regrun', label: '删除开机自启注册表' },
  { key: 'remove_files', label: '删除程序文件' },
]

export function runInstallStep(key: string): boolean {
  switch (key) {
    case 'copy': return installStepCopy()
    case 'regrun': return installStepRegRun()
    case 'startmenu': return installStepStartMenu()
    case 'desktop': return installStepDesktop()
    default: return false
  }
}

export function runUninstallStep(key: string): boolean {
  switch (key) {
    case 'remove_shortcuts': return uninstallStepShortcuts()
    case 'remove_regrun': return regDeleteRun()
    case 'remove_files': return uninstallStepFiles()
    default: return false
  }
}

function installStepCopy(): boolean {
  const exePath = getExePath()
  if (!exePath) return false
  const installDir = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint'
  const targetExe = installDir + '\\QuickSuperPrint.exe'
  os.mkdir(installDir)
  return copyFile(exePath, targetExe)
}

function installStepRegRun(): boolean {
  const targetExe = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint\\QuickSuperPrint.exe'
  const cmdLine = '"' + targetExe + '" --run --autostart'
  return regSetRun(cmdLine)
}

function installStepStartMenu(): boolean {
  const targetExe = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint\\QuickSuperPrint.exe'
  const appData = std.getenv('APPDATA') || ''
  const startMenuDir = appData + '\\Microsoft\\Windows\\Start Menu\\Programs\\超人打印'
  mkdirW(startMenuDir)
  createShortcut(targetExe, '-c --run', startMenuDir + '\\超人打印(-c).lnk', '超人打印')
  createShortcut(targetExe, '-c --uninstall', startMenuDir + '\\卸载(-c).lnk', '卸载超人打印')
  createShortcut(targetExe, '--run', startMenuDir + '\\超人打印.lnk', '超人打印')
  createShortcut(targetExe, '--uninstall', startMenuDir + '\\卸载.lnk', '卸载超人打印')
  return true
}

function installStepDesktop(): boolean {
  const targetExe = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint\\QuickSuperPrint.exe'
  const userProfile = std.getenv('USERPROFILE') || ''
  return createShortcut(targetExe, '--run', userProfile + '\\Desktop\\超人打印.lnk', '超人打印')
}

function uninstallStepShortcuts(): boolean {
  const appData = std.getenv('APPDATA') || ''
  const userProfile = std.getenv('USERPROFILE') || ''
  const startMenuDir = appData + '\\Microsoft\\Windows\\Start Menu\\Programs\\超人打印'
  deleteFileW(startMenuDir + '\\超人打印(-c).lnk')
  deleteFileW(startMenuDir + '\\卸载(-c).lnk')
  deleteFileW(startMenuDir + '\\超人打印.lnk')
  deleteFileW(startMenuDir + '\\卸载.lnk')
  deleteFileW(userProfile + '\\Desktop\\超人打印.lnk')
  return true
}

function uninstallStepFiles(): boolean {
  const installDir = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint'
  const startMenuDir = (std.getenv('APPDATA') || '') + '\\Microsoft\\Windows\\Start Menu\\Programs\\超人打印'

  // 1. clear _cache
  const cacheDir = installDir + '\\_cache'
  const dirResult = os.readdir(cacheDir)
  const cacheFiles = dirResult ? dirResult[0] : null
  if (cacheFiles) {
    for (let i = 0; i < cacheFiles.length; i++) {
      if (cacheFiles[i] === '.' || cacheFiles[i] === '..') continue
      deleteFileW(cacheDir + '\\' + cacheFiles[i])
    }
  }
  removeDirW(cacheDir)

  // 2. remove start menu folder (lnks already deleted in previous step)
  removeDirW(startMenuDir)

  // 3. spawn delayed bat to delete the entire SuperPrint dir (incl. running exe)
  const tmpDir = std.getenv('TEMP') || ''
  const batPath = tmpDir + '\\del_superprint.bat'
  const batContent = '@ping 127.0.0.1 -n 9 > nul\n@rmdir /s /q "' + installDir + '"\n@del "%~f0"\n'
  const f = std.open(batPath, 'wb')
  if (f) {
    const buf = new ArrayBuffer(batContent.length)
    const dv = new DataView(buf)
    for (let i = 0; i < batContent.length; i++) dv.setUint8(i, batContent.charCodeAt(i))
    f.write(buf, 0, batContent.length)
    f.close()
    spawnDetached(batPath, tmpDir)
  }
  return true
}

// ---------------------------------------------------------------------------
// combined CLI functions
// ---------------------------------------------------------------------------

export function install(): void {
  std.out.printf('[install] starting...\n'); std.out.flush()
  for (const step of INSTALL_STEPS) {
    const ok = runInstallStep(step.key)
    std.out.printf('[install] %s: %s\n', step.label, ok ? 'OK' : 'FAIL'); std.out.flush()
    if (!ok) return
  }
  std.out.printf('[install] done\n'); std.out.flush()
}

export function uninstall(): void {
  std.out.printf('[uninstall] starting...\n'); std.out.flush()
  for (const step of UNINSTALL_STEPS) {
    const ok = runUninstallStep(step.key)
    std.out.printf('[uninstall] %s: %s\n', step.label, ok ? 'OK' : 'FAIL'); std.out.flush()
    if (!ok) return
  }
  std.out.printf('[uninstall] done\n'); std.out.flush()
}
