import { bindLib } from 'quickwin/lib/ffi/bind.js'
import { NULL } from 'quickwin/lib/ffi/ctype.js'
import { CloseHandle, GetLastError } from 'quickwin/lib/windows/kernel32.js'
import { GetCursorPos, MessageBox, PostQuitMessage } from 'quickwin/lib/windows/user32.js'
import { POINT } from 'quickwin/lib/windows/structs.js'
import { ErrorCode } from 'quickwin/constants'

// ---------------------------------------------------------------------------
// quickwin/lib/windows 尚未覆盖的 Win32 函数，用 bindLib 就地声明。
// 签名串语法见 lib/ffi/ctype.ts：i32/u32/u64/void、<NAME>ptr（可空指针）、
// <NAME>ptr!（非空）、<>ptr（无品牌裸地址）、<BYTE>ptr（收 PtrArrayBuffer）、
// u32@EnumName（枚举）。encoders 表里的结构体按值/按指针自动编解码。
// ---------------------------------------------------------------------------

const mutexLib = bindLib('kernel32.dll', {
    // LPSECURITY_ATTRIBUTES 用不到 → <>ptr 收 NULL
    CreateMutexW: '<>ptr <>ptr <WCHAR>ptr -> <>ptr',
    ReleaseMutex: '<>ptr -> i32',
})

const printLib = bindLib('gdi32.dll', {
    // lpInit 是 DEVMODE*，不注册 encoder → 只收裸地址
    CreateDCW: '<WCHAR>ptr <WCHAR>ptr <WCHAR>ptr <>ptr -> <>ptr',
    StartDocW: '<>ptr <>ptr -> i32',
    EndDoc: '<>ptr -> i32',
    StartPage: '<>ptr -> i32',
    EndPage: '<>ptr -> i32',
    ResetDCW: '<>ptr <BYTE>ptr -> <>ptr',
    SetBrushOrgEx: '<>ptr i32 i32 <>ptr -> i32',
})

const winspoolLib = bindLib('winspool.drv', {
    // pDevMode / pDevModeOutput 是持久缓冲（API 会往里写）→ 只收 .ptr，不注册 encoder。
    // fMode 是 DM_IN_BUFFER|DM_OUT_BUFFER 位掩码，而 3.0.4 的 DevMode 枚举只收了
    // OUT_BUFFER（缺 IN_BUFFER=8）→ 用裸 u32，避免给组合值做枚举强转。
    DocumentPropertiesW: '<>ptr <>ptr <WCHAR>ptr <>ptr <>ptr u32 -> i32',
})

const advapiLib = bindLib('advapi32.dll', {
    RegDeleteKeyValueW: '<>ptr <WCHAR>ptr <WCHAR>ptr -> i32',
})

const oleLib = bindLib('ole32.dll', {
    CoInitialize: '<>ptr -> i32',
    CoCreateInstance: '<>ptr <>ptr u32 <>ptr <BYTE>ptr -> i32',
    // 零参绑定的写法是 ' -> ret'（不是 'void'）；两个 COM 收尾函数都返回 HRESULT
    CoUninitialize: ' -> i32',
})

export const { CreateMutexW, ReleaseMutex } = mutexLib
export const { CreateDCW, StartDocW, EndDoc, StartPage, EndPage, ResetDCW, SetBrushOrgEx } = printLib
export const { DocumentPropertiesW } = winspoolLib
export const { RegDeleteKeyValueW } = advapiLib
export const { CoInitialize, CoCreateInstance, CoUninitialize } = oleLib

/** 【历史遗留 · 迁移中未改】CreateProcessW 的 STARTUPINFOW.cb 历史值。
 *  1.x 一直硬编码 68，而 68 是 **ia32** 的 sizeof(STARTUPINFOW)；x64 的 sizeof 是 104
 *  （quickwin 3.x 注释写「cb 必须 = STARTUPINFOW.size（结构自描述是 Win32 要求）」）。
 *  实测（wine + qwin.exe x64，arch=x64 / STARTUPINFOW.size=104）：
 *      cb=68   → CreateProcessW 返回 1（成功）
 *      cb=104  → CreateProcessW 返回 1（成功）
 *  即 68 在当前环境下并非 bug（Win32 对偏小的 cb 是宽容的），故按「迁移不改行为」原样保留。
 *  若日后要统一到惯用写法，把本常量换成 STARTUPINFOW.size 即可（两个调用点共用）。 */
export const STARTUPINFO_CB_LEGACY = 68

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** 单参数弹窗（对齐 quickwin 1.x 的 gui.MessageBox(message) 形态）。
 *  caption 统一用 '提示'，避免每个调用点重复。 */
export function alertBox(message: string, caption = '提示'): void {
    MessageBox(NULL, message, caption, 0)
}

/** 取光标屏幕坐标。GetCursorPos 要预置 POINT 缓冲，失败返回 [0,0]。 */
export function getCursorPos(): [number, number] {
    const pt = POINT.encode({})
    if (!GetCursorPos(pt.ptr)) return [0, 0]
    const p = POINT.decode(pt)
    return [p.x, p.y]
}

/** 创建全局命名互斥体防多开。
 *  @returns 已有实例在跑 → null；否则返回句柄（退出前须 ReleaseMutex）。
 *  句柄为 0 表示创建失败，调用方按「未拿到句柄」处理即可。 */
export function acquireSingleInstanceMutex(name: string): number | null {
    const h = CreateMutexW(NULL, NULL, name)
    if (GetLastError() === ErrorCode.ALREADY_EXISTS) return null
    return h
}

/** 释放互斥体并关闭句柄（进程退出前调用，避免句柄泄漏）。 */
export function releaseSingleInstanceMutex(h: number | null): void {
    if (!h) return
    ReleaseMutex(h)
    CloseHandle(h)
}

/** 提示已有实例在跑并退出（--uninstall 路径用，主程序路径静默退出）。 */
export function bailOnSecondInstance(): void {
    alertBox('超人打印正在运行，请先退出后再操作')
    PostQuitMessage(0)
}
