import * as std from 'std'
import * as os from 'os'
import * as ffi from 'ffi'
import { bindAt, WCHAR } from 'quickwin/lib/ffi/bind.js'
import type { CodecMap } from 'quickwin/lib/ffi/bind.js'
import { NULL, PTR_SIZE, PtrArrayBuffer } from 'quickwin/lib/ffi/ctype.js'
import { FAILED, SUCCEEDED, guidFields } from 'quickwin/lib/com.js'
import {
    CreateDirectory, CreateProcess, DeleteFile, FindClose, FindFirstFile,
    FindNextFile, GetFileAttributes, GetLastError, RemoveDirectory,
} from 'quickwin/lib/windows/kernel32.js'
import { RegCloseKey, RegCreateKeyEx, RegDeleteKeyValue, RegSetValueEx } from 'quickwin/lib/windows/advapi32.js'
import { IID, PROCESS_INFORMATION, STARTUPINFOW, WIN32_FIND_DATAW } from 'quickwin/lib/windows/structs.js'
import { CoCreateInstance, CoInitializeEx, CoUninitialize } from 'quickwin/lib/windows/ole32.js'
import {
    ClsCtx, CoInitFlag, ErrorCode, Guid, HKey, ProcessCreationFlag, RegAccess, RegType,
} from 'quickwin/constants'
import { readPtr } from './utils.js'

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
    // RegDeleteKeyValue 是 Vista 才加的导出，更老的系统上绑定为 null → 这步做不了，
    // 返回 false 让卸载界面如实标失败（别静默留下开机自启项）
    if (!RegDeleteKeyValue) return false
    const hr = RegDeleteKeyValue(HKey.CURRENT_USER, RUN_KEY, RUN_VALUE)
    return hr === 0 || hr === ErrorCode.FILE_NOT_FOUND   // value 不存在视同成功
}

// ---------------------------------------------------------------------------
// shortcuts  (COM IShellLink + IPersistFile)
// ---------------------------------------------------------------------------

// IShellLinkW / IPersistFile 的 vtable 下标。COM 方法没有导出名，只能按槽派发：
// 接口对象解引用两次 = 对象 → vtable 基址 → 槽内函数地址，再用 bindAt 绑签名
// （3.1.1 起 bindAt 是这条路的正式入口；此前只能退到 ffiCall 手填参数帧）。
// IShellLinkW 继承 IUnknown，QI/AddRef/Release 占 0-2；IPersistFile 是另一张表，
// 得先 QueryInterface 换过去、Save 排 6 —— 所以两组下标不共用。
const VT_QI = 0
const VT_RELEASE = 2
const VT_SET_DESC = 7
const VT_SET_WORKDIR = 9
const VT_SET_ARGS = 11
const VT_SET_PATH = 20
const VT_PERSIST_SAVE = 6

// quickwin/constants 的 Guid 只收录 IIDs，ShellLink 的 CLSID 得自己写
const CLSSTRING_ShellLink = '{00021401-0000-0000-C000-000000000046}'

/** 取接口对象第 idx 个 vtable 槽并绑成可调函数。
 *  vtable 是每类共享的静态表：同一对象每个槽只绑一次，别在循环里绑
 *  （bindAt 刻意不做缓存，见 lib/ffi/bind.ts 注释）。 */
function vtSlot<const S extends string, E extends CodecMap = {}>(
    obj: number, idx: number, sig: S, encoders?: E,
) {
    return bindAt(ffi.readPtr(ffi.readPtr(obj) + idx * PTR_SIZE), sig, encoders)
}

/** HRESULT 的十六进制形态，报错时用。 */
function hrHex(hr: number): string {
    return '0x' + (hr >>> 0).toString(16)
}

