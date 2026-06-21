import * as os from 'os'
import { getCookie } from './api.js'
import { getDeviceId } from './device.js'
import { handleWsMessage } from './print-queue.js'
import { WS_URLS } from './config.js'

let ws: WebSocket | null = null

export function cleanupWs() {
    if (ws) {
        ws.onclose = null
        ws.close()
        ws = null
    }
}

export async function connectWs(addLog: (msg: string) => void, setWsStatus: (s: string) => void) {
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
                setWsStatus('已连接')
                addLog('[ws] connected')
                w.onmessage = (ev: any) => {
                    const data = ev.data
                    if (typeof data === 'string' && data) {
                        addLog('[ws] received: ' + data.slice(0, 80))
                        handleWsMessage(data, devId)
                    }
                }
                w.onclose = () => {
                    ws = null
                    setWsStatus('未连接')
                    addLog('[ws] connection closed')
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
