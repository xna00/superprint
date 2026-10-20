import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as std from 'std'
import * as os from 'os'
import { bufferPtr, LoadLibrary } from 'ffi'
import { NULL, PtrArrayBuffer } from 'quickwin/lib/ffi/ctype.js'
import type { MaybePtr, Ptr } from 'quickwin/lib/ffi/ctype.js'
import { bind, BYTE, WCHAR } from 'quickwin/lib/ffi/bind.js'
import { BITMAPINFOHEADER, DEVMODEW, DOCINFOW } from 'quickwin/lib/windows/structs.js'
import { GetLastError, RtlMoveMemory } from 'quickwin/lib/windows/kernel32.js'
import { ClosePrinter, DocumentProperties, OpenPrinter } from 'quickwin/lib/windows/winspool.js'
import {
    CreateDC, DeleteDC, EndDoc, EndPage, GetDeviceCaps, ResetDC, SetBrushOrgEx,
    SetStretchBltMode, StartDoc, StartPage, StretchDIBits,
} from 'quickwin/lib/windows/gdi32.js'
import { ColorUse, DeviceCap, DmField, DmModeFlag, RasterOp, StretchBltMode } from 'quickwin/constants'
import { getExePath, readPtr } from './utils.js'
import { FpdfRenderFlag, FpdfRotate } from './pdfium-enum.js'
import type { Document, Page, Pixmap } from '@quickwinlabs/mupdf-wasm'
import type { WorkerInMsg, WorkerOutMsg } from './worker-types.js'
import { api } from './api.js'
import { logger } from './logger.js'
import mupdfWasmUrl from '@quickwinlabs/mupdf-wasm/mupdf-wasm.wasm?url'
type MuPdfModule = typeof import('@quickwinlabs/mupdf-wasm')

const wasmUrl = mupdfWasmUrl

const HORZRES = DeviceCap.HORZRES
const VERTRES = DeviceCap.VERTRES
const LOGPIXELSX = DeviceCap.LOGPIXELSX
const LOGPIXELSY = DeviceCap.LOGPIXELSY

interface DibResult {
    data: PtrArrayBuffer<''>
    w: number
    h: number
}

/** BI_RGB 顶向下 DIB（biHeight 取负）——与 quickwin 例子 PdfCanvas.tsx 同型 */
function makeBitmapInfo(w: number, h: number, bpp: number) {
    return BITMAPINFOHEADER.encode({
        biSize: BITMAPINFOHEADER.size, biWidth: w, biHeight: -h,
        biPlanes: 1, biBitCount: bpp,
    })
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
        // 包是命名导出（无 default），import() 直接给到 module namespace
        const mod = await import('@quickwinlabs/mupdf-wasm')
        logger.log('[worker] MuPDF loaded')
        return mod
    })()
    return _mupdfPromise
}

function renderPdfPageToDib(mupdf: MuPdfModule, doc: Document, pageIndex: number, scale: number, rotate90: boolean): DibResult | null {
    let page: Page | null = null
    let pixmap: Pixmap | null = null
    try {
        page = doc.loadPage(pageIndex)
        let ctm = mupdf.Matrix.scale(scale, scale)
        if (rotate90) {
            ctm = mupdf.Matrix.concat(mupdf.Matrix.rotate(-90), ctm)
        }
        pixmap = page.toPixmap(ctm, mupdf.ColorSpace.DeviceRGB, false)
        if (!pixmap) return null

        const srcPixels = pixmap.getPixels()
        const srcStride = pixmap.getStride()
        const w = pixmap.getWidth()
        const h = pixmap.getHeight()
        const dibStride = Math.floor((w * 3 + 3) / 4) * 4
        const dib = BYTE.alloc(h * dibStride)
        const dst = new Uint8Array(dib)

        for (let y = 0; y < h; y++) {
            const srcOff = y * srcStride
            const dstOff = y * dibStride
            for (let x = 0; x < w; x++) {
                const sx = srcOff + x * 3
                const dx = dstOff + x * 3
                dst[dx] = srcPixels[sx + 2]
                dst[dx + 1] = srcPixels[sx + 1]
                dst[dx + 2] = srcPixels[sx]
            }
        }

        return { data: dib, w, h }
    } catch (e: unknown) {
        logger.log('[worker] renderPdfPageToDib error page=' + pageIndex + ':', e instanceof Error ? e.stack : String(e))
        return null
    } finally {
        if (pixmap) try { pixmap.destroy() } catch {}
        if (page) try { page.destroy() } catch {}
    }
}

