export interface PrintRequest {
    type: 'print'
    fileId: string
    printerName: string
    duplex: boolean
    tumble: boolean
    jobId: number
    renderEngine: 'pdfium' | 'mupdf'
}
export interface PrintResult {
    type: 'done'
    jobId: number
    success: boolean
}
export type WorkerInMsg = PrintRequest | { type: 'done' }
export type WorkerOutMsg = PrintResult

export interface PrintWorker {
    postMessage(msg: WorkerInMsg): void
    onmessage: ((e: { data: WorkerOutMsg }) => void) | null
    onerror: ((e: Event) => void) | null
}

declare global {
    var $libmupdf_wasm_Module:
        | { wasmBinary: ArrayBuffer; locateFile: (path: string) => string }
        | undefined
}
