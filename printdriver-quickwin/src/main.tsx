import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import 'quickwin/lib/websocket.js'
import * as gui from 'gui'
import * as os from 'os'
import { useState, useEffect } from 'react'
import { render, Button, Input, Tab, ListBox } from 'quickwin/lib/react-qw/index.js'
import { api, getCookie } from './api.js'
import { getDeviceId, getComputerName } from './device.js'
import { enumLocalPrinters, getDefaultPrinter } from './printer.js'
import { setLogger, handleWsMessage } from './print-queue.js'
import { WS_URLS } from './config.js'

const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

const winW = 600
const winH = 400
const scr = gui.GetScreenSize()
const winX = Math.max(0, (scr[0] - winW) / 2)
const winY = Math.max(0, (scr[1] - winH) / 2)

gui.RegisterClass('TestWin', (hwnd, msg, wParam, lParam) => {
    if (msg === gui.WmMsg.DESTROY) {
        if (ws) {
            ws.onclose = null
            ws.close()
            ws = null
        }
        gui.PostQuitMessage(0)
        return 0
    }
    return gui.DefWindowProc(hwnd, msg, wParam, lParam)
})

const hwnd = gui.CreateWindow('TestWin', 'SuperPrint',
    gui.WindowStyle.OVERLAPPEDWINDOW,
    winX, winY, winW, winH, null, null)

const cr = hwnd ? gui.GetClientRect(hwnd) : null
const cw = cr ? cr.right - cr.left : winW
const ch = cr ? cr.bottom - cr.top : winH

let ws: WebSocket | null = null

function App() {
    const [loggedIn, setLoggedIn] = useState(false)
    const [username, setUsername] = useState('')
    const [loginUser, setLoginUser] = useState('')
    const [loginPass, setLoginPass] = useState('')
    const [computerId, setComputerId] = useState('')
    const [computerName, setComputerName] = useState('')
    const [printers, setPrinters] = useState<string[]>([])
    const [wsStatus, setWsStatus] = useState('未连接')
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => {
        console.log('[log]', msg)
        setLogs(prev => [...prev, msg])
    }

    setLogger(addLog)

    const checkUser = async () => {
        try {
            addLog('[api] checking user...')
            const data = await api.user.currentUser()
            console.log('[api] user:', JSON.stringify(data))
            if (data && data.username) {
                setUsername(data.username)
                addLog('[api] logged in: ' + data.username)
                return true
            } else {
                addLog('[api] not logged in')
                return false
            }
        } catch (e: any) {
            addLog('[api] error: ' + (e.message || String(e)))
            return false
        }
    }

    const handleLogin = async () => {
        if (!loginUser || !loginPass) {
            addLog('[login] username and password required')
            return
        }
        addLog('[login] logging in as ' + loginUser)
        try {
            const result = await api.auth.login({ username: loginUser, password: loginPass })
            if (result && (result.token || result.username)) {
                setUsername(result.username || loginUser)
                setLoggedIn(true)
                addLog('[login] success')
                await registerComputer()
                await syncPrinters()
                os.setTimeout(() => connectWs(), 500)
            } else {
                addLog('[login] failed: ' + JSON.stringify(result))
            }
        } catch (e: any) {
            addLog('[login] error: ' + (e.message || String(e)))
        }
    }

    const registerComputer = async () => {
        const devId = getDeviceId()
        if (!devId) {
            addLog('[computer] cannot get device ID')
            return
        }
        const compName = getComputerName() || 'Unknown'
        try {
            addLog('[computer] registering device...')
            const result = await api.computer.addComputer(devId, compName)
            if (result) {
                addLog('[computer] registered successfully')
            } else {
                addLog('[computer] registration failed')
            }
        } catch (e) {
            addLog('[computer] registration error: ' + String(e))
        }
    }

    const syncPrinters = async () => {
        const devId = getDeviceId()
        if (!devId) return
        const localPrinters = enumLocalPrinters()
        try {
            for (const p of localPrinters) {
                await api.computer.addComputerPrinter(devId, p.name)
            }
            addLog('[printer] synced ' + localPrinters.length + ' printers')
        } catch (e) {
            addLog('[printer] sync failed: ' + String(e))
        }
    }

    const connectWs = async () => {
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
                        os.setTimeout(() => connectWs(), 5000)
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
        os.setTimeout(() => connectWs(), 10000)
    }

    useEffect(() => {
        const devId = getDeviceId()
        console.log('[device] id:', devId)
        if (devId) {
            setComputerId(devId)
            addLog('[device] ID: ' + devId)
        }

        const compName = getComputerName()
        console.log('[device] name:', compName)
        if (compName) {
            setComputerName(compName)
            addLog('[device] name: ' + compName)
        }

        const localPrinters = enumLocalPrinters()
        console.log('[printer] count:', localPrinters.length)
        setPrinters(localPrinters.map(p => p.name))
        addLog('[printer] found ' + localPrinters.length + ' printers')

        const defPrinter = getDefaultPrinter()
        console.log('[printer] default:', defPrinter)
        if (defPrinter) {
            addLog('[printer] default: ' + defPrinter)
        }

        os.setTimeout(async () => {
            const ok = await checkUser()
            if (ok) {
                setLoggedIn(true)
                await registerComputer()
                await syncPrinters()
                os.setTimeout(() => connectWs(), 500)
            }
        }, 500)
    }, [])

    if (!loggedIn) {
        return (
            <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', gap: 8, padding: 40, justifyContent: 'center', x: 0, y: 0, width: cw, height: ch }}>
                <w type="STATIC" ws={VISIBLE} text="SuperPrint" style={{ height: 28 }} />
                <Input value={loginUser} onChange={setLoginUser} placeholder="用户名" style={{ height: 28 }} />
                <Input value={loginPass} onChange={setLoginPass} password={true} placeholder="密码" style={{ height: 28 }} />
                <Button onClick={handleLogin} style={{ height: 30 }}>登录</Button>
            </w>
        )
    }

    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', x: 0, y: 0, width: cw, height: ch }}>
            <Tab tabs={[
                {
                    title: '日志',
                    content: <ListBox items={logs} style={{ flexGrow: 1 }} />
                },
                {
                    title: '打印机',
                    content: (
                        <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'column', gap: 4, flexGrow: 1 }}>
                            <w type="STATIC" ws={VISIBLE} text={'设备ID: ' + computerId} style={{ height: 20 }} />
                            <w type="STATIC" ws={VISIBLE} text={'计算机: ' + computerName} style={{ height: 20 }} />
                            <w type="STATIC" ws={VISIBLE} text={'用户: ' + username} style={{ height: 20 }} />
                            <w type="STATIC" ws={VISIBLE} text={'连接状态: ' + wsStatus} style={{ height: 20 }} />
                            <w type="STATIC" ws={VISIBLE} text="打印机列表:" style={{ height: 20 }} />
                            <ListBox items={printers} style={{ flexGrow: 1 }} />
                        </w>
                    )
                },
            ]} style={{ flexGrow: 1 }} />
        </w>
    )
}

if (hwnd) {
    render(<App />, hwnd)
    gui.ShowWindow(hwnd)
}
