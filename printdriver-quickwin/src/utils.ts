import { readByte, readBytes } from 'ffi'
import * as os from 'os'
import { WCHAR } from 'quickwin/lib/ffi/bind.js'
import { NULL, PtrArrayBuffer } from 'quickwin/lib/ffi/ctype.js'
import { GetModuleFileName } from 'quickwin/lib/windows/kernel32.js'

/** 返回北京时间 (UTC+8) 的 Date 对象 */
export function toCST(date?: Date): Date {
    return new Date((date || new Date()).getTime() + 8 * 3600000)
}

export function getExePath(): string {
    const buf = WCHAR.alloc(520)
    GetModuleFileName(NULL, buf, 520)
    return WCHAR.decode(buf)
}

/** UTF-16LE + 结尾 NUL，返回带 .ptr 的缓冲（native 写回同一块内存） */
export function strToWideBuf(str: string): ArrayBuffer {
    return WCHAR.encode(str)
}

const MAX_WCHARS = 4096

/** 跟进任意指针逐字宽读，直到 NUL 或 MAX_WCHARS 字上限。
 *  收裸 number（结构体指针字段是泛型 <">ptr，带品牌强转没意义） */
export function decodeWideAtPtr(ptr: number): string {
    if (!ptr) return ''
    const chars: number[] = []
    let pos = ptr
    while (chars.length < MAX_WCHARS) {
        const ch = readByte(pos) + readByte(pos + 1) * 256
        if (ch === 0) break
        chars.push(ch)
        pos += 2
    }
    return String.fromCharCode(...chars)
}

export function readPtr(dv: DataView, offset: number): number {
    if (os.arch === 'ia32') return dv.getUint32(offset, true)
    return dv.getUint32(offset, true) + dv.getUint32(offset + 4, true) * 4294967296
}

/** 从 native 地址读 64 位值（COM vtable 遍历用）。跨架构自动选读法。 */
export function readQword(addr: number): number {
    return readPtr(new DataView(readBytes(addr, 8)), 0)
}

/** 指针品牌（ptrBrand）是 TS 编译期承诺，native 侧只认地址位。
 *  从缓冲读出、或跨本仓库/quickwin 边界传裸 number 时用此标注；
 *  不传类型参数 = Ptr<""> = 保持裸 number。 */
export function tag<N extends string = ''>(v: number): N extends '' ? number : number & { readonly ptrBrand: N } {
    return v as N extends '' ? number : number & { readonly ptrBrand: N }
}

export interface AppMetadata {
  buildTime: string
  buildTimestamp: number
  entryHash: string
  preload: string[]
}

export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

declare global {
  interface GlobalThis {
    __APP_METADATA__?: Deferred<AppMetadata>
  }
}

/** Convert a GUID string like `{000214F9-0000-0000-C000-000000000046}` to a 16-byte buffer.
 *  返回 PtrArrayBuffer（带 .ptr），可直接喂 <GUID>ptr 形参。 */
export function guidStrToBytes(guid: string): PtrArrayBuffer<any> {
    const hex = guid.replace(/[{}]/g, '').replace(/-/g, '')
    const buf = new PtrArrayBuffer(16)
    const dv = new DataView(buf)
    dv.setUint32(0, parseInt(hex.substring(0, 8), 16), true)
    dv.setUint16(4, parseInt(hex.substring(8, 12), 16), true)
    dv.setUint16(6, parseInt(hex.substring(12, 16), 16), true)
    for (let i = 0; i < 8; i++) {
        dv.setUint8(8 + i, parseInt(hex.substring(16 + i * 2, 18 + i * 2), 16))
    }
    return buf
}
