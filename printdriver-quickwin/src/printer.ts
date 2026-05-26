import * as win from 'win'
import * as ffi from 'ffi'

const _gdi32 = win.LoadLibrary('gdi32.dll')
const _winspool = win.LoadLibrary('winspool.drv')
const _ole32 = win.LoadLibrary('ole32.dll')

const CreateDCW = (_gdi32 ? win.GetProcAddress(_gdi32, 'CreateDCW') : 0) as number
const DeleteDC = (_gdi32 ? win.GetProcAddress(_gdi32, 'DeleteDC') : 0) as number
const StartDocW = (_gdi32 ? win.GetProcAddress(_gdi32, 'StartDocW') : 0) as number
const EndDoc = (_gdi32 ? win.GetProcAddress(_gdi32, 'EndDoc') : 0) as number
const StartPage = (_gdi32 ? win.GetProcAddress(_gdi32, 'StartPage') : 0) as number
const EndPage = (_gdi32 ? win.GetProcAddress(_gdi32, 'EndPage') : 0) as number
const GetDeviceCaps = (_gdi32 ? win.GetProcAddress(_gdi32, 'GetDeviceCaps') : 0) as number
const CreateCompatibleDC = (_gdi32 ? win.GetProcAddress(_gdi32, 'CreateCompatibleDC') : 0) as number
const SelectObject = (_gdi32 ? win.GetProcAddress(_gdi32, 'SelectObject') : 0) as number
const DeleteObject = (_gdi32 ? win.GetProcAddress(_gdi32, 'DeleteObject') : 0) as number
const StretchBlt = (_gdi32 ? win.GetProcAddress(_gdi32, 'StretchBlt') : 0) as number
const SetStretchBltMode = (_gdi32 ? win.GetProcAddress(_gdi32, 'SetStretchBltMode') : 0) as number
const PlgBlt = (_gdi32 ? win.GetProcAddress(_gdi32, 'PlgBlt') : 0) as number

const GetDefaultPrinterW = (_winspool ? win.GetProcAddress(_winspool, 'GetDefaultPrinterW') : 0) as number
const EnumPrintersW = (_winspool ? win.GetProcAddress(_winspool, 'EnumPrintersW') : 0) as number

const CreateStreamOnHGlobal = (_ole32 ? win.GetProcAddress(_ole32, 'CreateStreamOnHGlobal') : 0) as number

const _kernel32 = win.LoadLibrary('kernel32.dll')
const CreateFileW_k32 = (_kernel32 ? win.GetProcAddress(_kernel32, 'CreateFileW') : 0) as number
const ReadFile_k32 = (_kernel32 ? win.GetProcAddress(_kernel32, 'ReadFile') : 0) as number
const CloseHandle_k32 = (_kernel32 ? win.GetProcAddress(_kernel32, 'CloseHandle') : 0) as number
const GetFileSizeEx_k32 = (_kernel32 ? win.GetProcAddress(_kernel32, 'GetFileSizeEx') : 0) as number
const GlobalAlloc_k32 = (_kernel32 ? win.GetProcAddress(_kernel32, 'GlobalAlloc') : 0) as number
const GlobalLock_k32 = (_kernel32 ? win.GetProcAddress(_kernel32, 'GlobalLock') : 0) as number
const GlobalUnlock_k32 = (_kernel32 ? win.GetProcAddress(_kernel32, 'GlobalUnlock') : 0) as number
const GlobalFree_k32 = (_kernel32 ? win.GetProcAddress(_kernel32, 'GlobalFree') : 0) as number

const HORZRES = 8
const VERTRES = 10
const HALFTONE = 4
const SRCCOPY = 0x00CC0020

const PRINTER_ENUM_LOCAL = 0x00000002
const PRINTER_ENUM_CONNECTIONS = 0x00000004

// GDI+
let _gdiplusTokenHi = 0
let _gdiplusTokenLo = 0
let _gdiplusReady = false
let _gdiplusTried = false
let _GdipLoadImageFromFile = 0
let _GdipLoadImageFromFileICM = 0
let _GdipLoadImageFromStream = 0
let _GdipGetImageWidth = 0
let _GdipGetImageHeight = 0
let _GdipCreateHBITMAPFromBitmap = 0
let _GdipDisposeImage = 0
let _GdipCreateFromHDC = 0
let _GdipDeleteGraphics = 0
let _GdipDrawImageRectI = 0
let _GdipSetPageUnit = 0

