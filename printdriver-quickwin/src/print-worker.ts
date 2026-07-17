import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as gui from 'gui'
import * as os from 'os'
import { ffiCall, bufferPtr, FFI_TYPE_POINTER, FFI_TYPE_UINT64, FFI_TYPE_SINT32, FFI_TYPE_UINT32 } from 'ffi'
import * as win from 'win'
import type { Document, Page, Pixmap } from 'quickwin/vendor/mupdf-wasm/mupdf.js'
import type { WorkerInMsg, WorkerOutMsg } from './worker-types.js'
import { strToWideBuf } from './utils.js'
import { RENDER_DPI } from './config.js'
import { api } from './api.js'
import { logger } from './logger.js'
type MuPdfModule = typeof import('quickwin/vendor/mupdf-wasm/mupdf.js').default

const wasmUrl = new URL('../node_modules/quickwin/vendor/mupdf-wasm/mupdf-wasm.wasm', import.meta.url).href

const _gdi32 = win.LoadLibrary('gdi32.dll')
const _kernel32 = win.LoadLibrary('kernel32.dll')
if (!_gdi32) throw new Error('gdi32.dll not found')
function gdip(name: string) {
    const ptr = win.GetProcAddress(_gdi32!, name)
    if (!ptr) throw new Error('gdi32!' + name + ' not found')
    return ptr
}
const CreateDCW = gdip('CreateDCW')
const DeleteDC = gdip('DeleteDC')
const StartDocW = gdip('StartDocW')
const EndDoc = gdip('EndDoc')
const StartPage = gdip('StartPage')
const EndPage = gdip('EndPage')
const GetDeviceCaps = gdip('GetDeviceCaps')
const StretchDIBits = gdip('StretchDIBits')
const ResetDCW = gdip('ResetDCW')
const SetStretchBltMode = gdip('SetStretchBltMode')
const SetBrushOrgEx = gdip('SetBrushOrgEx')
const GetLastError = _kernel32 ? win.GetProcAddress(_kernel32, 'GetLastError') : 0
function gle(): number {
    return GetLastError ? ffiCall(GetLastError, [], [], FFI_TYPE_UINT32) as number : 0
}

const HORZRES = gui.DeviceCap.HORZRES
const VERTRES = gui.DeviceCap.VERTRES
const LOGPIXELSX = gui.DeviceCap.LOGPIXELSX
const LOGPIXELSY = gui.DeviceCap.LOGPIXELSY

interface DibResult {
    data: ArrayBuffer
    w: number
    h: number
    stride: number
}

function makeBitmapInfo(w: number, h: number): ArrayBuffer {
    const bmi = new ArrayBuffer(40)
    const bv = new DataView(bmi)
    bv.setUint32(0, 40, true)
    bv.setInt32(4, w, true)
    bv.setInt32(8, -h, true)
    bv.setUint16(12, 1, true)
    bv.setUint16(14, 24, true)
    return bmi
}

function rotatePixels90(src: Uint8Array, srcW: number, srcH: number, srcStride: number): DibResult {
    // 逆时针旋转90°，和 C 版本 PlgBlt 方向一致
    // src(x,y) → dst(y, srcW-1-x)
    const dstW = srcH
    const dstH = srcW
    const dstStride = Math.floor((dstW * 3 + 3) / 4) * 4
    const dst = new Uint8Array(dstH * dstStride)
    for (let y = 0; y < srcH; y++) {
        const srcRow = y * srcStride
        for (let x = 0; x < srcW; x++) {
            const dstX = y
            const dstY = srcW - 1 - x
            const srcOff = srcRow + x * 3
            const dstOff = dstY * dstStride + dstX * 3
            dst[dstOff] = src[srcOff]
            dst[dstOff + 1] = src[srcOff + 1]
            dst[dstOff + 2] = src[srcOff + 2]
        }
    }
    return { data: dst.buffer, w: dstW, h: dstH, stride: dstStride }
}

let _mupdfPromise: Promise<MuPdfModule> | null = null

