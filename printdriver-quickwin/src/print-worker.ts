import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as os from 'os'
import * as ffi from 'ffi'
import * as win from 'win'
import type { Document, Page, Pixmap } from 'quickwin/vendor/mupdf-wasm/mupdf.js'
type MuPdfModule = typeof import('quickwin/vendor/mupdf-wasm/mupdf.js').default

const wasmUrl = new URL('../node_modules/quickwin/vendor/mupdf-wasm/mupdf-wasm.wasm', import.meta.url).href

const _gdi32 = win.LoadLibrary('gdi32.dll')
const CreateDCW = (_gdi32 ? win.GetProcAddress(_gdi32, 'CreateDCW') : 0) as number
const DeleteDC = (_gdi32 ? win.GetProcAddress(_gdi32, 'DeleteDC') : 0) as number
const StartDocW = (_gdi32 ? win.GetProcAddress(_gdi32, 'StartDocW') : 0) as number
const EndDoc = (_gdi32 ? win.GetProcAddress(_gdi32, 'EndDoc') : 0) as number
const StartPage = (_gdi32 ? win.GetProcAddress(_gdi32, 'StartPage') : 0) as number
const EndPage = (_gdi32 ? win.GetProcAddress(_gdi32, 'EndPage') : 0) as number
const GetDeviceCaps = (_gdi32 ? win.GetProcAddress(_gdi32, 'GetDeviceCaps') : 0) as number
const StretchDIBits = (_gdi32 ? win.GetProcAddress(_gdi32, 'StretchDIBits') : 0) as number

const HORZRES = 8
const VERTRES = 10
const LOGPIXELSX = 88
const LOGPIXELSY = 90

interface DibResult {
    data: ArrayBuffer
    w: number
    h: number
}