function ensureGdiPlus(): boolean {
    if (_gdiplusTried) return _gdiplusReady
    _gdiplusTried = true

    const _gdiplus = win.LoadLibrary('gdiplus.dll')
    if (!_gdiplus) return false

    const GdiplusStartup = win.GetProcAddress(_gdiplus, 'GdiplusStartup') as number
    _GdipLoadImageFromFile = win.GetProcAddress(_gdiplus, 'GdipLoadImageFromFile') as number
    _GdipLoadImageFromFileICM = win.GetProcAddress(_gdiplus, 'GdipLoadImageFromFileICM') as number
    _GdipLoadImageFromStream = win.GetProcAddress(_gdiplus, 'GdipLoadImageFromStream') as number
    _GdipGetImageWidth = win.GetProcAddress(_gdiplus, 'GdipGetImageWidth') as number
    _GdipGetImageHeight = win.GetProcAddress(_gdiplus, 'GdipGetImageHeight') as number
    _GdipCreateHBITMAPFromBitmap = win.GetProcAddress(_gdiplus, 'GdipCreateHBITMAPFromBitmap') as number
    _GdipDisposeImage = win.GetProcAddress(_gdiplus, 'GdipDisposeImage') as number
    _GdipCreateFromHDC = win.GetProcAddress(_gdiplus, 'GdipCreateFromHDC') as number
    _GdipDeleteGraphics = win.GetProcAddress(_gdiplus, 'GdipDeleteGraphics') as number
    _GdipDrawImageRectI = win.GetProcAddress(_gdiplus, 'GdipDrawImageRectI') as number
    _GdipSetPageUnit = win.GetProcAddress(_gdiplus, 'GdipSetPageUnit') as number

    if (!GdiplusStartup || !_GdipLoadImageFromFile || !_GdipLoadImageFromStream || !_GdipGetImageWidth || !_GdipGetImageHeight || !_GdipCreateHBITMAPFromBitmap || !_GdipDisposeImage) {
        return false
    }

    const input = new ArrayBuffer(24)
    const dv = new DataView(input)
    dv.setUint32(0, 1, true)
    dv.setUint32(16, 0, true)
    dv.setUint32(20, 0, true)

    const tokenBuf = new ArrayBuffer(8)
    const outputBuf = new ArrayBuffer(16)

    const ret = ffi.ffiCall(
        GdiplusStartup,
        [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [tokenBuf, input, outputBuf],
        ffi.FFI_TYPE_SINT32
    )

    if (ret === 0) {
        const td = new DataView(tokenBuf)
        _gdiplusTokenLo = td.getUint32(0, true)
        _gdiplusTokenHi = td.getUint32(4, true)
        _gdiplusReady = true
    }
    return _gdiplusReady
}

function loadJpegAsBitmap(filePath: string): { hbmp: number; width: number; height: number } | null {
    if (!ensureGdiPlus()) return null

    // Try GdipLoadImageFromFile first
    const result = tryLoadJpegGdiPlus(filePath)
    if (result) return result

    // Try ICM-enabled variant (handles CMYK JPEGs)
    if (_GdipLoadImageFromFileICM) {
        console.log('[printer] GdipLoadImageFromFile failed, trying GdipLoadImageFromFileICM...')
        const icmResult = tryLoadJpegGdiPlusICM(filePath)
        if (icmResult) return icmResult
    }

    // Fallback: read file into HGLOBAL → IStream → GdipLoadImageFromStream
    console.log('[printer] trying GdipLoadImageFromStream...')
    return tryLoadJpegGdiPlusStream(filePath)
}

function tryLoadImageFromFile(filePath: string, func: number): { imagePtr: number; width: number; height: number } | null {
    if (!func) return null
    const pathBuf = strToWideBuf(filePath)
    const ptrBuf = new ArrayBuffer(8)
    const ret = ffi.ffiCall(func, [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER], [pathBuf, ptrBuf], ffi.FFI_TYPE_SINT32)
    if (ret !== 0) return null

    const imgPtr = readPtr(new DataView(ptrBuf), 0)
    if (!imgPtr) return null

    const wBuf = new ArrayBuffer(4)
    const hBuf = new ArrayBuffer(4)
    ffi.ffiCall(_GdipGetImageWidth, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [imgPtr, wBuf], ffi.FFI_TYPE_SINT32)
    ffi.ffiCall(_GdipGetImageHeight, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [imgPtr, hBuf], ffi.FFI_TYPE_SINT32)

    const width = new DataView(wBuf).getUint32(0, true)
    const height = new DataView(hBuf).getUint32(0, true)
    if (width > 0 && height > 0) {
        return { imagePtr: imgPtr, width, height }
    }
    ffi.ffiCall(_GdipDisposeImage, [ffi.FFI_TYPE_UINT64], [imgPtr], ffi.FFI_TYPE_SINT32)
    return null
}

function loadImagePtr(filePath: string): { imagePtr: number; width: number; height: number } | null {
    if (!ensureGdiPlus()) return null

    let result = tryLoadImageFromFile(filePath, _GdipLoadImageFromFile)
    if (result) return result

    result = tryLoadImageFromFile(filePath, _GdipLoadImageFromFileICM)
    if (result) return result

    return loadImagePtrFromStream(filePath)
}

function loadImagePtrFromStream(filePath: string): { imagePtr: number; width: number; height: number } | null {
    const pathBuf = strToWideBuf(filePath)
    const hFile = ffi.ffiCall(
        CreateFileW_k32,
        [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_UINT64],
        [pathBuf, 0x80000000, 3, null, 3, 0, 0],
        ffi.FFI_TYPE_UINT64
    ) as number
    if (!hFile || hFile === 0xFFFFFFFF) return null

    const fileSizeBuf = new ArrayBuffer(8)
    const sizeOk = ffi.ffiCall(GetFileSizeEx_k32, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [hFile, fileSizeBuf], ffi.FFI_TYPE_SINT32) as number
    if (!sizeOk) {
        ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)
        return null
    }
    const fsDv = new DataView(fileSizeBuf)
    const fileSize = fsDv.getUint32(0, true) + fsDv.getUint32(4, true) * 4294967296
    if (!fileSize) {
        ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)
        return null
    }

    const hGlobal = ffi.ffiCall(GlobalAlloc_k32, [ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_UINT64], [0x2, fileSize], ffi.FFI_TYPE_UINT64) as number
    if (!hGlobal) {
        ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)
        return null
    }
    const pData = ffi.ffiCall(GlobalLock_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_UINT64) as number
    if (!pData) {
        ffi.ffiCall(GlobalFree_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)
        ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)
        return null
    }

    const bytesReadBuf = new ArrayBuffer(4)
    ffi.ffiCall(ReadFile_k32, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER], [hFile, pData, fileSize, bytesReadBuf, null], ffi.FFI_TYPE_SINT32)
    ffi.ffiCall(GlobalUnlock_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)
    ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)

    const streamBuf = new ArrayBuffer(8)
    const hrStream = ffi.ffiCall(CreateStreamOnHGlobal, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_POINTER], [hGlobal, 0, streamBuf], ffi.FFI_TYPE_SINT32) as number
    if (hrStream < 0) {
        ffi.ffiCall(GlobalFree_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)
        return null
    }

    const pStream = readPtr(new DataView(streamBuf), 0)
    const imagePtrBuf = new ArrayBuffer(8)
    const gdiRet = ffi.ffiCall(_GdipLoadImageFromStream, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [pStream, imagePtrBuf], ffi.FFI_TYPE_SINT32) as number
    ffi.ffiCall(GlobalFree_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)
    if (gdiRet !== 0) return null

    const imgPtr = readPtr(new DataView(imagePtrBuf), 0)
    if (!imgPtr) return null

    const wBuf = new ArrayBuffer(4)
    const hBuf = new ArrayBuffer(4)
    ffi.ffiCall(_GdipGetImageWidth, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [imgPtr, wBuf], ffi.FFI_TYPE_SINT32)
    ffi.ffiCall(_GdipGetImageHeight, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [imgPtr, hBuf], ffi.FFI_TYPE_SINT32)

    const width = new DataView(wBuf).getUint32(0, true)
    const height = new DataView(hBuf).getUint32(0, true)
    if (!width || !height) {
        ffi.ffiCall(_GdipDisposeImage, [ffi.FFI_TYPE_UINT64], [imgPtr], ffi.FFI_TYPE_SINT32)
        return null
    }
    return { imagePtr: imgPtr, width, height }
}

