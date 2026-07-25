import { toCST } from './utils.js'
import * as std from 'std'
import * as win from 'win'

function ts(): string {
    const d = toCST()
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${String(d.getUTCMilliseconds()).padStart(3, '0')}`
}

function dateStr(): string {
    const d = toCST()
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

let _logFile: std.FILE | null = null
let _logFileOpened = false

function getLogFile(): std.FILE | null {
    if (_logFileOpened) return _logFile
    _logFileOpened = true
    try {
        const exePath = win.GetModuleFileName() || ''
        const sep = exePath.lastIndexOf('\\')
        const dir = sep >= 0 ? exePath.substring(0, sep) : '.'
        const path = dir + '\\superprint-debug.log'
        _logFile = std.open(path, 'a')
        if (_logFile) {
            _logFile.puts(`\n=== superprint-debug start ${dateStr()} ${ts()} ===\n`)
            _logFile.flush()
        }
    } catch (_) {
        // fallback: 只写 console
    }
    return _logFile
}

function writeLog(level: string, args: any[]) {
    const prefix = `[${ts()}] [${level}]`
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
    const line = `${prefix} ${msg}`
    console.log(line)
    const f = getLogFile()
    if (f) {
        f.puts(line + '\n')
        f.flush()
    }
}

export const logger = {
    log(...args: any[]) {
        writeLog('log', args)
    },
    error(...args: any[]) {
        writeLog('error', args)
    },
}