// ---------------------------------------------------------------------------
// PDFium（DLL 是运行时下载的，不能模块加载期 bind —— 惰性绑定）
// ---------------------------------------------------------------------------

const PDFIUM_DLL = 'pdfium-win32-x64-chromium7947.dll'
const pdfiumDllUrl = new URL('../vendor/pdfium-win32-x64-chromium7947.dll', import.meta.url).href

/** PDFium C API：FPDF_DOCUMENT / FPDF_PAGE / FPDF_BITMAP 在 C 侧都是 void*，
 *  这里各打一个品牌把三者分开（doc/page/bitmap 串用编译期就报错）。品牌不花代价：
 *  运行时返回位只在 name 有 decode 时才转码，BYTE 无 decode → 原样给回地址 number。
 *  取像素缓冲的位用 <BYTE>ptr（FPDFBitmap_GetBuffer 返回的就该是「能进
 *  RtlMoveMemory <BYTE>ptr 位的那个类型」，品牌在这里表达比调用点 cast 干净）。 */
async function loadPdfium() {
    logger.log('[worker] initPDFium: downloading pdfium DLL from', pdfiumDllUrl)
    const resp = await fetch(pdfiumDllUrl)
    if (!resp.ok) throw new Error('download PDFium DLL failed: ' + resp.status)
    const buf = await resp.arrayBuffer()
    const exeDir = getExePath().split('\\').slice(0, -1).join('\\')
    const localPath = exeDir + '\\' + PDFIUM_DLL
    const f = std.open(localPath, 'wb')
    if (!f) throw new Error('cannot open ' + localPath + ' for writing')
    f.write(buf, 0, buf.byteLength)
    f.close()
    logger.log('[worker] PDFium DLL saved to', localPath)
    if (!LoadLibrary(PDFIUM_DLL)) throw new Error('LoadLibrary failed for ' + PDFIUM_DLL)

    // bind 内部按 DLL 名 LoadLibrary（有缓存），与上面是同一个已加载模块
    const pdfium = {
        initLibrary: bind(PDFIUM_DLL, 'FPDF_InitLibrary', ' -> void'),
        destroyLibrary: bind(PDFIUM_DLL, 'FPDF_DestroyLibrary', ' -> void'),
        loadMemDocument: bind(PDFIUM_DLL, 'FPDF_LoadMemDocument', '<>ptr i32 <>ptr -> <FPDF_DOCUMENT>ptr'),
        closeDocument: bind(PDFIUM_DLL, 'FPDF_CloseDocument', '<FPDF_DOCUMENT>ptr -> void'),
        getPageCount: bind(PDFIUM_DLL, 'FPDF_GetPageCount', '<FPDF_DOCUMENT>ptr -> i32'),
        loadPage: bind(PDFIUM_DLL, 'FPDF_LoadPage', '<FPDF_DOCUMENT>ptr i32 -> <FPDF_PAGE>ptr'),
        closePage: bind(PDFIUM_DLL, 'FPDF_ClosePage', '<FPDF_PAGE>ptr -> void'),
        getPageSizeByIndex: bind(PDFIUM_DLL, 'FPDF_GetPageSizeByIndex', '<FPDF_DOCUMENT>ptr i32 <>ptr <>ptr -> i32'),
        bitmapCreate: bind(PDFIUM_DLL, 'FPDFBitmap_Create', 'i32 i32 i32 -> <FPDF_BITMAP>ptr'),
        bitmapDestroy: bind(PDFIUM_DLL, 'FPDFBitmap_Destroy', '<FPDF_BITMAP>ptr -> void'),
        bitmapFillRect: bind(PDFIUM_DLL, 'FPDFBitmap_FillRect', '<FPDF_BITMAP>ptr i32 i32 i32 i32 u32 -> void'),
        bitmapGetBuffer: bind(PDFIUM_DLL, 'FPDFBitmap_GetBuffer', '<FPDF_BITMAP>ptr -> <BYTE>ptr'),
        bitmapGetStride: bind(PDFIUM_DLL, 'FPDFBitmap_GetStride', '<FPDF_BITMAP>ptr -> i32'),
        // C 侧 8 参：(bmp, page, start_x, start_y, size_x, size_y, rotate, flags)。
        // start/size 都是位图像素坐标；rotate 挂 EnumMap 收窄到 0..3；flags 是位掩码，
        // 值域列不全（A|B 会塌成 number 过不了 enum 检查），保持裸 i32。
        renderPageBitmap: bind(PDFIUM_DLL, 'FPDF_RenderPageBitmap', '<FPDF_BITMAP>ptr <FPDF_PAGE>ptr i32 i32 i32 i32 i32@FpdfRotate i32 -> void'),
    }
    pdfium.initLibrary()
    logger.log('[worker] PDFium initialized')
    return pdfium
}