function tryLoadJpegGdiPlus(filePath: string): { hbmp: number; width: number; height: number } | null {
    const pathBuf = strToWideBuf(filePath)
    const imagePtrBuf = new ArrayBuffer(8)

    const ret = ffi.ffiCall(
        _GdipLoadImageFromFile,
        [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [pathBuf, imagePtrBuf],
        ffi.FFI_TYPE_SINT32
    )
    if (ret !== 0) {
        console.log('[printer] GdipLoadImageFromFile failed: ' + ret)
        return null
    }

    const imgDv = new DataView(imagePtrBuf)
    const imgLo = imgDv.getUint32(0, true)
    const imgHi = imgDv.getUint32(4, true)
    const imgPtr = imgLo + imgHi * 4294967296

    const widthBuf = new ArrayBuffer(4)
    const heightBuf = new ArrayBuffer(4)

    ffi.ffiCall(
        _GdipGetImageWidth,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER],
        [imgPtr, widthBuf],
        ffi.FFI_TYPE_SINT32
    )
    ffi.ffiCall(
        _GdipGetImageHeight,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER],
        [imgPtr, heightBuf],
        ffi.FFI_TYPE_SINT32
    )

    const width = new DataView(widthBuf).getUint32(0, true)
    const height = new DataView(heightBuf).getUint32(0, true)

    if (width === 0 || height === 0) {
        console.log('[printer] invalid image dimensions: ' + width + 'x' + height)
        ffi.ffiCall(_GdipDisposeImage, [ffi.FFI_TYPE_UINT64], [imgPtr], ffi.FFI_TYPE_SINT32)
        return null
    }

    const hbmpBuf = new ArrayBuffer(8)

    const ret2 = ffi.ffiCall(
        _GdipCreateHBITMAPFromBitmap,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32],
        [imgPtr, hbmpBuf, 0xFFFFFFFF],
        ffi.FFI_TYPE_SINT32
    )

    ffi.ffiCall(
        _GdipDisposeImage,
        [ffi.FFI_TYPE_UINT64],
        [imgPtr],
        ffi.FFI_TYPE_SINT32
    )

    if (ret2 !== 0) {
        console.log('[printer] GdipCreateHBITMAPFromBitmap failed: ' + ret2)
        return null
    }

    const hbmpDv = new DataView(hbmpBuf)
    const hbmp = hbmpDv.getUint32(0, true) + hbmpDv.getUint32(4, true) * 4294967296

    if (!hbmp) {
        console.log('[printer] invalid HBITMAP handle')
        return null
    }

    return { hbmp, width, height }
}