async function loadMuPdf(): Promise<MuPdfModule> {
    if (_mupdfPromise) return _mupdfPromise
    _mupdfPromise = (async () => {
        logger.log('[worker] loadMuPdf: wasmUrl=' + wasmUrl)
        const resp = await fetch(wasmUrl)
        logger.log('[worker] fetch done, status=' + resp.status)
        const headers: string[] = []
        resp.headers.forEach((v, k) => headers.push(k + ': ' + v))
        logger.log('[worker] response headers:', headers.join(', '))
        const wasmBinary = await resp.arrayBuffer()
        logger.log('[worker] wasm binary size=' + wasmBinary.byteLength)
        globalThis.$libmupdf_wasm_Module = { wasmBinary, locateFile: (p) => p }
        logger.log('[worker] importing mupdf.js...')
        const mod = await import('quickwin/vendor/mupdf-wasm/mupdf.js')
        logger.log('[worker] MuPDF loaded')
        return mod.default
    })()
    return _mupdfPromise
}

function renderPdfPageToDib(mupdf: MuPdfModule, doc: Document, pageIndex: number, scale: number): DibResult | null {
    let page: Page | null = null
    let pixmap: Pixmap | null = null
    try {
        page = doc.loadPage(pageIndex)
        pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false)
        if (!pixmap) return null

        const srcPixels = pixmap.getPixels()
        const srcStride = pixmap.getStride()
        const w = pixmap.getWidth()
        const h = pixmap.getHeight()
        const dibStride = Math.floor((w * 3 + 3) / 4) * 4
        const dib = new Uint8Array(h * dibStride)

        for (let y = 0; y < h; y++) {
            const srcOff = y * srcStride
            const dstOff = y * dibStride
            for (let x = 0; x < w; x++) {
                const sx = srcOff + x * 3
                const dx = dstOff + x * 3
                dib[dx] = srcPixels[sx + 2]
                dib[dx + 1] = srcPixels[sx + 1]
                dib[dx + 2] = srcPixels[sx]
            }
        }

        return { data: dib.buffer, w, h, stride: dibStride }
    } catch (e: unknown) {
        logger.log('[worker] renderPdfPageToDib error page=' + pageIndex + ':', e instanceof Error ? e.stack : String(e))
        return null
    } finally {
        if (pixmap) try { pixmap.destroy() } catch {}
        if (page) try { page.destroy() } catch {}
    }
}

