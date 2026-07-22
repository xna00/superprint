import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as os from 'os'
import type { PrintWorker, WorkerOutMsg } from './worker-types.js'
import { logger } from './logger.js'
import { api } from './api.js'
import { getDefaultPrinter } from './printer.js'
import { getRenderEngine, getRenderDPI } from './storage.js'

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
    worker.onerror = () => {
        log('print worker error event, rejecting all pending jobs')
        _pendingJobs.forEach(resolve => resolve(false))
        _pendingJobs.clear()
    }
}

function log(msg: string): void {
    logger.log('[print-queue]', msg)
    logFn(msg)
}

const PRINT_TIMEOUT = 120_000

async function processFile(file: PrintFileInfo): Promise<boolean> {
    log(`processing file: ${file.filename} (ID: ${file.id})`)

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

        const timer = os.setTimeout(() => {
            _pendingJobs.delete(jobId)
            log(`print job ${jobId} timed out after ${PRINT_TIMEOUT / 1000}s`)
            resolve(false)
        }, PRINT_TIMEOUT)

        _pendingJobs.set(jobId, (success: boolean) => {
            os.clearTimeout(timer)
            resolve(success)
        })

        _printWorker!.postMessage({
            type: 'print',
            fileId: file.fileId,
            printerName: printer,
            duplex: file.duplex,
            tumble: file.tumble,
            jobId,
            renderEngine: getRenderEngine(),
            renderDPI: getRenderDPI(),
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

        let successCount = 0
        let failCount = 0
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            log(`task ${i + 1}/${files.length}: ${file.filename}`)

            const success = await processFile(file)

            try {
                if (success) {
                    await api.printTask.fileSucceed(file.id)
                    log(`file ${file.id} printed successfully`)
                    successCount++
                } else {
                    await api.printTask.fileFailed(file.id)
                    log(`file ${file.id} print failed`)
                    failCount++
                }
            } catch (e) {
                log(`report status failed for file ${file.id}: ${e instanceof Error ? e.stack : String(e)}`)
            }
        }

        log(`completed: ${successCount} succeeded, ${failCount} failed out of ${files.length}`)
    } catch (e) {
        log(`handle print tasks error: ${e instanceof Error ? e.stack : String(e)}`)
    }
}

export async function handleWsMessage(message: string, computerId: string): Promise<void> {
    try {
        const msg = JSON.parse(message)
        const type = msg.type

        if (type === 'check_jobs') {
            log('received check_jobs message')
            await handlePrintJob(computerId)
        } else if (type === 'heartbeat' || type === 'ping') {
            log('heartbeat ok')
        } else {
            log(`received message: ${type}`)
        }
    } catch {
        log(`non-JSON message: ${message.slice(0, 50)}`)
    }
}
