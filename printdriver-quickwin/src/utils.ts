import { readByte } from 'ffi'

export function strToWideBuf(str: string): ArrayBuffer {
    const buf = new ArrayBuffer((str.length + 1) * 2)
    const dv = new DataView(buf)
    for (let i = 0; i < str.length; i++) {
        dv.setUint16(i * 2, str.charCodeAt(i), true)
    }
    dv.setUint16(str.length * 2, 0, true)
    return buf
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