async function printPdf(pdfBuf: ArrayBuffer, printerName: string, duplex: boolean, tumble: boolean): Promise<boolean> {
    logger.log('[worker] printPdf:', printerName, 'duplex:', duplex, 'tumble:', tumble)

    const mupdf = await loadMuPdf()

    const printerNameBuf = strToWideBuf(printerName)

    const hdc = ffiCall(
        CreateDCW,
        [FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
        [null, printerNameBuf, null, null],
        FFI_TYPE_UINT64
    )

    if (!hdc) {
        logger.log('[worker] CreateDCW failed for printer "' + printerName + '", GLE=' + gle())
        return false
    }

    const _wspool = win.LoadLibrary('winspool.drv')
    let hPrinter = 0
    let devmodeBuf: ArrayBuffer | null = null
    let DocumentPropertiesW: number | null = 0
    let ClosePrinter: number | null = 0

    if (_wspool) {
        const OpenPrinterW = win.GetProcAddress(_wspool, 'OpenPrinterW')
        DocumentPropertiesW = win.GetProcAddress(_wspool, 'DocumentPropertiesW')
        ClosePrinter = win.GetProcAddress(_wspool, 'ClosePrinter')
        if (OpenPrinterW && DocumentPropertiesW && ClosePrinter) {
            const hPrinterBuf = new ArrayBuffer(8)
            const openRet = ffiCall(
                OpenPrinterW,
                [FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER],
                [printerNameBuf, hPrinterBuf, null],
                FFI_TYPE_SINT32
            )
            if (openRet) {
                const hpDv = new DataView(hPrinterBuf)
                hPrinter = hpDv.getUint32(0, true) + hpDv.getUint32(4, true) * 4294967296

                const dmSize = ffiCall(
                    DocumentPropertiesW,
                    [FFI_TYPE_UINT64, FFI_TYPE_UINT64, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
                    [0, hPrinter, printerNameBuf, null, null, 0],
                    FFI_TYPE_SINT32
                )

                if (dmSize > 0) {
                    devmodeBuf = new ArrayBuffer(dmSize)
                } else {
                    logger.log('[worker] DocumentPropertiesW size query failed, dmSize=' + dmSize + ' GLE=' + gle())
                    DocumentPropertiesW = 0
                }
            } else {
                logger.log('[worker] OpenPrinterW failed for "' + printerName + '", GLE=' + gle())
            }
        }
    }

    let paperW = ffiCall(GetDeviceCaps, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, HORZRES], FFI_TYPE_SINT32)
    let paperH = ffiCall(GetDeviceCaps, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, VERTRES], FFI_TYPE_SINT32)
    const dpiX = ffiCall(GetDeviceCaps, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, LOGPIXELSX], FFI_TYPE_SINT32)
    const dpiY = ffiCall(GetDeviceCaps, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, LOGPIXELSY], FFI_TYPE_SINT32)
    logger.log('[worker] paper:', paperW, 'x', paperH, 'dpi:', dpiX, 'x', dpiY)
    if (paperW <= 0 || paperH <= 0 || dpiX <= 0 || dpiY <= 0) {
        logger.log('[worker] WARNING: invalid paper/dpi from GetDeviceCaps')
        ffiCall(DeleteDC, [FFI_TYPE_UINT64], [hdc], FFI_TYPE_SINT32)
        return false
    }

    const duplexVal: number = duplex ? (tumble ? 3 : 2) : 1
    if (devmodeBuf && hPrinter && DocumentPropertiesW) {
        const outRet = ffiCall(
            DocumentPropertiesW,
            [FFI_TYPE_UINT64, FFI_TYPE_UINT64, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
            [0, hPrinter, printerNameBuf, devmodeBuf, null, gui.DevMode.OUT_BUFFER],
            FFI_TYPE_SINT32
        )
        if (outRet > 0) {
            const dv = new DataView(devmodeBuf)
            dv.setUint32(72, dv.getUint32(72, true) | gui.DevMode.DUPLEX, true)
            dv.setUint16(94, duplexVal, true)
            const dmRet = ffiCall(
                DocumentPropertiesW,
                [FFI_TYPE_UINT64, FFI_TYPE_UINT64, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_UINT32],
                [0, hPrinter, printerNameBuf, devmodeBuf, devmodeBuf, 10],
                FFI_TYPE_SINT32
            )
            if (dmRet > 0) {
                const resetHdc = ffiCall(
                    ResetDCW,
                    [FFI_TYPE_UINT64, FFI_TYPE_POINTER],
                    [hdc, devmodeBuf],
                    FFI_TYPE_UINT64
                )
                if (resetHdc) {
                    paperW = ffiCall(GetDeviceCaps, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, HORZRES], FFI_TYPE_SINT32)
                    paperH = ffiCall(GetDeviceCaps, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, VERTRES], FFI_TYPE_SINT32)
                } else {
                    logger.log('[worker] ResetDCW duplex failed, GLE=' + gle())
                }
            } else {
                logger.log('[worker] DocumentPropertiesW validation failed, ret=' + dmRet + ' GLE=' + gle())
            }
        } else {
            logger.log('[worker] DocumentPropertiesW init failed, ret=' + outRet + ' GLE=' + gle())
        }
    }

    const docNameBuf = strToWideBuf('SuperPrint')
    const docNamePtr = bufferPtr(docNameBuf)

    const docInfo = new ArrayBuffer(40)
    const docInfoView = new DataView(docInfo)
    docInfoView.setUint32(0, 40, true)
    docInfoView.setUint32(4, 0, true)
    docInfoView.setBigUint64(8, BigInt(docNamePtr), true)
    docInfoView.setBigUint64(16, 0n, true)
    docInfoView.setBigUint64(24, 0n, true)
    docInfoView.setUint32(32, 0, true)
    docInfoView.setUint32(36, 0, true)

    const docRet = ffiCall(
        StartDocW,
        [FFI_TYPE_UINT64, FFI_TYPE_POINTER],
        [hdc, docInfo],
        FFI_TYPE_SINT32
    )

    if (docRet <= 0) {
        logger.log('[worker] StartDocW failed, ret=' + docRet + ' GLE=' + gle())
        const ddRet = ffiCall(DeleteDC, [FFI_TYPE_UINT64], [hdc], FFI_TYPE_SINT32)
        logger.log('[worker] DeleteDC (startdoc fail path) returned:', ddRet)
        if (hPrinter && ClosePrinter) ffiCall(ClosePrinter, [FFI_TYPE_UINT64], [hPrinter], FFI_TYPE_SINT32)
        return false
    }

    let doc: Document | null = null
    try {
        doc = mupdf.Document.openDocument(new Uint8Array(pdfBuf), 'application/pdf')
        const totalPages = doc.countPages()
        logger.log('[worker] PDF pages:', totalPages)

        const scale = RENDER_DPI / 72

        for (let i = 0; i < totalPages; i++) {
            logger.log('[worker] page ' + (i + 1) + '/' + totalPages)
            const spRet = ffiCall(StartPage, [FFI_TYPE_UINT64], [hdc], FFI_TYPE_SINT32)
            if (spRet <= 0) {
                logger.log('[worker] StartPage failed, ret=' + spRet + ' GLE=' + gle())
            }
            ffiCall(SetStretchBltMode, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, 4], FFI_TYPE_SINT32)
            ffiCall(SetBrushOrgEx, [FFI_TYPE_UINT64, FFI_TYPE_SINT32, FFI_TYPE_SINT32, FFI_TYPE_POINTER], [hdc, 0, 0, null], FFI_TYPE_SINT32)
            try {
                let t0 = Date.now()
                const dib = renderPdfPageToDib(mupdf, doc, i, scale)
                let t1 = Date.now()
                if (dib) {
                    logger.log('[worker] page ' + i + ' render: ' + (t1 - t0) + 'ms (' + dib.w + 'x' + dib.h + ')')
                    const paperW = ffiCall(GetDeviceCaps, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, HORZRES], FFI_TYPE_SINT32)
                    const paperH = ffiCall(GetDeviceCaps, [FFI_TYPE_UINT64, FFI_TYPE_SINT32], [hdc, VERTRES], FFI_TYPE_SINT32)
                    const isLandscape = dib.w > dib.h

                    const finalW = isLandscape ? dib.h : dib.w
                    const finalH = isLandscape ? dib.w : dib.h
                    const scaleX = paperW / finalW
                    const scaleY = paperH / finalH
                    const sc = scaleX < scaleY ? scaleX : scaleY
                    const drawW = Math.floor(finalW * sc)
                    const drawH = Math.floor(finalH * sc)
                    const drawX = Math.floor((paperW - drawW) / 2)
                    const drawY = Math.floor((paperH - drawH) / 2)

                    logger.log('[worker] page ' + i + ':', dib.w + 'x' + dib.h, isLandscape ? 'landscape' : 'portrait', 'paper:', paperW + 'x' + paperH, 'draw:', drawW + 'x' + drawH, 'at', drawX + ',' + drawY)

                    if (isLandscape) {
                        t0 = Date.now()
                        const rotated = rotatePixels90(new Uint8Array(dib.data), dib.w, dib.h, dib.stride)
                        t1 = Date.now()
                        logger.log('[worker] page ' + i + ' rotate: ' + (t1 - t0) + 'ms')
                        const bmi = makeBitmapInfo(rotated.w, rotated.h)
                        t0 = Date.now()
                        const sdRet = ffiCall(StretchDIBits, [
                            FFI_TYPE_UINT64, FFI_TYPE_SINT32, FFI_TYPE_SINT32,
                            FFI_TYPE_SINT32, FFI_TYPE_SINT32,
                            FFI_TYPE_SINT32, FFI_TYPE_SINT32,
                            FFI_TYPE_SINT32, FFI_TYPE_SINT32,
                            FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_UINT32,
                            FFI_TYPE_UINT32
                        ], [
                            hdc, drawX, drawY, drawW, drawH,
                            0, 0, rotated.w, rotated.h,
                            rotated.data, bmi, 0, gui.RasterOp.SRCCOPY
                        ], FFI_TYPE_SINT32)
                        t1 = Date.now()
                        logger.log('[worker] page ' + i + ' stretch: ' + (t1 - t0) + 'ms')
                        if (sdRet <= 0) {
                            logger.log('[worker] StretchDIBits (rotated) failed for page ' + i + ', ret=' + sdRet + ' GLE=' + gle())
                        }
                    } else {
                        const bmi = makeBitmapInfo(dib.w, dib.h)
                        t0 = Date.now()
                        const sdRet = ffiCall(StretchDIBits, [
                            FFI_TYPE_UINT64, FFI_TYPE_SINT32, FFI_TYPE_SINT32,
                            FFI_TYPE_SINT32, FFI_TYPE_SINT32,
                            FFI_TYPE_SINT32, FFI_TYPE_SINT32,
                            FFI_TYPE_SINT32, FFI_TYPE_SINT32,
                            FFI_TYPE_POINTER, FFI_TYPE_POINTER, FFI_TYPE_UINT32,
                            FFI_TYPE_UINT32
                        ], [
                            hdc, drawX, drawY, drawW, drawH,
                            0, 0, dib.w, dib.h,
                            dib.data, bmi, 0, gui.RasterOp.SRCCOPY
                        ], FFI_TYPE_SINT32)
                        t1 = Date.now()
                        logger.log('[worker] page ' + i + ' stretch: ' + (t1 - t0) + 'ms')
                        if (sdRet <= 0) {
                            logger.log('[worker] StretchDIBits failed for page ' + i + ', ret=' + sdRet + ' GLE=' + gle())
                        }
                    }
                } else {
                    logger.log('[worker] page ' + i + ' render failed')
                }
            } catch (e: unknown) {
                logger.log('[worker] page ' + i + ' error:', e instanceof Error ? e.stack : String(e))
            }
            const epRet = ffiCall(EndPage, [FFI_TYPE_UINT64], [hdc], FFI_TYPE_SINT32)
            if (epRet <= 0) {
                logger.log('[worker] EndPage failed, ret=' + epRet + ' GLE=' + gle())
            }
        }
    } catch (e: unknown) {
        logger.log('[worker] PDF processing error:', e instanceof Error ? e.stack : String(e))
        const edRet = ffiCall(EndDoc, [FFI_TYPE_UINT64], [hdc], FFI_TYPE_SINT32)
        if (edRet <= 0) logger.log('[worker] EndDoc on error path failed, ret=' + edRet + ' GLE=' + gle())
        logger.log('[worker] calling DeleteDC (error path)')
        const ddRet = ffiCall(DeleteDC, [FFI_TYPE_UINT64], [hdc], FFI_TYPE_SINT32)
        logger.log('[worker] DeleteDC (error path) returned:', ddRet, 'GLE=' + gle())
        if (hPrinter && ClosePrinter) ffiCall(ClosePrinter, [FFI_TYPE_UINT64], [hPrinter], FFI_TYPE_SINT32)
        if (doc) try { doc.destroy() } catch {}
        return false
    }

    const edRet = ffiCall(EndDoc, [FFI_TYPE_UINT64], [hdc], FFI_TYPE_SINT32)
    if (edRet <= 0) logger.log('[worker] EndDoc failed, ret=' + edRet + ' GLE=' + gle())
    logger.log('[worker] calling DeleteDC (success path)')
    const ddRet = ffiCall(DeleteDC, [FFI_TYPE_UINT64], [hdc], FFI_TYPE_SINT32)
    logger.log('[worker] DeleteDC (success path) returned:', ddRet, 'GLE=' + gle())
    if (hPrinter && ClosePrinter) ffiCall(ClosePrinter, [FFI_TYPE_UINT64], [hPrinter], FFI_TYPE_SINT32)
    if (doc) try { doc.destroy() } catch {}

    logger.log('[worker] printPdf done')
    return true
}