function createShortcut(targetPath: string, args: string, shortcutPath: string, desc: string): boolean {
    // S_FALSE 也是成功态（同线程同公寓重复初始化），故用 SUCCEEDED 而非比 0
    if (!SUCCEEDED(CoInitializeEx(NULL, CoInitFlag.APARTMENTTHREADED))) {
        throw new Error('CoInitializeEx 失败（线程公寓模型冲突？）')
    }

    const ppv = new PtrArrayBuffer(PTR_SIZE)
    // rclsid / riid 传「字段对象」而非 CLSID.encode(...).ptr：callPlan 只在槽写器**返回**缓冲
    // 时把它 held 到原生调用之后（bind.js 的 callPlan）。传裸地址走 number 快路径、不 held，
    // 内联临时的缓冲寿命就全看 GC 脸色。代价是丢掉 .encode() 的 CLSID/IID 品牌（编译期拦
    // 不住两参互换），故两处 GUID 字面量必须逐一核对——IID 用 constants 的枚举，不手写。
    const hrNew = CoCreateInstance(
        guidFields(CLSSTRING_ShellLink),
        guidFields(Guid.IID_ISHELLLINKW),
        ClsCtx.INPROC_SERVER,
        ppv.ptr,
    )
    if (FAILED(hrNew)) {
        CoUninitialize()
        throw new Error('CoCreateInstance 失败 hr=' + hrHex(hrNew))
    }

    const pSL = ffi.readPtr(ppv.ptr)
    const releaseSL = () => vtSlot(pSL, VT_RELEASE, '<>ptr -> i32')(pSL)
    const bailSL = (hr: number, what: string): never => {
        releaseSL()
        CoUninitialize()
        throw new Error(what + ' 失败 hr=' + hrHex(hr))
    }

    // IShellLinkW::SetPath / SetArguments / SetWorkingDirectory / SetDescription 同形 (THIS, PCWSTR)
    const setWstr = '<>ptr <WCHAR>ptr! -> i32' as const
    const hrPath = vtSlot(pSL, VT_SET_PATH, setWstr)(pSL, targetPath)
    if (FAILED(hrPath)) bailSL(hrPath, 'IShellLinkW::SetPath')
    if (args) {
        const hr = vtSlot(pSL, VT_SET_ARGS, setWstr)(pSL, args)
        if (FAILED(hr)) bailSL(hr, 'IShellLinkW::SetArguments')
    }
    const slash = targetPath.lastIndexOf('\\')
    if (slash !== -1) {
        const hr = vtSlot(pSL, VT_SET_WORKDIR, setWstr)(pSL, targetPath.substring(0, slash))
        if (FAILED(hr)) bailSL(hr, 'IShellLinkW::SetWorkingDirectory')
    }
    if (desc) {
        const hr = vtSlot(pSL, VT_SET_DESC, setWstr)(pSL, desc)
        if (FAILED(hr)) bailSL(hr, 'IShellLinkW::SetDescription')
    }

    // QueryInterface(THIS, REFIID, void**) 三个槽一个都不能少。旧版 callComArg 只填 2 槽，
    // 出参槽恒为 0 —— QueryInterface 要么往 NULL 写、要么回 E_INVALIDARG，Save 永远走不到，
    // 快捷方式因此从未真正落盘。
    const ppf = new PtrArrayBuffer(PTR_SIZE)
    const hrQI = vtSlot(pSL, VT_QI, '<>ptr <IID>ptr! <>ptr! -> i32', { IID })(
        pSL,
        guidFields(Guid.IID_IPERSISTFILE),   // 对象形，同 CoCreateInstance：由 bind 内部编码并 held
        ppf.ptr,
    )
    if (FAILED(hrQI)) bailSL(hrQI, 'QueryInterface(IPersistFile)')

    const pPF = ffi.readPtr(ppf.ptr)
    // IPersistFile::Save(THIS, pszFileName, fRemember)；fRemember=0 不记「当前文件」属性
    const hrSave = vtSlot(pPF, VT_PERSIST_SAVE, '<>ptr <WCHAR>ptr! u32 -> i32')(pPF, shortcutPath, 0)

    vtSlot(pPF, VT_RELEASE, '<>ptr -> i32')(pPF)
    releaseSL()
    CoUninitialize()

    if (FAILED(hrSave)) throw new Error('IPersistFile::Save 失败 hr=' + hrHex(hrSave))
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
