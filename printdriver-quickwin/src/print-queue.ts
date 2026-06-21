import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import { api } from './api.js'
import { printPdfPages, getDefaultPrinter } from './printer.js'

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

export function setLogger(fn: LogCallback): void {
    logFn = fn
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

    return await printPdfPages(pdfBuf, printer, file.duplex, file.tumble)
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
