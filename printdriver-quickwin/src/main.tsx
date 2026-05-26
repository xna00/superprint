import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import 'quickwin/lib/websocket.js'
import * as gui from 'gui'
import * as os from 'os'
import { useState, useEffect, useRef } from 'quickwin/lib/preact/hooks.js'
import { render, notifyResize, scaleFactor } from 'quickwin/lib/preact/render.js'
import { api, getCookie } from './api.js'
import { getDeviceId, getComputerName } from './device.js'
import { enumLocalPrinters, getDefaultPrinter, printJpegPages } from './printer.js'
import { setLogger, handleWsMessage } from './print-queue.js'
import { WS_URLS } from './config.js'

const winW = 600 * scaleFactor
const winH = 400 * scaleFactor
const scr = gui.GetScreenSize()
const winX = Math.max(0, (scr[0] - winW) / 2)
const winY = Math.max(0, (scr[1] - winH) / 2)

gui.RegisterClass('TestWin', (hwnd, msg, wParam, lParam) => {
    switch (msg) {
        case gui.WmMsg.DESTROY:
            gui.PostQuitMessage(0)
            return 0
        case gui.WmMsg.SIZE:
            notifyResize(hwnd)
            return 0
    }
    return gui.DefWindowProc(hwnd, msg, wParam, lParam)
})

const hwnd = gui.CreateWindow('TestWin', 'SuperPrint',
    gui.WindowStyle.OVERLAPPEDWINDOW,
    winX, winY, winW, winH, null, null)

let ws: WebSocket | null = null

function App() {
    const [tab, setTab] = useState(0)
    const [loggedIn, setLoggedIn] = useState(false)
    const [username, setUsername] = useState('')
    const [computerId, setComputerId] = useState('')
    const [computerName, setComputerName] = useState('')
    const [printers, setPrinters] = useState<string[]>([])
    const [wsStatus, setWsStatus] = useState('disconnected')
    const logBoxRef = useRef<number | null>(null)
    const usernameRef = useRef<number | null>(null)
    const passwordRef = useRef<number | null>(null)

    const addLog = (msg: string) => {
        console.log('[log]', msg)
        if (logBoxRef.current) {
            gui.SendMessage(logBoxRef.current as gui.HWND, gui.LbMsg.ADDSTRING, 0, msg)
        }
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
        const user = gui.GetWindowText(usernameRef.current! as gui.HWND)
        const pass = gui.GetWindowText(passwordRef.current! as gui.HWND)
        if (!user || !pass) {
            addLog('[login] username and password required')
            return
        }
        addLog('[login] logging in as ' + user)
        try {
            const result = await api.auth.login({ username: user, password: pass })
            if (result && (result.token || result.username)) {
                setUsername(result.username || user)
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
                    setWsStatus('connected')
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
                        setWsStatus('disconnected')
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

    const printerText = printers.join('\n')
    
    const testPrint = () => {
        addLog('[test] starting test print...')
        const defPrinter = getDefaultPrinter()
        if (!defPrinter) {
            addLog('[test] no default printer')
            return
        }
        addLog('[test] printer: ' + defPrinter)
        
        try {
            const result = printJpegPages([], defPrinter, false, false)
            addLog('[test] result: ' + result)
        } catch (e) {
            addLog('[test] error: ' + String(e))
        }
    }

    if (!loggedIn) {
        return (
            <w style={{ flexDirection: 'column', gap: 8, flexGrow: 1, padding: 40, justifyContent: 'center' }}>
                <w type="static" text="SuperPrint" style={{ height: 28, width: '100%' }} />
                <w type="edit" ref={usernameRef} placeholder="Username" style={{ height: 28, width: '100%' }} />
                <w type="edit" ref={passwordRef} placeholder="Password" password={true} style={{ height: 28, width: '100%' }} />
                <w type="button" text="Login" style={{ height: 30, width: '100%' }} onEvent={(e: any) => {
                    if (e.msg === gui.WmMsg.LBUTTONDOWN) handleLogin()
                }} />
            </w>
        )
    }

    return (
        <w style={{ flexDirection: 'column', padding: 10, gap: 8, flexGrow: 1, width: '100%' }}>
            <w style={{ flexDirection: 'row', gap: 4 }}>
                <w type="button" text="Logs" style={{ width: 60, height: 24 }} onEvent={(e: any) => {
                    if (e.msg === gui.WmMsg.LBUTTONDOWN) setTab(0)
                }} />
                <w type="button" text="Printers" style={{ width: 70, height: 24 }} onEvent={(e: any) => {
                    if (e.msg === gui.WmMsg.LBUTTONDOWN) setTab(1)
                }} />
                <w type="button" text="Test Print" style={{ width: 80, height: 24 }} onEvent={(e: any) => {
                    if (e.msg === gui.WmMsg.LBUTTONDOWN) testPrint()
                }} />
            </w>
            {tab === 0 && (
                <w type="listbox" ref={logBoxRef} style={{ flexGrow: 1, width: '100%' }} />
            )}
            {tab === 1 && (
                <w style={{ flexDirection: 'column', gap: 4, flexGrow: 1, width: '100%' }}>
                    <w type="static" text={'Device ID: ' + computerId} style={{ height: 20, width: '100%' }} />
                    <w type="static" text={'Computer: ' + computerName} style={{ height: 20, width: '100%' }} />
                    <w type="static" text={'User: ' + username} style={{ height: 20, width: '100%' }} />
                    <w type="static" text={'WebSocket: ' + wsStatus} style={{ height: 20, width: '100%' }} />
                    <w type="static" text="Printers:" style={{ height: 20, width: '100%' }} />
                    <w type="static" text={printerText} style={{ flexGrow: 1, width: '100%' }} />
                </w>
            )}
        </w>
    )
}

gui.ShowWindow(hwnd)
render(<App />, hwnd)
