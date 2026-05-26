import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as os from 'os'
import * as std from 'std'
import UZIP from 'uzip/UZIP.js'
import { api } from './api.js'
import { printJpegPages, getDefaultPrinter } from './printer.js'
import { DOWNLOAD_FOLDER } from './config.js'

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

function ensureDownloadDir(): string {
    const base = std.getenv('TEMP') || std.getenv('TMP') || 'C:\\Temp'
    const dir = base + '\\' + DOWNLOAD_FOLDER
    try {
        os.mkdir(dir)
    } catch {}
    return dir
}

async function downloadFile(fileId: string): Promise<ArrayBuffer | null> {
    log(`downloading file: ${fileId}`)
    try {
        const req = await api.files.getPsFile.makeRequest(fileId)
        const res = await fetch(req)
        if (!res || !res.ok) {
            log(`download failed: ${fileId} - ${res?.status || 'no response'}`)
            return null
        }
        const buf = await res.arrayBuffer()
        log(`download complete: ${buf.byteLength} bytes`)
        return buf
    } catch (e) {
        log(`download error: ${fileId} - ${String(e)}`)
        return null
    }
}

function extractZipToDir(zipBuf: ArrayBuffer, destDir: string): string[] {
    const files: string[] = []
    try {
        const extracted = UZIP.parse(zipBuf)
        for (const name in extracted) {
            const data = extracted[name]
            if (!(data instanceof Uint8Array)) continue
            const lowerName = name.toLowerCase()
            if (!lowerName.startsWith('page-') || !lowerName.endsWith('.jpg')) continue
            
            const filePath = destDir + '\\' + name
            const fd = os.open(filePath, os.O_WRONLY | os.O_CREAT | os.O_TRUNC)
            if (fd !== null && fd !== undefined) {
                const uint8 = data
                const writeBuf = new ArrayBuffer(uint8.byteLength)
                new Uint8Array(writeBuf).set(uint8)
                os.write(fd, writeBuf, 0, uint8.byteLength)
                os.close(fd)
                files.push(filePath)
            }
        }
    } catch (e) {
        log(`extract failed: ${String(e)}`)
    }
    files.sort()
    return files
}

function deleteDirectory(path: string): void {
    try {
        const [entries] = os.readdir(path)
        for (const entry of entries) {
            if (entry === '.' || entry === '..') continue
            const fullPath = path + '\\' + entry
            try {
                const [stat] = os.stat(fullPath)
                if (stat && (stat.mode & 0x4000)) {
                    deleteDirectory(fullPath)
                } else {
                    os.remove(fullPath)
                }
            } catch {}
        }
        os.remove(path)
    } catch {}
}

async function processFile(file: PrintFileInfo): Promise<boolean> {
    log(`processing file: ${file.filename} (ID: ${file.id})`)
    
    const zipBuf = await downloadFile(file.fileId)
    if (!zipBuf) {
        log(`download failed: ${file.filename}`)
        return false
    }
    
    const tempDir = ensureDownloadDir()
    const extractDir = tempDir + '\\task_' + file.id
    try { os.mkdir(extractDir) } catch {}
    
    const jpegFiles = extractZipToDir(zipBuf, extractDir)
    if (jpegFiles.length === 0) {
        log(`extract failed or no page files`)
        deleteDirectory(extractDir)
        return false
    }
    
    log(`printing: ${jpegFiles.length} pages`)
    
    const printer = file.printerName || getDefaultPrinter()
    if (!printer) {
        log(`no printer found`)
        deleteDirectory(extractDir)
        return false
    }
    
    const success = printJpegPages(jpegFiles, printer, file.duplex, file.tumble)
    
    deleteDirectory(extractDir)
    
    return success
}

export async function handlePrintJob(computerId: string): Promise<void> {
    log('fetching print tasks...')
    
    try {
        const result = await api.printTask.listPrintTasks({ 
            state: 'waiting_print', 
            computerId 
        })
        
        if (!result) {
            log('fetch tasks failed: no response')
            return
        }
        
        const r = result as any
        let tasksArray: any[] = []
        if (Array.isArray(r)) {
            tasksArray = r
        } else if (r?.printTasks && Array.isArray(r.printTasks)) {
            tasksArray = r.printTasks
        }
        
        if (tasksArray.length === 0) {
            log('no pending print tasks')
            return
        }
        
        const files: PrintFileInfo[] = []
        
        for (const task of tasksArray) {
            const taskId = task.id || ''
            const printer = task.printer || {}
            const duplex = task.duplex ?? true
            const tumble = task.tumble ?? false
            const printFiles = task.printFiles || []
            
            for (const pf of printFiles) {
                if (pf.id && pf.fileId) {
                    files.push({
                        id: pf.id,
                        printTaskId: taskId,
                        fileId: pf.fileId,
                        filename: pf.filename || pf.fileId,
                        printerName: printer.name || '',
                        duplex,
                        tumble
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