function tryLoadJpegGdiPlusICM(filePath: string): { hbmp: number; width: number; height: number } | null {
    if (!_GdipLoadImageFromFileICM) return null
    const pathBuf = strToWideBuf(filePath)
    const imagePtrBuf = new ArrayBuffer(8)

    const ret = ffi.ffiCall(
        _GdipLoadImageFromFileICM,
        [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [pathBuf, imagePtrBuf],
        ffi.FFI_TYPE_SINT32
    )
    if (ret !== 0) {
        console.log('[printer] GdipLoadImageFromFileICM failed: ' + ret)
        return null
    }

    const imgDv = new DataView(imagePtrBuf)
    const imgLo = imgDv.getUint32(0, true)
    const imgHi = imgDv.getUint32(4, true)
    const imgPtr = imgLo + imgHi * 4294967296

    const widthBuf = new ArrayBuffer(4)
    const heightBuf = new ArrayBuffer(4)
    ffi.ffiCall(_GdipGetImageWidth, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [imgPtr, widthBuf], ffi.FFI_TYPE_SINT32)
    ffi.ffiCall(_GdipGetImageHeight, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [imgPtr, heightBuf], ffi.FFI_TYPE_SINT32)

    const width = new DataView(widthBuf).getUint32(0, true)
    const height = new DataView(heightBuf).getUint32(0, true)
    if (width === 0 || height === 0) {
        ffi.ffiCall(_GdipDisposeImage, [ffi.FFI_TYPE_UINT64], [imgPtr], ffi.FFI_TYPE_SINT32)
        return null
    }

    const hbmpBuf = new ArrayBuffer(8)
    const ret2 = ffi.ffiCall(
        _GdipCreateHBITMAPFromBitmap,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32],
        [imgPtr, hbmpBuf, 0xFFFFFFFF],
        ffi.FFI_TYPE_SINT32
    )
    ffi.ffiCall(_GdipDisposeImage, [ffi.FFI_TYPE_UINT64], [imgPtr], ffi.FFI_TYPE_SINT32)
    if (ret2 !== 0) {
        console.log('[printer] GdipCreateHBITMAPFromBitmap (ICM) failed: ' + ret2)
        return null
    }

    const hbmpDv = new DataView(hbmpBuf)
    const hbmp = hbmpDv.getUint32(0, true) + hbmpDv.getUint32(4, true) * 4294967296
    if (!hbmp) {
        console.log('[printer] invalid HBITMAP handle (ICM)')
        return null
    }

    console.log('[printer] GdipLoadImageFromFileICM: ' + width + 'x' + height)
    return { hbmp: Number(hbmp), width, height }
}