loadMuPdf().catch((e: unknown) => logger.log('[worker] loadMuPdf error:', e instanceof Error ? e.stack : String(e)))

os.Worker.parent.onmessage = async (e: { data: WorkerInMsg }) => {
    const msg = e.data
    if (msg.type === 'print') {
        try {
            logger.log('[worker] downloading file:', msg.fileId + '.pdf')
            const res = await api.files.getFile(msg.fileId + '.pdf')
            logger.log('[worker] download response:', res?.status, res?.ok)
            if (!res || !res.ok) {
                throw new Error('download failed: ' + (res?.status || 'no response'))
            }
            const pdfBuf = await res.arrayBuffer()
            if (pdfBuf.byteLength === 0) throw new Error('downloaded PDF is empty')
            const success = await printPdf(pdfBuf, msg.printerName, msg.duplex, msg.tumble)
            const out: WorkerOutMsg = { type: 'done', jobId: msg.jobId, success }
            os.Worker.parent.postMessage(out)
        } catch (e2: unknown) {
            logger.log('[worker] print error job=' + msg.jobId + ':', e2 instanceof Error ? e2.stack : String(e2))
            const out: WorkerOutMsg = { type: 'done', jobId: msg.jobId, success: false }
            os.Worker.parent.postMessage(out)
        }
    } else if (msg.type === 'done') {
        os.Worker.parent.onmessage = null
    }
}
