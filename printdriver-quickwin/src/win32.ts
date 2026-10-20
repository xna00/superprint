import { NULL } from 'quickwin/lib/ffi/ctype.js'
import type { MaybePtr } from 'quickwin/lib/ffi/ctype.js'
import { CloseHandle, CreateMutex, GetLastError, ReleaseMutex } from 'quickwin/lib/windows/kernel32.js'
import { GetCursorPos, MessageBox, PostQuitMessage } from 'quickwin/lib/windows/user32.js'
import { POINT } from 'quickwin/lib/windows/structs.js'
import { ErrorCode } from 'quickwin/constants'

// 注：quickwin/lib/windows 已覆盖的函数一律从官方模块引（ole32 的 COM 三件套见
// install.ts 直接引 quickwin/lib/windows/ole32.js），这里只留本项目专属的 helper。
// 签名串语法见 lib/ffi/ctype.ts：i32/u32/u64/void、<NAME>ptr（可空指针）、
// <NAME>ptr!（非空）、<>ptr（无品牌裸地址）、<BYTE>ptr（收 PtrArrayBuffer）、
// u32@EnumName（枚举）。encoders 表里的结构体按值/按指针自动编解码。

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
 *  @returns 已有实例在跑或创建失败 → null；否则返回句柄（退出前须 ReleaseMutex）。
 *  句柄带 HMUTEX 品牌，退出前直接喂 ReleaseMutex，不用再转。 */
export function acquireSingleInstanceMutex(name: string): MaybePtr<'HMUTEX'> | null {
    const h = CreateMutex(NULL, 0, name)
    if (GetLastError() === ErrorCode.ALREADY_EXISTS) return null
    return h
}

/** 释放互斥体并关闭句柄（进程退出前调用，避免句柄泄漏）。 */
export function releaseSingleInstanceMutex(h: MaybePtr<'HMUTEX'> | null): void {
    if (!h) return
    ReleaseMutex(h)
    CloseHandle(h)
}

/** 提示已有实例在跑并退出（--uninstall 路径用，主程序路径静默退出）。 */
export function bailOnSecondInstance(): void {
    alertBox('超人打印正在运行，请先退出后再操作')
    PostQuitMessage(0)
}
