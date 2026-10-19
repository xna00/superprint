import { WCHAR } from 'quickwin/lib/ffi/bind.js'
import { structArray } from 'quickwin/lib/ffi/struct.js'
import { NULL, PtrArrayBuffer } from 'quickwin/lib/ffi/ctype.js'
import { EnumPrinters, GetDefaultPrinter } from 'quickwin/lib/windows/winspool.js'
import { PRINTER_INFO_2W } from 'quickwin/lib/windows/structs.js'
import { PrinterEnum } from 'quickwin/constants'
import { decodeWideAtPtr } from './utils.js'

export interface LocalPrinterInfo {
    name: string
    port: string
    driver: string
    enabled: boolean
    id: number | null
}

export function enumLocalPrinters(): LocalPrinterInfo[] {
    const flags = PrinterEnum.LOCAL | PrinterEnum.CONNECTIONS
    const level = 2
    const neededBuf = new PtrArrayBuffer(4)
    const returnedBuf = new PtrArrayBuffer(4)
    const neededU = new Uint32Array(neededBuf)
    const returnedU = new Uint32Array(returnedBuf)

    // 两段式：先 NULL 探测所需字节数，再按需求分配重调
    EnumPrinters(flags, NULL, level, NULL, 0, neededBuf, returnedBuf)

    if (neededU[0] === 0) return []

    const printerBuf = new PtrArrayBuffer(neededU[0])
    const ret = EnumPrinters(flags, NULL, level, printerBuf, neededU[0], neededBuf, returnedBuf)

    if (ret === 0) return []

    // 出参是结构数组 + 尾部宽字符串区（byteLength 不是 size 整数倍）→ count 必填
    const infos = structArray(PRINTER_INFO_2W).decode(printerBuf, returnedU[0])
    const printers: LocalPrinterInfo[] = []
    for (let i = 0; i < infos.length && i < 100; i++) {
        const inf = infos[i]!
        const name = decodeWideAtPtr(inf.pPrinterName)
        if (!name) continue
        const port = decodeWideAtPtr(inf.pPortName)
        const driver = decodeWideAtPtr(inf.pDriverName)
        printers.push({ name, port, driver, enabled: false, id: null })
    }

    return printers
}

export function getDefaultPrinter(): string | null {
    const sizeBuf = new PtrArrayBuffer(4)
    new Uint32Array(sizeBuf)[0] = 256
    const nameBuf = WCHAR.alloc(256)

    const ret = GetDefaultPrinter(nameBuf, sizeBuf)

    if (ret === 0) return null
    const name = WCHAR.decode(nameBuf)
    return name || null
}
