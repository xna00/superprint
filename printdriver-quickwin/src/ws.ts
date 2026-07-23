import 'quickwin/lib/websocket.js'
import * as os from 'os'
import { getCookie } from './storage.js'
import { getDeviceId } from './device.js'
import { handleWsMessage } from './print-queue.js'
import { WS_URLS, WS_TIMEOUT } from './config.js'

let ws: WebSocket | null = null
let lastMsgTime = 0
let wsTimeoutTimer: ReturnType<typeof os.setTimeout> | null = null
let wsLog: ((msg: string) => void) | null = null
let _lastAddLog: ((msg: string) => void) | null = null
let _lastSetWsStatus: ((s: string) => void) | null = null
const WS_TIMEOUT_CHECK = 10000

function checkWsTimeout() {
    if (ws && Date.now() - lastMsgTime > WS_TIMEOUT) {
        wsLog?.('[ws] no message for ' + WS_TIMEOUT + 'ms, closing')
        ws.close()
        return
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
    wsLog = null
    if (ws) {
        ws.onclose = null
        ws.close()
        ws = null
    }
}

export async function connectWs(addLog: (msg: string) => void, setWsStatus: (s: string) => void) {
    wsLog = addLog
    _lastAddLog = addLog
    _lastSetWsStatus = setWsStatus
    const cookie = getCookie()
    if (!cookie) {
        addLog('[ws] no cookie, skip connection')
        return
    }
    const devId = getDeviceId()
    if (!devId) {
        addLog('[ws] no device ID, skip connection')
        return
    }

    for (const wsUrl of WS_URLS) {
        addLog('[ws] connecting to ' + wsUrl)
        try {
            const w = new WebSocket(wsUrl, {
                headers: {
                    'Cookie': cookie,
                    'X-Computer-ID': devId
                }
            })
            const ok = await new Promise<boolean>(resolve => {
                w.onopen = () => resolve(true)
                w.onerror = () => resolve(false)
                os.setTimeout(() => resolve(false), 10000)
            })
            if (ok) {
                ws = w
                lastMsgTime = Date.now()
                wsTimeoutTimer = os.setTimeout(checkWsTimeout, WS_TIMEOUT_CHECK)
                setWsStatus('已连接')
                addLog('[ws] connected')
                w.onmessage = (ev: MessageEvent) => {
                    const data = ev.data
                    if (typeof data === 'string' && data) {
                        lastMsgTime = Date.now()
                        addLog('[ws] received: ' + data.slice(0, 80))
                        handleWsMessage(data, devId)
                    }
                }
                w.onclose = () => {
                    clearWsTimeout()
                    ws = null
                    setWsStatus('未连接')
                    addLog('[ws] connection closed')
                    wsLog = null
                    os.setTimeout(() => connectWs(addLog, setWsStatus), 5000)
                }
                w.onerror = () => {
                    addLog('[ws] connection error')
                }
                return
            }
            w.close()
        } catch (e) {
            addLog('[ws] error: ' + String(e))
        }
    }
    addLog('[ws] all URLs failed, retry in 10s')
    os.setTimeout(() => connectWs(addLog, setWsStatus), 10000)
}

export function resetWs() {
    cleanupWs()
    if (_lastAddLog && _lastSetWsStatus) {
        _lastAddLog('[ws] resetting connection after wake')
        os.setTimeout(() => connectWs(_lastAddLog!, _lastSetWsStatus!), 1000)
    }
}
