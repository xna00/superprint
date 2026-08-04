import { logger } from './logger.js'
import { toCST } from './utils.js'

const MAX_LOG = 100

let lines: string[] = []
let listener: ((lines: string[]) => void) | null = null

export function pushLog(msg: string): void {
    const local8 = toCST()
    const ts = `${local8.getUTCMonth()+1}/${local8.getUTCDate()} ${String(local8.getUTCHours()).padStart(2,'0')}:${String(local8.getUTCMinutes()).padStart(2,'0')}:${String(local8.getUTCSeconds()).padStart(2,'0')}`
    const line = `[${ts}] ${msg}`
    logger.log('[log]', line)
    lines = [...lines.slice(-(MAX_LOG - 1)), line]
    listener?.(lines)
}

export function subscribeLogs(fn: (lines: string[]) => void): () => void {
    listener = fn
    return () => {
        if (listener === fn) listener = null
    }
}

export function getLogs(): string[] {
    return lines
}
