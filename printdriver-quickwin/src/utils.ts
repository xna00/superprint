import { readByte } from 'ffi'
import * as win from 'win'

/** 返回北京时间 (UTC+8) 的 Date 对象 */
export function toCST(date?: Date): Date {
    return new Date((date || new Date()).getTime() + 8 * 3600000)
}

export function getExePath(): string {
  return win.GetModuleFileName() || ''
}

let _utf16le: TextEncoder | null = null
export function strToWideBuf(str: string): ArrayBuffer {
    if (!_utf16le) _utf16le = new TextEncoder('utf-16le')
    return _utf16le.encode(str + '\0').buffer as ArrayBuffer
}

export function decodeWideAtPtr(ptr: number): string {
    if (!ptr) return ''
    let result = ''
    let pos = ptr
    while (true) {
        const low = readByte(pos)
        const high = readByte(pos + 1)
        const ch = low + high * 256
        if (ch === 0) break
        result += String.fromCharCode(ch)
        pos += 2
    }
    return result
}

export function readPtr(dv: DataView, offset: number): number {
    const low = dv.getUint32(offset, true)
    const high = dv.getUint32(offset + 4, true)
    return low + high * 4294967296
}

/** Convert a GUID string like `{000214F9-0000-0000-C000-000000000046}` to a 16-byte ArrayBuffer */
export function guidStrToBytes(guid: string): ArrayBuffer {
    const hex = guid.replace(/[{}]/g, '').replace(/-/g, '')
    const buf = new ArrayBuffer(16)
    const dv = new DataView(buf)
    dv.setUint32(0, parseInt(hex.substring(0, 8), 16), true)
    dv.setUint16(4, parseInt(hex.substring(8, 12), 16), true)
    dv.setUint16(6, parseInt(hex.substring(12, 16), 16), true)
    for (let i = 0; i < 8; i++) {
        dv.setUint8(8 + i, parseInt(hex.substring(16 + i * 2, 18 + i * 2), 16))
    }
    return buf
}
