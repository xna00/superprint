import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import type { PrintWorker, WorkerOutMsg, WorkerInMsg } from './worker-types.js'
import { api } from './api.js'
import { getDefaultPrinter } from './printer.js'

export interface PrintFileInfo {
    id: number
    printTaskId: string
    fileId: string
    filename: string
    printerName: string
    duplex: boolean
    tumble: boolean
}

type LogCallback = (msg: string) => void

let logFn: LogCallback = () => {}
let _printWorker: PrintWorker | null = null
let _jobIdCounter = 0
const _pendingJobs = new Map<number, (success: boolean) => void>()

export function setLogger(fn: LogCallback): void {
    logFn = fn
}

export function setPrintWorker(worker: PrintWorker): void {
    _printWorker = worker
    worker.onmessage = (e: { data: WorkerOutMsg }) => {
        const msg = e.data
        if (msg.type === 'done') {
            const resolve = _pendingJobs.get(msg.jobId)
            if (resolve) {
                resolve(msg.success)
                _pendingJobs.delete(msg.jobId)
            }
        }
    }
}

function log(msg: string): void {
    console.log('[print-queue]', msg)
    logFn(msg)
}

async function processFile(file: PrintFileInfo): Promise<boolean> {
    log(`processing file: ${file.filename} (ID: ${file.id})`)

    log(`downloading PDF: ${file.fileId}.pdf`)
    const res = await api.files.getFile(file.fileId + '.pdf')
    if (!res || !res.ok) {
        log(`download failed: ${file.fileId}.pdf - ${res?.status || 'no response'}`)
        return false
    }

    const pdfBuf = await res.arrayBuffer()
    log(`PDF downloaded: ${pdfBuf.byteLength} bytes`)

    const printer = file.printerName || getDefaultPrinter()
    if (!printer) {
        log('no printer found')
        return false
    }

    if (!_printWorker) {
        log('print worker not available')
        return false
    }

    return new Promise(resolve => {
        const jobId = ++_jobIdCounter
        _pendingJobs.set(jobId, resolve)
        _printWorker!.postMessage({
            type: 'print',
            pdfBuf,
            printerName: printer,
            duplex: file.duplex,
            tumble: file.tumble,
            jobId,
        })
    })
}

export async function handlePrintJob(computerId: string): Promise<void> {
    log('fetching print tasks...')

    try {
        const tasks = await api.printTask.listPrintTasks({
            state: 'waiting_print',
            computerId
        })

        if (!tasks || tasks.length === 0) {
            log('no pending print tasks')
            return
        }

        const files: PrintFileInfo[] = []

        for (const task of tasks) {
            for (const pf of task.printFiles) {
                if (pf.id && pf.fileId) {
                    files.push({
                        id: pf.id,
                        printTaskId: String(task.id),
                        fileId: pf.fileId,
                        filename: pf.filename || pf.fileId,
                        printerName: task.printer.name || '',
                        duplex: pf.duplex ?? true,
                        tumble: pf.tumble ?? false,
                    })
                }
            }
        }

        log(`found ${files.length} files to print`)

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            log(`task ${i + 1}/${files.length}: ${file.filename}`)

            const success = await processFile(file)

            try {
                if (success) {
                    await api.printTask.fileSucceed(file.id)
                    log(`file ${file.id} printed successfully`)
                } else {
                    await api.printTask.fileFailed(file.id)
                    log(`file ${file.id} print failed`)
                }
            } catch (e) {
                log(`report status failed: ${String(e)}`)
            }
        }

        log('all tasks completed')
    } catch (e) {
        log(`handle print tasks error: ${String(e)}`)
    }
}

export function handleWsMessage(message: string, computerId: string): void {
    try {
        const msg = JSON.parse(message)
        const type = msg.type

        if (type === 'check_jobs') {
            log('received check_jobs message')
            handlePrintJob(computerId)
        } else if (type === 'heartbeat' || type === 'ping') {
            log('heartbeat ok')
        } else {
            log(`received message: ${type}`)
        }
    } catch {
        log(`non-JSON message: ${message.slice(0, 50)}`)
    }
}