type Pdfium = Awaited<ReturnType<typeof loadPdfium>>

let _pdfiumInit: Promise<Pdfium> | null = null

function initPDFium(): Promise<Pdfium> {
    if (!_pdfiumInit) _pdfiumInit = loadPdfium()
    return _pdfiumInit
}

function renderPdfPageWithPDFium(pdfium: Pdfium, doc: MaybePtr<'FPDF_DOCUMENT'>, pageIndex: number, scale: number, pageW: number, pageH: number): DibResult | null {
    let page: MaybePtr<'FPDF_PAGE'> = NULL
    let bmp: MaybePtr<'FPDF_BITMAP'> = NULL
    try {
        page = pdfium.loadPage(doc, pageIndex)
        if (!page) return null

        // 横版页把位图建成竖版尺寸，再让 PDFium 自己转 90°（rotate=3 = 逆时针），
        // 最后靠 centerAndStretch 的等比缩放铺到纵向纸面
        const isLandscape = pageW > pageH
        const bmpW = isLandscape ? (pageH * scale) | 0 : (pageW * scale) | 0
        const bmpH = isLandscape ? (pageW * scale) | 0 : (pageH * scale) | 0
        const rotate = isLandscape ? FpdfRotate.CCW90 : FpdfRotate.NORMAL

        // format=0 → PDFium 实际给 32-bit BGRA（vendor 这份 build 实测 stride = w*4），
        // 正是 BI_RGB 32 位 DIB 期望的 B,G,R,X 顺序，无需逐像素转换。
        bmp = pdfium.bitmapCreate(bmpW, bmpH, 0)
        if (!bmp) return null

        pdfium.bitmapFillRect(bmp, 0, 0, bmpW, bmpH, 0xFFFFFFFF)
        // flags 只开 FPDF_PRINTING：打印质量路径，开图像重采样和文字 hinting。
        // 绝不能带上 REVERSE_BYTE_ORDER(0x10)——它把位图输出翻成 R,G,B,X，和 BI_RGB 的
        // B,G,R,X 正好相反，打印出来蓝红互换、青变黄（实测同一份纯蓝内容：带 0x10 读回
        // 0xffff0000，不带读回 0xff0000ff）。98aec6d 当年就是把 0x10 误当打印旗子塞进来的，
        // 那次提交信息里写的 FPDF_RENDER_PRINTING 其实叫 FPDF_PRINTING，值是 0x800。
        pdfium.renderPageBitmap(bmp, page, 0, 0, bmpW, bmpH, rotate, FpdfRenderFlag.PRINTING)

        const stride = pdfium.bitmapGetStride(bmp)
        const srcPtr = pdfium.bitmapGetBuffer(bmp)
        if (!srcPtr) return null

        // native → JS 单次拷贝：bitmapGetBuffer 的品牌就是 <BYTE>ptr，直接进 RtlMoveMemory 的源位
        const pixelSize = bmpH * stride
        const pixelBuf = BYTE.alloc(pixelSize)
        RtlMoveMemory(pixelBuf.ptr, srcPtr, pixelSize)
        return { data: pixelBuf, w: bmpW, h: bmpH }
    } finally {
        if (bmp) pdfium.bitmapDestroy(bmp)
        if (page) pdfium.closePage(page)
    }
}

