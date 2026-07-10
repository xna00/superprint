import * as std from 'std'
import * as win from 'win'
import * as os from 'os'
import { ffiCall, readByte, FFI_TYPE_UINT32, FFI_TYPE_SINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT64 } from 'ffi'
import { strToWideBuf, readPtr } from './utils.js'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

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

function getExePath(): string {
  const k32 = win.LoadLibrary('kernel32.dll')
  if (!k32) return ''
  const pFn = win.GetProcAddress(k32, 'GetModuleFileNameW')
  if (!pFn) return ''
  const buf = new ArrayBuffer(2048)
  const ret = ffiCall(pFn, [FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32], [0, buf, 1024], FFI_TYPE_UINT32) as number
  if (!ret) return ''
  const dv = new DataView(buf)
  let s = ''
  for (let i = 0; i < ret; i++) s += String.fromCharCode(dv.getUint16(i * 2, true))
  return s
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

// ---------------------------------------------------------------------------
// registry  (advapi32.dll)
// ---------------------------------------------------------------------------

const HKCU = 0x80000001
const KEY_SET_VALUE = 0x0002
const REG_SZ = 1

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
    [HKCU, keyW, 0, null, 0, KEY_SET_VALUE, null, hKeyBuf, null],
    FFI_TYPE_SINT32) as number
  if (hr !== 0) return false

  const hKey = readPtr(new DataView(hKeyBuf), 0)
  const nameW = strToWideBuf('SuperPrint')
  const dataW = strToWideBuf(cmdLine)
  const hr2 = ffiCall(pSet,
    [FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
    [hKey, nameW, 0, REG_SZ, dataW, cmdLine.length * 2 + 2],
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
    [HKCU, keyW, nameW],
    FFI_TYPE_SINT32) as number
  return hr === 0
}

// ---------------------------------------------------------------------------
// shortcuts  (COM IShellLink + IPersistFile)
// ---------------------------------------------------------------------------

const CLSID_ShellLink = new Uint8Array([
  0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46,
]).buffer

const IID_IShellLinkW = new Uint8Array([
  0xF9, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46,
]).buffer

const IID_IPersistFile = new Uint8Array([
  0x0B, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46,
]).buffer

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
  if (!ole32) return false
  const pInit = win.GetProcAddress(ole32, 'CoInitialize')
  const pInst = win.GetProcAddress(ole32, 'CoCreateInstance')
  const pUninit = win.GetProcAddress(ole32, 'CoUninitialize')
  if (!pInit || !pInst || !pUninit) return false

  ffiCall(pInit, [FFI_TYPE_POINTER], [null], FFI_TYPE_SINT32)

  const ppv = new ArrayBuffer(8)
  const hr = ffiCall(pInst,
    [FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
    [CLSID_ShellLink, null, 1, IID_IShellLinkW, ppv],
    FFI_TYPE_SINT32) as number

  let ok = false
  if (hr === 0) {
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
    if (hrQI === 0) {
      const pPF = readPtr(new DataView(ppf), 0)
      const pfVt = readQword(pPF)
      const pSave = readQword(pfVt + VT_IDX_PERSIST_SAVE * 8)
      const hrSave = ffiCall(pSave,
        [FFI_TYPE_UINT64, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
        [pPF, strToWideBuf(shortcutPath), 1],
        FFI_TYPE_SINT32) as number
      ok = hrSave === 0
      callComVoid(pfVt, VT_IDX_RELEASE, pPF)
    }
    callComVoid(vt, VT_IDX_RELEASE, pSL)
  }
  ffiCall(pUninit, [], [], FFI_TYPE_SINT32)
  return ok
}

// ---------------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------------

export function install(): void {
  const exePath = getExePath()
  if (!exePath) {
    std.out.printf('[install] ERROR: cannot get exe path\n'); std.out.flush()
    return
  }

  const installDir = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint'
  const targetExe = installDir + '\\QuickSuperPrint.exe'
  const cmdLine = '"' + targetExe + '" -c --run'

  std.out.printf('[install] target dir: %s\n', installDir); std.out.flush()
  os.mkdir(installDir)
  if (!copyFile(exePath, targetExe)) {
    std.out.printf('[install] ERROR: copy failed\n'); std.out.flush()
    return
  }
  std.out.printf('[install] copied\n'); std.out.flush()

  regSetRun(cmdLine)
  std.out.printf('[install] registry set\n'); std.out.flush()

  const appData = std.getenv('APPDATA') || ''
  const userProfile = std.getenv('USERPROFILE') || ''
  createShortcut(targetExe, '-c --run', appData + '\\Microsoft\\Windows\\Start Menu\\Programs\\超人打印.lnk', '超人打印')
  createShortcut(targetExe, '-c --run', userProfile + '\\Desktop\\超人打印.lnk', '超人打印')
  std.out.printf('[install] shortcuts created\n'); std.out.flush()

}

export function uninstall(): void {
  std.out.printf('[uninstall] starting...\n'); std.out.flush()

  const appData = std.getenv('APPDATA') || ''
  const userProfile = std.getenv('USERPROFILE') || ''
  const installDir = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint'

  os.remove(appData + '\\Microsoft\\Windows\\Start Menu\\Programs\\超人打印.lnk')
  os.remove(userProfile + '\\Desktop\\超人打印.lnk')
  regDeleteRun()
  os.remove(installDir + '\\QuickSuperPrint.exe')

  const k32 = win.LoadLibrary('kernel32.dll')
  if (k32) {
    const pRDW = win.GetProcAddress(k32, 'RemoveDirectoryW')
    if (pRDW) ffiCall(pRDW, [FFI_TYPE_POINTER], [strToWideBuf(installDir)], FFI_TYPE_SINT32)
  }

  std.out.printf('[uninstall] done\n'); std.out.flush()
}
