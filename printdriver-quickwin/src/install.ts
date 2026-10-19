import * as std from 'std'
import * as os from 'os'
import { ffiCall } from 'ffi'
import { WCHAR } from 'quickwin/lib/ffi/bind.js'
import { NULL, PtrArrayBuffer } from 'quickwin/lib/ffi/ctype.js'
import {
    CreateDirectory, CreateProcess, DeleteFile, FindClose, FindFirstFile,
    FindNextFile, GetFileAttributes, GetLastError, RemoveDirectory,
} from 'quickwin/lib/windows/kernel32.js'
import { RegCreateKeyEx, RegCloseKey, RegSetValueEx } from 'quickwin/lib/windows/advapi32.js'
import { PROCESS_INFORMATION, STARTUPINFOW, WIN32_FIND_DATAW } from 'quickwin/lib/windows/structs.js'
import {
    ErrorCode, HKey, ProcessCreationFlag, RegAccess, RegType, Guid,
} from 'quickwin/constants'
import { CoCreateInstance, CoInitialize, CoUninitialize, RegDeleteKeyValueW } from './win32.js'
import { guidStrToBytes, readPtr, readQword } from './utils.js'

const INSTALL_DIR = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint'
const TARGET_EXE = INSTALL_DIR + '\\QuickSuperPrint.exe'
const SETUP_EXE = INSTALL_DIR + '\\QuickSuperPrint_Setup.exe'
const START_MENU_DIR = (std.getenv('APPDATA') || '') + '\\Microsoft\\Windows\\Start Menu\\Programs\\超人打印'

const RUN_KEY = 'Software\\Microsoft\\Windows\\CurrentVersion\\Run'
const RUN_VALUE = 'SuperPrint'
const DESKTOP_SHORTCUT = '超人打印.lnk'

// quickwin/constants 没有 FILE_ATTRIBUTE_* 表
const FILE_ATTRIBUTE_DIRECTORY = 0x10

interface ShortcutDef {
    name: string
    target: string
    args: string
    desc: string
}

const SHORTCUT_WHITELIST: ShortcutDef[] = [
    { name: '超人打印.lnk', target: TARGET_EXE, args: '--run', desc: '超人打印' },
    { name: '卸载.lnk', target: TARGET_EXE, args: '--uninstall', desc: '卸载超人打印' },
    { name: '更新.lnk', target: SETUP_EXE, args: '-o CON', desc: '更新超人打印' },
    // 需要时取消注释即可恢复
    // { name: '超人打印(控制台).lnk', target: TARGET_EXE, args: '-o CON --run', desc: '超人打印' },
    // { name: '卸载(控制台).lnk', target: TARGET_EXE, args: '-o CON --uninstall', desc: '卸载超人打印' },
    // { name: '超人打印(调试).lnk', target: TARGET_EXE, args: '-d -o LOG --run', desc: '超人打印' },
]

// ---------------------------------------------------------------------------
// 文件 / 目录
// ---------------------------------------------------------------------------

/** FILE_NOT_FOUND 视同成功（幂等删除 / 已存在目录） */
function dirOp(ok: boolean): boolean {
    return ok || GetLastError() === ErrorCode.FILE_NOT_FOUND
}

function exists(path: string): boolean {
    const a = GetFileAttributes(path)
    return a !== -1 && (a & FILE_ATTRIBUTE_DIRECTORY) === 0
}

function mkdir(path: string): boolean {
    return dirOp(CreateDirectory(path, NULL) !== 0)
}

function rmdir(path: string): boolean {
    return dirOp(RemoveDirectory(path) !== 0)
}

function deleteFile(path: string): boolean {
    return dirOp(DeleteFile(path) !== 0)
}

