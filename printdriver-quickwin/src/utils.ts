import { readByte } from 'ffi'
import * as win from 'win'

export function getExePath(): string {
  return win.GetModuleFileName() || ''
}

export function strToWideBuf(str: string): ArrayBuffer {
    return new TextEncoder('utf-16le').encode(str + '\0').buffer as ArrayBuffer
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
