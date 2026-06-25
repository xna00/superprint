import { useState, useEffect, useRef } from 'react'
import * as gui from 'gui'
import * as os from 'os'
import { Tab, ListBox } from 'quickwin/lib/react-qw/index.js'
import { api } from './api.js'
import { getDeviceId, getComputerName } from './device.js'
import { enumLocalPrinters, getDefaultPrinter } from './printer.js'
import { setLogger } from './print-queue.js'
import { connectWs } from './ws.js'
import { LoginForm } from './components/LoginForm.js'
import { PrintersTab } from './components/PrintersTab.js'

const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

interface AppProps {
    cw: number
    ch: number
}

export function App({ cw, ch }: AppProps) {
    const [loggedIn, setLoggedIn] = useState(false)
    const [username, setUsername] = useState('')
    const [loginUser, setLoginUser] = useState('')
    const [loginPass, setLoginPass] = useState('')
    const [computerId, setComputerId] = useState('')
    const [computerName, setComputerName] = useState('')
    const [printers, setPrinters] = useState<string[]>([])
    const [wsStatus, setWsStatus] = useState('未连接')
    const [logs, setLogs] = useState<string[]>([])
    const logListRef = useRef<gui.HWND>(null)
    const MAX_LOG = 200

    const addLog = (msg: string) => {
        const d = new Date()
        const ts = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
        const line = `[${ts}] ${msg}`
        console.log('[log]', line)
        setLogs(prev => [...prev.slice(-(MAX_LOG - 1)), line])
    }

    useEffect(() => {
        setLogger(addLog)
    }, [])

    useEffect(() => {
        if (!logListRef.current) return
        const lbHwnd = gui.GetWindow(logListRef.current, 5)
        if (lbHwnd) {
            const count = gui.SendMessage(lbHwnd, 395, 0, 0)
            gui.SendMessage(lbHwnd, 407, Math.max(0, count - 1), 0)
        }
    }, [logs])

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
        } catch (e: unknown) {
            addLog('[api] error: ' + (e instanceof Error ? e.message : String(e)))
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
                os.setTimeout(() => connectWs(addLog, setWsStatus), 500)
            } else {
                addLog('[login] failed: ' + JSON.stringify(result))
            }
        } catch (e: unknown) {
            addLog('[login] error: ' + (e instanceof Error ? e.message : String(e)))
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
        } catch (e: unknown) {
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

    useEffect(() => {
        const devId = getDeviceId()
        if (devId) {
            setComputerId(devId)
            addLog('[device] ID: ' + devId)
        }

        const compName = getComputerName()
        if (compName) {
            setComputerName(compName)
            addLog('[device] name: ' + compName)
        }

        const localPrinters = enumLocalPrinters()
        setPrinters(localPrinters.map(p => p.name))
        addLog('[printer] found ' + localPrinters.length + ' printers')

        const defPrinter = getDefaultPrinter()
        if (defPrinter) {
            addLog('[printer] default: ' + defPrinter)
        }

        os.setTimeout(async () => {
            const ok = await checkUser()
            if (ok) {
                setLoggedIn(true)
                await registerComputer()
                await syncPrinters()
                os.setTimeout(() => connectWs(addLog, setWsStatus), 500)
            }
        }, 500)
    }, [])

    if (!loggedIn) {
        return (
            <LoginForm
                cw={cw}
                ch={ch}
                loginUser={loginUser}
                setLoginUser={setLoginUser}
                loginPass={loginPass}
                setLoginPass={setLoginPass}
                handleLogin={handleLogin}
            />
        )
    }

    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', x: 0, y: 0, width: cw, height: ch }}>
            <Tab tabs={[
                {
                    title: '打印机',
                    content: (
                        <PrintersTab
                            computerId={computerId}
                            computerName={computerName}
                            username={username}
                            wsStatus={wsStatus}
                            printers={printers}
                        />
                    )
                },
                {
                    title: '日志',
                    content: <ListBox ref={logListRef} items={logs} style={{ flexGrow: 1 }} />
                },
            ]} style={{ flexGrow: 1 }} />
        </w>
    )
}
