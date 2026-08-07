import 'quickwin/lib/websocket.js'
import * as os from 'os'
import { getDeviceId } from './device.js'
import { handleWsMessage, handlePrintJob } from './print-queue.js'
import { WS_URLS, WS_TIMEOUT } from './config.js'
import { logger } from './logger.js'

let ws: WebSocket | null = null
let lastMsgTime = 0
let wsTimeoutTimer: ReturnType<typeof os.setTimeout> | null = null
let _lastAddLog: ((msg: string) => void) | null = null
let _lastSetWsStatus: ((s: string) => void) | null = null
const WS_TIMEOUT_CHECK = 10000

function checkWsTimeout() {
    if (ws) {
        const elapsed = Date.now() - lastMsgTime
        if (elapsed > WS_TIMEOUT) {
            logger.log(`[ws] timeout: no message for ${elapsed}ms (> ${WS_TIMEOUT}), closing`)
            ws.close()
            return
        }
        logger.log(`[ws] timeout check: last message ${elapsed}ms ago, ok`)
    }
    wsTimeoutTimer = os.setTimeout(checkWsTimeout, WS_TIMEOUT_CHECK)
}

function clearWsTimeout() {
    if (wsTimeoutTimer !== null) {
        os.clearTimeout(wsTimeoutTimer)
        wsTimeoutTimer = null
    }
}

export function cleanupWs() {
    clearWsTimeout()
    _lastAddLog = null
    _lastSetWsStatus = null
    if (ws) {
        logger.log(`[ws] cleanupWs: closing ws, readyState=${ws.readyState}`)
        ws.onclose = null
        ws.close()
        ws = null
    } else {
        logger.log(`[ws] cleanupWs: no ws to close`)
    }
}

export async function connectWs(addLog: (msg: string) => void, setWsStatus: (s: string) => void) {
    _lastAddLog = addLog
    _lastSetWsStatus = setWsStatus
    const devId = getDeviceId()
    if (!devId) {
        addLog('[ws] no device ID, skip connection')
        logger.log('[ws] connectWs: no device ID, abort')
        return
    }

    logger.log(`[ws] connectWs: starting, ${WS_URLS.length} URLs to try`)
    for (let i = 0; i < WS_URLS.length; i++) {
        const wsUrl = WS_URLS[i]
        addLog('[ws] connecting to ' + wsUrl)
        logger.log(`[ws] attempt ${i + 1}/${WS_URLS.length}: ${wsUrl}`)
        try {
            const t0 = Date.now()
            const w = new WebSocket(wsUrl, {
                headers: {
                    'X-Computer-ID': devId
                }
            })
            logger.log(`[ws] socket created, waiting for open/error...`)
            const ok = await new Promise<boolean>(resolve => {
                w.onopen = () => { logger.log(`[ws] onopen fired`); resolve(true) }
                w.onerror = (e: any) => { logger.log(`[ws] onerror fired: ${e?.message || e}`); resolve(false) }
                os.setTimeout(() => { logger.log(`[ws] connect timeout (10s)`); resolve(false) }, 10000)
            })
            const elapsed = Date.now() - t0
            if (ok) {
                ws = w
                lastMsgTime = Date.now()
                wsTimeoutTimer = os.setTimeout(checkWsTimeout, WS_TIMEOUT_CHECK)
                setWsStatus('已连接')
                addLog('[ws] connected')
                logger.log(`[ws] connected in ${elapsed}ms`)
                handlePrintJob(devId)
                w.onmessage = (ev: MessageEvent) => {
                    const data = ev.data
                    if (typeof data === 'string' && data) {
                        lastMsgTime = Date.now()
                        addLog('[ws] received: ' + data.slice(0, 80))
                        handleWsMessage(data, devId)
                    }
                }
                w.onclose = (ev: any) => {
                    clearWsTimeout()
                    const reason = ev?.reason || 'unknown'
                    const code = ev?.code || 0
                    logger.log(`[ws] onclose: code=${code} reason=${reason}`)
                    ws = null
                    setWsStatus('未连接')
                    addLog('[ws] connection closed')
                    _lastAddLog = null
                    _lastSetWsStatus = null
                    logger.log(`[ws] scheduling reconnect in 5s`)
                    os.setTimeout(() => connectWs(addLog, setWsStatus), 5000)
                }
                w.onerror = () => {
                    logger.log(`[ws] onerror after open`)
                    addLog('[ws] connection error')
                }
                return
            }
            logger.log(`[ws] connection failed in ${elapsed}ms, trying next URL`)
            w.close()
        } catch (e) {
            logger.log(`[ws] exception: ${String(e)}`)
            addLog('[ws] error: ' + String(e))
        }
    }
    addLog('[ws] all URLs failed, retry in 10s')
    logger.log(`[ws] all URLs exhausted, retry in 10s`)
    os.setTimeout(() => connectWs(addLog, setWsStatus), 10000)
}

export function resetWs() {
    logger.log('[ws] resetWs: entering')
    cleanupWs()
    if (_lastAddLog && _lastSetWsStatus) {
        _lastAddLog('[ws] resetting connection after wake')
        logger.log('[ws] resetWs: scheduling reconnect in 1s')
        os.setTimeout(() => {
            logger.log('[ws] resetWs: reconnect timer fired, calling connectWs')
            connectWs(_lastAddLog!, _lastSetWsStatus!)
        }, 1000)
    } else {
        logger.log('[ws] resetWs: no log/status callbacks, skipping reconnect')
    }
}