/** 等比缩放居中贴到打印 DC 上。use32bit 决定 DIB 位深（PDFium 出 32 位、MuPDF 出 24 位）。 */
function centerAndStretch(hdc: Ptr<'HDC'>, dib: DibResult, use32bit: boolean): boolean {
    const paperW = GetDeviceCaps(hdc, HORZRES)
    const paperH = GetDeviceCaps(hdc, VERTRES)
    const scaleX = paperW / dib.w
    const scaleY = paperH / dib.h
    const sc = scaleX < scaleY ? scaleX : scaleY
    const drawW = Math.floor(dib.w * sc)
    const drawH = Math.floor(dib.h * sc)
    const drawX = Math.floor((paperW - drawW) / 2)
    const drawY = Math.floor((paperH - drawH) / 2)
    const bmi = makeBitmapInfo(dib.w, dib.h, use32bit ? 32 : 24)
    const sdRet = StretchDIBits(
        hdc, drawX, drawY, drawW, drawH,
        0, 0, dib.w, dib.h,
        dib.data, bmi, ColorUse.RGB_COLORS, RasterOp.SRCCOPY,
    )
    return sdRet > 0
}

async function printPdf(pdfBuf: ArrayBuffer, printerName: string, duplex: boolean, tumble: boolean, renderEngine: string, renderDPI: number, docName: string): Promise<boolean> {
    logger.log('[worker] printPdf:', printerName, 'duplex:', duplex, 'tumble:', tumble, 'renderEngine:', renderEngine)

    const hdc = CreateDC('winspool', printerName, NULL, NULL)
    if (!hdc) {
        logger.log('[worker] CreateDC failed for printer "' + printerName + '", GLE=' + GetLastError())
        return false
    }

    let hPrinter = 0
    let devmodeBuf: PtrArrayBuffer<'DEVMODEW'> | null = null

    // 打开打印机，取一份 DEVMODE 用于改双面参数（失败则跳过，不影响打印）
    const hPrinterSlot = BYTE.alloc(8)
    if (OpenPrinter(printerName, hPrinterSlot, NULL)) {
        hPrinter = readPtr(new DataView(hPrinterSlot), 0)
        const dmSize = DocumentProperties(NULL, hPrinter, printerName, NULL, NULL, 0)
        if (dmSize > 0) {
            // dmSize 通常 > DEVMODEW.size（尾部是驱动私有的 DM DriverExtra 字段），按返回的大小
            // 精确分配——DEVMODEW.alloc(n) 是 n 个结构体（size*n 字节），这里要的是 n 字节。
            devmodeBuf = new PtrArrayBuffer<'DEVMODEW'>(dmSize)
        } else {
            logger.log('[worker] DocumentProperties size query failed, dmSize=' + dmSize + ' GLE=' + GetLastError())
        }
    } else {
        logger.log('[worker] OpenPrinterW failed for "' + printerName + '", GLE=' + GetLastError())
    }

    let paperW = GetDeviceCaps(hdc, HORZRES)
    let paperH = GetDeviceCaps(hdc, VERTRES)
    const dpiX = GetDeviceCaps(hdc, LOGPIXELSX)
    const dpiY = GetDeviceCaps(hdc, LOGPIXELSY)
    logger.log('[worker] paper:', paperW, 'x', paperH, 'dpi:', dpiX, 'x', dpiY)
    if (paperW <= 0 || paperH <= 0 || dpiX <= 0 || dpiY <= 0) {
        logger.log('[worker] WARNING: invalid paper/dpi from GetDeviceCaps')
        DeleteDC(hdc)
        return false
    }

    const duplexVal: number = duplex ? (tumble ? 3 : 2) : 1
    if (devmodeBuf && hPrinter) {
        const outRet = DocumentProperties(NULL, hPrinter, printerName, devmodeBuf.ptr, NULL, DmModeFlag.OUT_BUFFER)
        if (outRet > 0) {
            // 就地打补丁：dmFields |= DM_DUPLEX，dmDuplex = duplexVal（缺省字段跳过，
            // encode 带 buf 形态只写给到的字段，不清缓冲 → 尾部 DM DriverExtra 原样保留）
            const dm = DEVMODEW.decode(devmodeBuf)
            DEVMODEW.encode({ dmFields: dm.dmFields | DmField.DUPLEX, dmDuplex: duplexVal }, devmodeBuf)
            const dmRet = DocumentProperties(
                NULL, hPrinter, printerName, devmodeBuf.ptr, devmodeBuf.ptr,
                DmModeFlag.IN_BUFFER | DmModeFlag.OUT_BUFFER,
            )
            if (dmRet > 0) {
                const resetHdc = ResetDC(hdc, devmodeBuf.ptr)
                if (resetHdc) {
                    paperW = GetDeviceCaps(hdc, HORZRES)
                    paperH = GetDeviceCaps(hdc, VERTRES)
                } else {
                    logger.log('[worker] ResetDC duplex failed, GLE=' + GetLastError())
                }
            } else {
                logger.log('[worker] DocumentProperties validation failed, ret=' + dmRet + ' GLE=' + GetLastError())
            }
        } else {
            logger.log('[worker] DocumentProperties init failed, ret=' + outRet + ' GLE=' + GetLastError())
        }
    }

    // DOCINFOW：lpszDocName 走 WCHAR.encode 拿品牌化缓冲；两个缓冲都是 JS 持有的，
    // 须在 EndDoc 返回前保持引用（DOCINFOW 是纯入参位，只把地址写进参数槽）
    const docNameBuf = WCHAR.encode(docName || 'SuperPrint')
    const docInfo = DOCINFOW.encode({ cbSize: DOCINFOW.size, lpszDocName: docNameBuf.ptr, fwType: 0 })

    const docRet = StartDoc(hdc, docInfo.ptr)
    if (docRet <= 0) {
        logger.log('[worker] StartDocW failed, ret=' + docRet + ' GLE=' + GetLastError())
        const ddRet = DeleteDC(hdc)
        logger.log('[worker] DeleteDC (startdoc fail path) returned:', ddRet)
        if (hPrinter) ClosePrinter(hPrinter)
        return false
    }

    const scale = renderDPI / 72

    if (renderEngine === 'pdfium') {
        const pdfium = await initPDFium()

        const pdfDoc = pdfium.loadMemDocument(bufferPtr(pdfBuf), pdfBuf.byteLength, NULL)
        if (!pdfDoc) {
            logger.log('[worker] FPDF_LoadMemDocument failed')
            EndDoc(hdc)
            DeleteDC(hdc)
            if (hPrinter) ClosePrinter(hPrinter)
            return false
        }
        try {
            const totalPages = pdfium.getPageCount(pdfDoc)
            logger.log('[worker] PDF pages:', totalPages)

            for (let i = 0; i < totalPages; i++) {
                logger.log('[worker] page ' + (i + 1) + '/' + totalPages)
                const spRet = StartPage(hdc)
                if (spRet <= 0) logger.log('[worker] StartPage failed, ret=' + spRet + ' GLE=' + GetLastError())
                SetStretchBltMode(hdc, StretchBltMode.HALFTONE)
                SetBrushOrgEx(hdc, 0, 0, NULL)
                try {
                    let t0 = Date.now()
                    const sizeBuf = BYTE.alloc(16)
                    const ret = pdfium.getPageSizeByIndex(pdfDoc, i, sizeBuf.ptr, sizeBuf.ptr + 8)
                    if (ret <= 0) logger.log('[worker] page ' + i + ' GetPageSizeByIndex failed')
                    const sizeDv = new DataView(sizeBuf)
                    const pageW = sizeDv.getFloat64(0, true)
                    const pageH = sizeDv.getFloat64(8, true)
                    const dib = renderPdfPageWithPDFium(pdfium, pdfDoc, i, scale, pageW, pageH)
                    let t1 = Date.now()
                    if (dib) {
                        logger.log('[worker] page ' + i + ' render: ' + (t1 - t0) + 'ms (' + dib.w + 'x' + dib.h + ')')
                        const ok = centerAndStretch(hdc, dib, true)
                        logger.log('[worker] page ' + i + ' stretch ok:', ok)
                        if (!ok) logger.log('[worker] StretchDIBits failed for page ' + i + ' GLE=' + GetLastError())
                    } else {
                        logger.log('[worker] page ' + i + ' render failed')
                    }
                } catch (e: unknown) {
                    logger.log('[worker] page ' + i + ' error:', e instanceof Error ? e.stack : String(e))
                }
                const epRet = EndPage(hdc)
                if (epRet <= 0) logger.log('[worker] EndPage failed, ret=' + epRet + ' GLE=' + GetLastError())
            }
        } catch (e: unknown) {
            logger.log('[worker] PDFium processing error:', e instanceof Error ? e.stack : String(e))
            EndDoc(hdc)
            DeleteDC(hdc)
            if (hPrinter) ClosePrinter(hPrinter)
            return false
        } finally {
            pdfium.closeDocument(pdfDoc)
        }
    } else {
        const mupdf = await loadMuPdf()
        let doc: Document | null = null
        try {
            doc = mupdf.Document.openDocument(new Uint8Array(pdfBuf), 'application/pdf')
            const totalPages = doc.countPages()
            logger.log('[worker] PDF pages:', totalPages)

            for (let i = 0; i < totalPages; i++) {
                logger.log('[worker] page ' + (i + 1) + '/' + totalPages)
                const spRet = StartPage(hdc)
                if (spRet <= 0) logger.log('[worker] StartPage failed, ret=' + spRet + ' GLE=' + GetLastError())
                SetStretchBltMode(hdc, StretchBltMode.HALFTONE)
                SetBrushOrgEx(hdc, 0, 0, NULL)
                try {
                    let isLandscape = false
                    let t0 = Date.now()
                    let page: Page | null = null
                    try {
                        page = doc.loadPage(i)
                        const bounds = page.getBounds()
                        const pageW = bounds[2] - bounds[0]
                        const pageH = bounds[3] - bounds[1]
                        isLandscape = pageW > pageH
                    } finally {
                        if (page) try { page.destroy() } catch {}
                    }
                    const dib = renderPdfPageToDib(mupdf, doc, i, scale, isLandscape)
                    let t1 = Date.now()
                    if (dib) {
                        logger.log('[worker] page ' + i + ' render: ' + (t1 - t0) + 'ms (' + dib.w + 'x' + dib.h + ')' + (isLandscape ? ' (rotated)' : ''))
                        const ok = centerAndStretch(hdc, dib, false)
                        logger.log('[worker] page ' + i + ' stretch ok:', ok)
                        if (!ok) logger.log('[worker] StretchDIBits failed for page ' + i + ' GLE=' + GetLastError())
                    } else {
                        logger.log('[worker] page ' + i + ' render failed')
                    }
                } catch (e: unknown) {
                    logger.log('[worker] page ' + i + ' error:', e instanceof Error ? e.stack : String(e))
                }
                const epRet = EndPage(hdc)
                if (epRet <= 0) logger.log('[worker] EndPage failed, ret=' + epRet + ' GLE=' + GetLastError())
            }
        } catch (e: unknown) {
            logger.log('[worker] MuPDF processing error:', e instanceof Error ? e.stack : String(e))
            EndDoc(hdc)
            DeleteDC(hdc)
            if (hPrinter) ClosePrinter(hPrinter)
            if (doc) try { doc.destroy() } catch {}
            return false
        } finally {
            if (doc) try { doc.destroy() } catch {}
        }
    }

    const edRet = EndDoc(hdc)
    if (edRet <= 0) logger.log('[worker] EndDoc failed, ret=' + edRet + ' GLE=' + GetLastError())
    logger.log('[worker] calling DeleteDC (success path)')
    const ddRet = DeleteDC(hdc)
    logger.log('[worker] DeleteDC (success path) returned:', ddRet, 'GLE=' + GetLastError())
    if (hPrinter) ClosePrinter(hPrinter)

    logger.log('[worker] printPdf done')
    return true
}

loadMuPdf().catch((e: unknown) => logger.log('[worker] loadMuPdf error:', e instanceof Error ? e.stack : String(e)))
initPDFium().catch((e: unknown) => logger.log('[worker] initPDFium error:', e instanceof Error ? e.stack : String(e)))

os.Worker.parent.onmessage = async (e) => {
    const msg = e.data as WorkerInMsg
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
            const success = await printPdf(pdfBuf, msg.printerName, msg.duplex, msg.tumble, msg.renderEngine, msg.renderDPI, msg.docName)
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
