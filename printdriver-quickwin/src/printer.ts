import * as win from 'win'
import { ffiCall, bufferPtr, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_SINT32 } from 'ffi'
import { decodeWideAtPtr, readPtr } from './utils.js'

const _winspool = win.LoadLibrary('winspool.drv')
if (!_winspool) throw new Error('winspool.drv not found')
function gdip(name: string) {
    const ptr = win.GetProcAddress(_winspool!, name)
    if (!ptr) throw new Error('winspool!' + name + ' not found')
    return ptr
}
const GetDefaultPrinterW = gdip('GetDefaultPrinterW')
const EnumPrintersW = gdip('EnumPrintersW')

const PRINTER_ENUM_LOCAL = 0x00000002
const PRINTER_ENUM_CONNECTIONS = 0x00000004

export interface LocalPrinterInfo {
    name: string
    port: string
    driver: string
    enabled: boolean
}

export function enumLocalPrinters(): LocalPrinterInfo[] {
    const flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS
    const level = 2
    const neededBuf = new Uint32Array(new ArrayBuffer(4))
    const returnedBuf = new Uint32Array(new ArrayBuffer(4))

    ffiCall(
        EnumPrintersW,
        [FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
        [flags, null, level, null, 0, neededBuf.buffer, returnedBuf.buffer],
        FFI_TYPE_SINT32
    )

    if (neededBuf[0] === 0) return []

    const printerBuf = new ArrayBuffer(neededBuf[0])
    const ret = ffiCall(
        EnumPrintersW,
        [FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
        [flags, null, level, printerBuf, neededBuf[0], neededBuf.buffer, returnedBuf.buffer],
        FFI_TYPE_SINT32
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
    const sizeBuf = new ArrayBuffer(4)
    const sizeArr = new Uint32Array(sizeBuf)
    sizeArr[0] = 256
    const nameBuf = new ArrayBuffer(512)

    const ret = ffiCall(
        GetDefaultPrinterW,
        [FFI_TYPE_POINTER, FFI_TYPE_POINTER],
        [nameBuf, sizeBuf],
        FFI_TYPE_SINT32
    )

    if (ret === 0) return null
    return decodeWideAtPtr(bufferPtr(nameBuf))
}