/** 枚举目录条目，'.' / '..' 由调用方自行过滤。 */
function forEachEntry(dir: string, cb: (name: string) => void): void {
    const data = WIN32_FIND_DATAW.alloc()
    const hFind = FindFirstFile(dir + '\\*.*', data.ptr)
    if (!hFind) return
    cb(WIN32_FIND_DATAW.decode(data).cFileName)
    while (FindNextFile(hFind, data.ptr)) {
        cb(WIN32_FIND_DATAW.decode(data).cFileName)
    }
    FindClose(hFind)
}

/** 删目录内全部文件（含隐藏项），不清理子目录。 */
function deleteDirContents(dir: string): void {
    forEachEntry(dir, (n) => {
        if (n !== '.' && n !== '..') deleteFile(dir + '\\' + n)
    })
}

// 桌面快捷方式可能落在 8.3 短名目录里，两种拼法都试一遍
function deleteDesktopShortcut(): void {
    const userProfile = std.getenv('USERPROFILE') || ''
    deleteFile(userProfile + '\\Desktop\\' + DESKTOP_SHORTCUT)
    forEachEntry(userProfile + '\\Desktop', (n) => {
        if (hasShortName(n, DESKTOP_SHORTCUT)) deleteFile(userProfile + '\\Desktop\\' + n)
    })
}

function hasShortName(longName: string, target: string): boolean {
    const dotI = longName.lastIndexOf('.')
    if (dotI <= 0 || longName.length > dotI + 4) return false
    const short = longName.substring(0, dotI).toLowerCase()
    const tgt = target.replace(/\.[^.]+$/, '').toLowerCase()
    if (short.length > tgt.length) return false
    for (let i = 0; i < short.length; i++) {
        if (short[i] !== tgt[i]) return false
    }
    return true
}

/** CREATE_NO_WINDOW + 指定工作目录，卸载后延迟删除自身所在目录。 */
function spawnDetached(cmdLine: string, cwd: string): void {
    const procInfo = PROCESS_INFORMATION.alloc()
    const ret = CreateProcess(
        NULL, cmdLine, NULL, NULL, 0, 0, NULL, cwd,
        { cb: STARTUPINFOW.size, dwFlags: ProcessCreationFlag.NO_WINDOW },
        procInfo.ptr,
    )
    if (ret === 0) throw new Error('CreateProcessW 失败: ' + cmdLine + ' GLE=' + GetLastError())
}

// ---------------------------------------------------------------------------
// registry  (advapi32.dll)
// ---------------------------------------------------------------------------

function regSetRun(cmdLine: string): boolean {
    const keyBuf = new PtrArrayBuffer(8)
    if (RegCreateKeyEx(HKey.CURRENT_USER, RUN_KEY, 0, NULL, 0, RegAccess.SET_VALUE, NULL, keyBuf, NULL) !== 0) {
        return false
    }
    const hKey = readPtr(new DataView(keyBuf), 0)
    try {
        return RegSetValueEx(hKey, RUN_VALUE, 0, RegType.SZ, WCHAR.encode(cmdLine), (cmdLine.length + 1) * 2) === 0
    } finally {
        RegCloseKey(hKey)
    }
}

function regDeleteRun(): boolean {
    const hr = RegDeleteKeyValueW(HKey.CURRENT_USER, RUN_KEY, RUN_VALUE)
    return hr === 0 || hr === ErrorCode.FILE_NOT_FOUND   // value 不存在视同成功
}

// ---------------------------------------------------------------------------
// shortcuts  (COM IShellLink + IPersistFile)
// ---------------------------------------------------------------------------

// IShellLinkW / IPersistFile vtable 下标
const VT_QI = 0
const VT_RELEASE = 2
const VT_SET_DESC = 7
const VT_SET_WORKDIR = 9
const VT_SET_ARGS = 11
const VT_SET_PATH = 20
const VT_PERSIST_SAVE = 6

/** COM vtable 调用：vt + idx*8 取槽位地址，this 走第 1 槽，可选 1 个 LPWSTR。
 *  走 ffiCall 而非 bind（bind 只认 DLL 名，不认裸地址）。 */
