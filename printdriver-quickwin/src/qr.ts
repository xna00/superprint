import { PtrArrayBuffer } from 'quickwin/lib/ffi/ctype.js'
import { CreateBitmap, DeleteObject } from 'quickwin/lib/windows/gdi32.js'
import { tag } from './utils.js'

/** 位图数据只读，拷进带 .ptr 的缓冲即可（<BYTE>ptr 位只认 PtrArrayBuffer，且无拷贝构造） */
export function createBitmap(width: number, height: number, bpp: number, bits: ArrayBuffer): number {
    const pab = new PtrArrayBuffer(bits.byteLength)
    new Uint8Array(pab).set(new Uint8Array(bits))
    return CreateBitmap(width, height, 1, bpp, pab)
}

export function deleteObject(hObj: number): boolean {
    return !!DeleteObject(tag<'HGDIOBJ'>(hObj))
}