const GENERIC_READ = 0x80000000
const FILE_SHARE_READ = 0x00000001
const OPEN_EXISTING = 3
const FILE_ATTRIBUTE_NORMAL = 0x80
const GMEM_MOVEABLE = 0x0002

function tryLoadJpegGdiPlusStream(filePath: string): { hbmp: number; width: number; height: number } | null {
    if (!_GdipLoadImageFromStream || !CreateStreamOnHGlobal ||
        !CreateFileW_k32 || !ReadFile_k32 || !CloseHandle_k32 || !GetFileSizeEx_k32 ||
        !GlobalAlloc_k32 || !GlobalLock_k32 || !GlobalUnlock_k32) {
        console.log('[printer] GdipLoadImageFromStream: functions not available')
        return null
    }

    const pathBuf = strToWideBuf(filePath)

    const hFile = ffi.ffiCall(
        CreateFileW_k32,
        [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_UINT64],
        [pathBuf, GENERIC_READ, FILE_SHARE_READ, null, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, 0],
        ffi.FFI_TYPE_UINT64
    ) as number

    if (!hFile || hFile === -1) {
        console.log('[printer] CreateFileW failed for: ' + filePath)
        return null
    }
    console.log('[printer] stream: CreateFileW OK')

    const fileSizeBuf = new ArrayBuffer(8)
    const sizeOk = ffi.ffiCall(
        GetFileSizeEx_k32,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER],
        [hFile, fileSizeBuf],
        ffi.FFI_TYPE_SINT32
    ) as number
    if (!sizeOk) {
        console.log('[printer] GetFileSizeEx failed')
        ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)
        return null
    }
    const sizeDv = new DataView(fileSizeBuf)
    const fileSize = sizeDv.getUint32(0, true) + sizeDv.getUint32(4, true) * 4294967296
    console.log('[printer] stream: GetFileSizeEx OK size=' + fileSize)
    if (fileSize === 0) {
        console.log('[printer] stream: file is empty')
        ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)
        return null
    }

    const hGlobal = ffi.ffiCall(
        GlobalAlloc_k32,
        [ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_UINT64],
        [GMEM_MOVEABLE, fileSize],
        ffi.FFI_TYPE_UINT64
    ) as number
    if (!hGlobal) {
        console.log('[printer] GlobalAlloc failed')
        ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)
        return null
    }
    console.log('[printer] stream: GlobalAlloc OK')

    const pData = ffi.ffiCall(GlobalLock_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_UINT64) as number
    if (!pData) {
        console.log('[printer] GlobalLock failed')
        ffi.ffiCall(GlobalFree_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)
        ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)
        return null
    }
    console.log('[printer] stream: GlobalLock OK')

    const bytesReadBuf = new ArrayBuffer(4)
    const readRet = ffi.ffiCall(
        ReadFile_k32,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_UINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [hFile, pData, fileSize, bytesReadBuf, null],
        ffi.FFI_TYPE_SINT32
    ) as number

    ffi.ffiCall(GlobalUnlock_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)
    ffi.ffiCall(CloseHandle_k32, [ffi.FFI_TYPE_UINT64], [hFile], ffi.FFI_TYPE_VOID)

    if (!readRet) {
        console.log('[printer] ReadFile failed')
        ffi.ffiCall(GlobalFree_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)
        return null
    }
    console.log('[printer] stream: ReadFile OK (' + new DataView(bytesReadBuf).getUint32(0, true) + ' bytes)')

    const streamBuf = new ArrayBuffer(8)
    const hrStream = ffi.ffiCall(
        CreateStreamOnHGlobal,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_POINTER],
        [hGlobal, 0, streamBuf],
        ffi.FFI_TYPE_SINT32
    ) as number

    if (hrStream < 0) {
        console.log('[printer] CreateStreamOnHGlobal failed: 0x' + (hrStream >>> 0).toString(16))
        ffi.ffiCall(GlobalFree_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)
        return null
    }
    console.log('[printer] stream: CreateStreamOnHGlobal OK')

    const streamDv = new DataView(streamBuf)
    const pStream = streamDv.getUint32(0, true) + streamDv.getUint32(4, true) * 4294967296

    const imagePtrBuf = new ArrayBuffer(8)
    const ret = ffi.ffiCall(
        _GdipLoadImageFromStream,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER],
        [pStream, imagePtrBuf],
        ffi.FFI_TYPE_SINT32
    ) as number

    // Stream no longer needed; free HGLOBAL regardless of success
    ffi.ffiCall(GlobalFree_k32, [ffi.FFI_TYPE_UINT64], [hGlobal], ffi.FFI_TYPE_VOID)

    if (ret !== 0) {
        console.log('[printer] GdipLoadImageFromStream failed: ' + ret)
        return null
    }
    console.log('[printer] stream: GdipLoadImageFromStream OK')

    const imgDv = new DataView(imagePtrBuf)
    const imgLo = imgDv.getUint32(0, true)
    const imgHi = imgDv.getUint32(4, true)
    const imgPtr = imgLo + imgHi * 4294967296

    if (!imgPtr) {
        console.log('[printer] GdipLoadImageFromStream returned null')
        return null
    }
    console.log('[printer] stream: imgPtr=0x' + imgPtr.toString(16))

    const widthBuf = new ArrayBuffer(4)
    const heightBuf = new ArrayBuffer(4)

    ffi.ffiCall(_GdipGetImageWidth, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [imgPtr, widthBuf], ffi.FFI_TYPE_SINT32)
    ffi.ffiCall(_GdipGetImageHeight, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [imgPtr, heightBuf], ffi.FFI_TYPE_SINT32)

    const width = new DataView(widthBuf).getUint32(0, true)
    const height = new DataView(heightBuf).getUint32(0, true)
    console.log('[printer] stream: dims=' + width + 'x' + height)

    if (width === 0 || height === 0) {
        console.log('[printer] invalid image dims (stream)')
        ffi.ffiCall(_GdipDisposeImage, [ffi.FFI_TYPE_UINT64], [imgPtr], ffi.FFI_TYPE_SINT32)
        return null
    }

    const hbmpBuf = new ArrayBuffer(8)
    const ret2 = ffi.ffiCall(
        _GdipCreateHBITMAPFromBitmap,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT32],
        [imgPtr, hbmpBuf, 0xFFFFFFFF],
        ffi.FFI_TYPE_SINT32
    )

    ffi.ffiCall(_GdipDisposeImage, [ffi.FFI_TYPE_UINT64], [imgPtr], ffi.FFI_TYPE_SINT32)

    if (ret2 !== 0) {
        console.log('[printer] GdipCreateHBITMAPFromBitmap (stream) failed: ' + ret2)
        return null
    }

    const hbmpDv = new DataView(hbmpBuf)
    const hbmp = hbmpDv.getUint32(0, true) + hbmpDv.getUint32(4, true) * 4294967296

    if (!hbmp) {
        console.log('[printer] invalid HBITMAP handle')
        return null
    }

    console.log('[printer] GdipLoadImageFromStream: ' + width + 'x' + height)
    return { hbmp: Number(hbmp), width, height }
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