function callCom(vt: number, idx: number, thisPtr: number, lpWstr?: PtrArrayBuffer<any>): void {
    const frame = new ArrayBuffer(32)      // 4 槽 × 8 字节：x64 桩无条件读 4 槽
    const dv = new DataView(frame)
    dv.setBigUint64(0, BigInt(thisPtr), true)
    if (lpWstr) dv.setBigUint64(8, BigInt(lpWstr.ptr), true)
    const ret = new ArrayBuffer(8)
    ffiCall(readQword(vt + idx * 8), frame, ret, 0)
    if (new DataView(ret).getInt32(0, true) !== 0) {
        throw new Error('COM 调用失败: vtable idx ' + idx)
    }
}

function callComArg(fn: number, thisPtr: number, lpWstr: PtrArrayBuffer<any>): number {
    const frame = new ArrayBuffer(32)
    const dv = new DataView(frame)
    dv.setBigUint64(0, BigInt(thisPtr), true)
    dv.setBigUint64(8, BigInt(lpWstr.ptr), true)
    const ret = new ArrayBuffer(8)
    ffiCall(fn, frame, ret, 0)
    return new DataView(ret).getInt32(0, true)
}

const CLSID_ShellLink = guidStrToBytes('{00021401-0000-0000-C000-000000000046}')
const IID_IShellLinkW = guidStrToBytes(Guid.IID_ISHELLLINKW)
const IID_IPersistFile = guidStrToBytes(Guid.IID_IPERSISTFILE)

function createShortcut(targetPath: string, args: string, shortcutPath: string, desc: string): boolean {
    CoInitialize(NULL)

    const ppv = new PtrArrayBuffer(8)
    if (CoCreateInstance(CLSID_ShellLink.ptr, NULL, 1, IID_IShellLinkW.ptr, ppv) !== 0) {
        CoUninitialize()
        throw new Error('CoCreateInstance 失败')
    }

    const pSL = readPtr(new DataView(ppv), 0)
    const vt = readQword(pSL)

    callCom(vt, VT_SET_PATH, pSL, WCHAR.encode(targetPath))
    if (args) callCom(vt, VT_SET_ARGS, pSL, WCHAR.encode(args))
    const slash = targetPath.lastIndexOf('\\')
    if (slash !== -1) callCom(vt, VT_SET_WORKDIR, pSL, WCHAR.encode(targetPath.substring(0, slash)))
    if (desc) callCom(vt, VT_SET_DESC, pSL, WCHAR.encode(desc))

    const ppf = new PtrArrayBuffer(8)
    const hrQI = callComArg(readQword(vt + VT_QI * 8), pSL, IID_IPersistFile)
    if (hrQI !== 0) {
        callCom(vt, VT_RELEASE, pSL)
        CoUninitialize()
        throw new Error('QueryInterface(IPersistFile) 失败')
    }

    const pPF = readPtr(new DataView(ppf), 0)
    const pfVt = readQword(pPF)
    const hrSave = callComArg(readQword(pfVt + VT_PERSIST_SAVE * 8), pPF, WCHAR.encode(shortcutPath))

    callCom(pfVt, VT_RELEASE, pPF)
    callCom(vt, VT_RELEASE, pSL)
    CoUninitialize()

    if (hrSave !== 0) throw new Error('IPersistFile::Save 失败 hr=' + hrSave)
    return true
}

// ---------------------------------------------------------------------------
// ensure installed files (run on every main app startup)
// ---------------------------------------------------------------------------

const CDN_URLS = [
    'https://superprint.112287.xyz/printdriver/QuickSuperPrint.exe',
    'https://superprint.xna00.top/printdriver/QuickSuperPrint.exe',
]

