import { ffiCall, FFI_TYPE_SINT32, FFI_TYPE_UINT32, FFI_TYPE_UINT64, FFI_TYPE_POINTER } from 'ffi'
import * as win from 'win'

const _gdi32 = win.LoadLibrary('gdi32.dll')
if (!_gdi32) throw new Error('gdi32.dll not found')

const _CreateBitmap = (() => {
    const ptr = win.GetProcAddress(_gdi32, 'CreateBitmap')
    if (!ptr) throw new Error('gdi32!CreateBitmap not found')
    return ptr
})()

const _DeleteObject = (() => {
    const ptr = win.GetProcAddress(_gdi32, 'DeleteObject')
    if (!ptr) throw new Error('gdi32!DeleteObject not found')
    return ptr
})()

export function createBitmap(width: number, height: number, bpp: number, bits: ArrayBuffer): number {
    return ffiCall(
        _CreateBitmap,
        [FFI_TYPE_SINT32, FFI_TYPE_SINT32, FFI_TYPE_UINT32, FFI_TYPE_UINT32, FFI_TYPE_POINTER],
        [width, height, 1, bpp, bits],
        FFI_TYPE_UINT64
    ) as number
}

export function deleteObject(hObj: number): boolean {
    return !!ffiCall(
        _DeleteObject,
        [FFI_TYPE_UINT64],
        [hObj],
        FFI_TYPE_SINT32
    )
}