function strToWideBuf(str: string): ArrayBuffer {
    const buf = new ArrayBuffer((str.length + 1) * 2)
    const dv = new DataView(buf)
    for (let i = 0; i < str.length; i++) {
        dv.setUint16(i * 2, str.charCodeAt(i), true)
    }
    dv.setUint16(str.length * 2, 0, true)
    return buf
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

let _mupdfPromise: Promise<MuPdfModule> | null = null

async function loadMuPdf(): Promise<MuPdfModule> {
    if (_mupdfPromise) return _mupdfPromise
    _mupdfPromise = (async () => {
        console.log('[worker] loadMuPdf: wasmUrl=' + wasmUrl)
        const resp = await fetch(wasmUrl)
        console.log('[worker] fetch done, status=' + resp.status)
        const wasmBinary = await resp.arrayBuffer()
        console.log('[worker] wasm binary size=' + wasmBinary.byteLength)
        ;(globalThis).$libmupdf_wasm_Module = { wasmBinary, locateFile: (p: string) => p }
        console.log('[worker] importing mupdf.js...')
        const mod = await import('quickwin/vendor/mupdf-wasm/mupdf.js')
        console.log('[worker] MuPDF loaded')
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

        return { data: dib.buffer, w, h }
    } catch (e) {
        console.log('[worker] renderPdfPageToDib error:', '' + e)
        return null
    } finally {
        if (pixmap) try { pixmap.destroy() } catch {}
        if (page) try { page.destroy() } catch {}
    }
}

async function printPdf(pdfBuf: ArrayBuffer, printerName: string, duplex: boolean, tumble: boolean): Promise<boolean> {
    console.log('[worker] printPdf:', printerName, 'duplex:', duplex, 'tumble:', tumble)

    const mupdf = await loadMuPdf()
    if (!mupdf) {
        console.log('[worker] MuPDF not available')
        return false
    }

    if (!CreateDCW || !StartDocW || !EndDoc || !StartPage || !EndPage || !DeleteDC || !GetDeviceCaps || !StretchDIBits) {
        console.log('[worker] GDI functions not available')
        return false
    }

    const printerNameBuf = strToWideBuf(printerName)

    const hdc = ffi.ffiCall(
        CreateDCW,
        [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [null, printerNameBuf, null, null],
        ffi.FFI_TYPE_UINT64
    ) as number

    if (!hdc) {
        console.log('[worker] CreateDC failed')
        return false
    }

    const paperW = ffi.ffiCall(GetDeviceCaps, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32], [hdc, HORZRES], ffi.FFI_TYPE_SINT32) as number
    const paperH = ffi.ffiCall(GetDeviceCaps, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32], [hdc, VERTRES], ffi.FFI_TYPE_SINT32) as number
    const dpiX = ffi.ffiCall(GetDeviceCaps, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32], [hdc, LOGPIXELSX], ffi.FFI_TYPE_SINT32) as number
    const dpiY = ffi.ffiCall(GetDeviceCaps, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32], [hdc, LOGPIXELSY], ffi.FFI_TYPE_SINT32) as number
    console.log('[worker] paper:', paperW, 'x', paperH, 'dpi:', dpiX, 'x', dpiY)

    const docNameBuf = strToWideBuf('SuperPrint')
    const docNamePtr = ffi.bufferPtr(docNameBuf)

    const docInfo = new ArrayBuffer(40)
    const docInfoView = new DataView(docInfo)
    docInfoView.setUint32(0, 40, true)
    docInfoView.setUint32(4, 0, true)
    docInfoView.setBigUint64(8, BigInt(docNamePtr), true)
    docInfoView.setBigUint64(16, 0n, true)
    docInfoView.setBigUint64(24, 0n, true)
    docInfoView.setUint32(32, 0, true)
    docInfoView.setUint32(36, 0, true)

    const docRet = ffi.ffiCall(
        StartDocW,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER],
        [hdc, docInfo],
        ffi.FFI_TYPE_SINT32
    ) as number

    if (docRet <= 0) {
        ffi.ffiCall(DeleteDC, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_VOID)
        return false
    }

    let doc: Document | null = null
    try {
        doc = mupdf.Document.openDocument(new Uint8Array(pdfBuf), 'application/pdf')
        const totalPages = doc.countPages()
        console.log('[worker] PDF pages:', totalPages)

        const dpi = Math.min(dpiX, dpiY)
        const scale = dpi / 72

        for (let i = 0; i < totalPages; i++) {
            ffi.ffiCall(StartPage, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_SINT32)
            try {
                const dib = renderPdfPageToDib(mupdf, doc, i, scale)
                if (dib) {
                    const bmi = makeBitmapInfo(dib.w, dib.h)
                    ffi.ffiCall(StretchDIBits, [
                        ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32,
                        ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32,
                        ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32,
                        ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32,
                        ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32,
                        ffi.FFI_TYPE_UINT32
                    ], [
                        hdc, 0, 0, paperW, paperH,
                        0, 0, dib.w, dib.h,
                        dib.data, bmi, 0, 0x00CC0020
                    ], ffi.FFI_TYPE_SINT32)
                } else {
                    console.log('[worker] page', i, 'render failed')
                }
            } catch (e) {
                console.log('[worker] page', i, 'error:', '' + e)
            }
            ffi.ffiCall(EndPage, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_SINT32)
        }
    } catch (e) {
        console.log('[worker] PDF processing error:', '' + e)
        ffi.ffiCall(EndDoc, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_SINT32)
        ffi.ffiCall(DeleteDC, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_VOID)
        if (doc) try { doc.destroy() } catch {}
        return false
    }

    ffi.ffiCall(EndDoc, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_SINT32)
    ffi.ffiCall(DeleteDC, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_VOID)
    if (doc) try { doc.destroy() } catch {}

    console.log('[worker] printPdf done')
    return true
}

loadMuPdf().catch(e => console.log('[worker] loadMuPdf error: ' + (e?.message || e)))

os.Worker.parent.onmessage = async (e: any) => {
    const msg = e.data
    if (msg.type === 'print') {
        try {
            const success = await printPdf(msg.pdfBuf, msg.printerName, msg.duplex, msg.tumble)
            os.Worker.parent.postMessage({ type: 'done', jobId: msg.jobId, success })
        } catch (e2: any) {
            console.log('[worker] print error: ' + (e2?.message || e2))
            os.Worker.parent.postMessage({ type: 'done', jobId: msg.jobId, success: false })
        }
    } else if (msg.type === 'done') {
        os.Worker.parent.onmessage = null
    }
}
