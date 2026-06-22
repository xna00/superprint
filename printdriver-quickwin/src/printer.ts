import * as win from 'win'
import * as ffi from 'ffi'

const _winspool = win.LoadLibrary('winspool.drv')

const GetDefaultPrinterW = (_winspool ? win.GetProcAddress(_winspool, 'GetDefaultPrinterW') : 0) as number
const EnumPrintersW = (_winspool ? win.GetProcAddress(_winspool, 'EnumPrintersW') : 0) as number

const PRINTER_ENUM_LOCAL = 0x00000002
const PRINTER_ENUM_CONNECTIONS = 0x00000004

function decodeWideAtPtr(ptr: number): string {
    if (!ptr) return ''
    let result = ''
    let pos = ptr
    while (true) {
        const low = ffi.readByte(pos)
        const high = ffi.readByte(pos + 1)
        const ch = low + high * 256
        if (ch === 0) break
        result += String.fromCharCode(ch)
        pos += 2
    }
    return result
}

function readPtr(dv: DataView, offset: number): number {
    const low = dv.getUint32(offset, true)
    const high = dv.getUint32(offset + 4, true)
    return low + high * 4294967296
}

export interface LocalPrinterInfo {
    name: string
    port: string
    driver: string
    enabled: boolean
}

export function enumLocalPrinters(): LocalPrinterInfo[] {
    if (!EnumPrintersW) return []

    const flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS
    const level = 2
    const neededBuf = new Uint32Array(new ArrayBuffer(4))
    const returnedBuf = new Uint32Array(new ArrayBuffer(4))

    ffi.ffiCall(
        EnumPrintersW,
        [ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [flags, null, level, null, 0, neededBuf.buffer, returnedBuf.buffer],
        ffi.FFI_TYPE_SINT32
    )

    if (neededBuf[0] === 0) return []

    const printerBuf = new ArrayBuffer(neededBuf[0])
    const ret = ffi.ffiCall(
        EnumPrintersW,
        [ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [flags, null, level, printerBuf, neededBuf[0], neededBuf.buffer, returnedBuf.buffer],
        ffi.FFI_TYPE_SINT32
    )

    if (ret === 0) return []

    const printers: LocalPrinterInfo[] = []
    const dv = new DataView(printerBuf)
    const structSize = 136

    for (let i = 0; i < returnedBuf[0] && i < 100; i++) {
        const off = i * structSize
        const name = decodeWideAtPtr(readPtr(dv, off + 8))
        if (!name) continue
        const port = decodeWideAtPtr(readPtr(dv, off + 24))
        const driver = decodeWideAtPtr(readPtr(dv, off + 32))
        printers.push({ name, port, driver, enabled: false })
    }

    return printers
}

export function getDefaultPrinter(): string | null {
    if (!GetDefaultPrinterW) return null

    const sizeBuf = new ArrayBuffer(4)
    const sizeArr = new Uint32Array(sizeBuf)
    sizeArr[0] = 256
    const nameBuf = new ArrayBuffer(512)

    const ret = ffi.ffiCall(
        GetDefaultPrinterW,
        [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [nameBuf, sizeBuf],
        ffi.FFI_TYPE_SINT32
    )

    if (ret === 0) return null
    return decodeWideAtPtr(ffi.bufferPtr(nameBuf))
}