export function printJpegPages(jpegPaths: string[], printerName: string, duplex: boolean, tumble: boolean): boolean {
    console.log('[printer] printJpegPages called')
    console.log('[printer] printer: ' + printerName)
    console.log('[printer] pages: ' + jpegPaths.length)
    console.log('[printer] duplex: ' + duplex + ', tumble: ' + tumble)

    if (!CreateDCW || !StartDocW || !EndDoc || !StartPage || !EndPage || !DeleteDC || !GetDeviceCaps) {
        console.log('[printer] GDI functions not available')
        return false
    }

    const printerNameBuf = strToWideBuf(printerName)

    const hdc = ffi.ffiCall(
        CreateDCW,
        [ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_POINTER],
        [null, printerNameBuf, null, null],
        ffi.FFI_TYPE_UINT64
    ) as number

    console.log('[printer] hdc: ' + hdc)

    if (!hdc) {
        console.log('[printer] CreateDC failed')
        return false
    }

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

    console.log('[printer] docInfo size: 40, docNamePtr: ' + docNamePtr)

    const docRet = ffi.ffiCall(
        StartDocW,
        [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER],
        [hdc, docInfo],
        ffi.FFI_TYPE_SINT32
    )

    console.log('[printer] StartDoc: ' + docRet)

    if (docRet <= 0) {
        ffi.ffiCall(DeleteDC, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_VOID)
        return false
    }

    const paperW = ffi.ffiCall(GetDeviceCaps, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32], [hdc, HORZRES], ffi.FFI_TYPE_SINT32) as number
    const paperH = ffi.ffiCall(GetDeviceCaps, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32], [hdc, VERTRES], ffi.FFI_TYPE_SINT32) as number
    console.log('[printer] paper: ' + paperW + 'x' + paperH)

    console.log('[printer] GDI+ available: ' + ensureGdiPlus())

    for (let i = 0; i < jpegPaths.length; i++) {
        const path = jpegPaths[i]
        console.log('[printer] page ' + (i + 1) + ': ' + path)

        ffi.ffiCall(StartPage, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_SINT32)

        try {
            renderJpegOnDC(hdc, path, paperW, paperH)
        } catch (e: any) {
            console.log('[printer] render error: ' + String(e))
        }

        ffi.ffiCall(EndPage, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_SINT32)
    }

    ffi.ffiCall(EndDoc, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_SINT32)
    ffi.ffiCall(DeleteDC, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_VOID)

    console.log('[printer] done')
    return true
}