async function ensureSetupExe(): Promise<void> {
    if (exists(SETUP_EXE)) return
    const t = Date.now()
    for (const url of CDN_URLS) {
        try {
            const resp = await fetch(url.replace('QuickSuperPrint.exe', 'QuickSuperPrint_Setup.exe') + '?t=' + t)
            if (resp.ok) {
                const buf = await resp.arrayBuffer()
                const f = std.open(SETUP_EXE, 'wb')
                if (f) {
                    f.write(buf, 0, buf.byteLength)
                    f.close()
                }
                return
            }
        } catch (_) {}
    }
}

function ensureShortcuts(): void {
    mkdir(START_MENU_DIR)
    for (const s of SHORTCUT_WHITELIST) {
        createShortcut(s.target, s.args, START_MENU_DIR + '\\' + s.name, s.desc)
    }
    createShortcut(TARGET_EXE, '--run', (std.getenv('USERPROFILE') || '') + '\\Desktop\\' + DESKTOP_SHORTCUT, '超人打印')
}

function pruneShortcuts(): void {
    forEachEntry(START_MENU_DIR, (name) => {
        if (name !== '.' && name !== '..' && !SHORTCUT_WHITELIST.some(s => s.name === name)) {
            deleteFile(START_MENU_DIR + '\\' + name)
        }
    })
}

function ensureAutoStart(): boolean {
    return regSetRun('"' + TARGET_EXE + '" --run --autostart')
}

export async function ensureInstalled(): Promise<void> {
    try { os.mkdir(INSTALL_DIR) } catch (_) {}
    await ensureSetupExe()
    ensureShortcuts()
    pruneShortcuts()
    ensureAutoStart()
}

// ---------------------------------------------------------------------------
// uninstall
// ---------------------------------------------------------------------------

export interface InstallStep {
    key: string
    label: string
}

export const UNINSTALL_STEPS: InstallStep[] = [
    { key: 'remove_shortcuts', label: '删除快捷方式' },
    { key: 'remove_regrun', label: '删除开机自启注册表' },
    { key: 'remove_files', label: '删除程序文件' },
]

export function runUninstallStep(key: string): boolean {
    switch (key) {
        case 'remove_shortcuts': return uninstallStepShortcuts()
        case 'remove_regrun': return regDeleteRun()
        case 'remove_files': return uninstallStepFiles()
        default: return false
    }
}

function uninstallStepShortcuts(): boolean {
    deleteDirContents(START_MENU_DIR)
    rmdir(START_MENU_DIR)
    deleteDesktopShortcut()
    return true
}

function uninstallStepFiles(): boolean {
    // 1. clear _cache
    const cacheDir = INSTALL_DIR + '\\_cache'
    const cacheFiles = os.readdir(cacheDir)?.[0]
    if (cacheFiles) {
        for (let i = 0; i < cacheFiles.length; i++) {
            if (cacheFiles[i] === '.' || cacheFiles[i] === '..') continue
            deleteFile(cacheDir + '\\' + cacheFiles[i])
        }
    }
    rmdir(cacheDir)

    // 2. remove start menu folder (lnks already gone in the previous step)
    rmdir(START_MENU_DIR)

    // 3. spawn a delayed bat to delete the whole SuperPrint dir (incl. the running exe)
    const tmpDir = std.getenv('TEMP') || ''
    const batPath = tmpDir + '\\del_superprint.bat'
    const batContent = '@ping 127.0.0.1 -n 9 > nul\n@rmdir /s /q "' + INSTALL_DIR + '"\n@del "%~f0"\n'
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

export function uninstall(): void {
    std.out.printf('[uninstall] starting...\n'); std.out.flush()
    for (const step of UNINSTALL_STEPS) {
        const ok = runUninstallStep(step.key)
        std.out.printf('[uninstall] %s: %s\n', step.label, ok ? 'OK' : 'FAIL'); std.out.flush()
        if (!ok) return
    }
    std.out.printf('[uninstall] done\n'); std.out.flush()
}
