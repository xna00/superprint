import { toCST } from './utils.js'

function ts(): string {
    const d = toCST()
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${String(d.getUTCMilliseconds()).padStart(3, '0')}`
}

export const logger = {
    log(...args: any[]) {
        console.log(`[${ts()}]`, ...args)
    },
    error(...args: any[]) {
        console.error(`[${ts()}]`, ...args)
    },
}