function renderJpegOnDC(hdc: number, filePath: string, paperW: number, paperH: number): void {
    // Try GDI+ rendering first (handles CMYK correctly)
    if (_GdipCreateFromHDC && _GdipDeleteGraphics && _GdipDrawImageRectI && _GdipSetPageUnit && ensureGdiPlus()) {
        const img = loadImagePtr(filePath)
        if (img) {
            const graphicsBuf = new ArrayBuffer(8)
            const gRet = ffi.ffiCall(_GdipCreateFromHDC, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER], [hdc, graphicsBuf], ffi.FFI_TYPE_SINT32) as number
            if (gRet === 0) {
                const graphics = new DataView(graphicsBuf).getUint32(0, true) + new DataView(graphicsBuf).getUint32(4, true) * 4294967296
                if (graphics) {
                    // Set page unit to UnitPixel (=2) so coordinates match printer device units
                    ffi.ffiCall(_GdipSetPageUnit, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32], [graphics, 2], ffi.FFI_TYPE_SINT32)
                    // Calculate centered/scaled position
                    const scaleX = paperW / img.width
                    const scaleY = paperH / img.height
                    const scale = scaleX < scaleY ? scaleX : scaleY
                    const drawW = Math.floor(img.width * scale)
                    const drawH = Math.floor(img.height * scale)
                    const drawX = Math.floor((paperW - drawW) / 2)
                    const drawY = Math.floor((paperH - drawH) / 2)
                    ffi.ffiCall(_GdipDrawImageRectI, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32], [graphics, img.imagePtr, drawX, drawY, drawW, drawH], ffi.FFI_TYPE_SINT32)
                    ffi.ffiCall(_GdipDeleteGraphics, [ffi.FFI_TYPE_UINT64], [graphics], ffi.FFI_TYPE_SINT32)
                    console.log('[printer] rendered via GDI+: ' + filePath + ' (' + drawW + 'x' + drawH + ')')
                }
            }
            ffi.ffiCall(_GdipDisposeImage, [ffi.FFI_TYPE_UINT64], [img.imagePtr], ffi.FFI_TYPE_SINT32)
            return
        }
    }

    // Fallback: GDI HBITMAP rendering
    const image = loadJpegAsBitmap(filePath)
    if (!image) {
        console.log('[printer] failed to load JPEG: ' + filePath)
        return
    }

    const memDC = ffi.ffiCall(CreateCompatibleDC, [ffi.FFI_TYPE_UINT64], [hdc], ffi.FFI_TYPE_UINT64) as number
    if (!memDC) {
        console.log('[printer] CreateCompatibleDC failed')
        ffi.ffiCall(DeleteObject, [ffi.FFI_TYPE_UINT64], [image.hbmp], ffi.FFI_TYPE_VOID)
        return
    }

    const oldBmp = ffi.ffiCall(SelectObject, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_UINT64], [memDC, image.hbmp], ffi.FFI_TYPE_UINT64) as number
    ffi.ffiCall(SetStretchBltMode, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32], [hdc, HALFTONE], ffi.FFI_TYPE_SINT32)

    const needRotate = image.width > image.height
    const finalW = needRotate ? image.height : image.width
    const finalH = needRotate ? image.width : image.height
    const scaleX = paperW / finalW
    const scaleY = paperH / finalH
    const scale = scaleX < scaleY ? scaleX : scaleY
    const drawW = Math.floor(finalW * scale)
    const drawH = Math.floor(finalH * scale)
    const drawX = Math.floor((paperW - drawW) / 2)
    const drawY = Math.floor((paperH - drawH) / 2)

    if (needRotate && PlgBlt) {
        const pts = new ArrayBuffer(24)
        const ptsDv = new DataView(pts)
        ptsDv.setInt32(0, drawX, true); ptsDv.setInt32(4, drawY + drawH, true)
        ptsDv.setInt32(8, drawX, true); ptsDv.setInt32(12, drawY, true)
        ptsDv.setInt32(16, drawX + drawW, true); ptsDv.setInt32(20, drawY + drawH, true)
        ffi.ffiCall(PlgBlt, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_POINTER, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32], [hdc, pts, memDC, 0, 0, image.width, image.height, null, 0, 0], ffi.FFI_TYPE_SINT32)
    } else {
        ffi.ffiCall(StretchBlt, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_SINT32, ffi.FFI_TYPE_UINT32], [hdc, drawX, drawY, drawW, drawH, memDC, 0, 0, image.width, image.height, SRCCOPY], ffi.FFI_TYPE_SINT32)
    }

    if (oldBmp) ffi.ffiCall(SelectObject, [ffi.FFI_TYPE_UINT64, ffi.FFI_TYPE_UINT64], [memDC, oldBmp], ffi.FFI_TYPE_UINT64)
    ffi.ffiCall(DeleteDC, [ffi.FFI_TYPE_UINT64], [memDC], ffi.FFI_TYPE_VOID)
    ffi.ffiCall(DeleteObject, [ffi.FFI_TYPE_UINT64], [image.hbmp], ffi.FFI_TYPE_VOID)

    console.log('[printer] rendered JPEG via GDI: ' + filePath + ' (' + drawW + 'x' + drawH + '@' + drawX + ',' + drawY + ')')
}
