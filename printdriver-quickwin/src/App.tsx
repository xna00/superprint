import { useState, useEffect, useRef } from 'react'
import * as gui from 'gui'
import * as os from 'os'
import { Tab, ListBox } from 'quickwin/lib/react-qw/index.js'
import { api } from './api.js'
import { getDeviceId, getComputerName } from './device.js'
import { enumLocalPrinters, getDefaultPrinter, type LocalPrinterInfo } from './printer.js'
import { setLogger } from './print-queue.js'
import { connectWs } from './ws.js'
import { LoginForm } from './components/LoginForm.js'
import { PrintersTab } from './components/PrintersTab.js'
import { SettingsTab } from './components/SettingsTab.js'
import { QRTestTab } from './components/QRTestTab.js'

const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

interface AppProps {}

export function App(_props: AppProps) {
    const [appState, setAppState] = useState<'loading' | 'login' | 'main'>('loading')
    const [username, setUsername] = useState('')
    const [loginUser, setLoginUser] = useState('')
    const [loginPass, setLoginPass] = useState('')
    const [computerId, setComputerId] = useState('')
    const [computerName, setComputerName] = useState('')
    const [printers, setPrinters] = useState<LocalPrinterInfo[]>([])
    const [wsStatus, setWsStatus] = useState('未连接')
    const [logs, setLogs] = useState<string[]>([])
    const logListRef = useRef<gui.HWND>(null)
    const MAX_LOG = 100

    const addLog = (msg: string) => {
        const now = new Date()
        const local8 = new Date(now.getTime() + 8 * 3600000)
        const ts = `${local8.getUTCMonth()+1}/${local8.getUTCDate()} ${String(local8.getUTCHours()).padStart(2,'0')}:${String(local8.getUTCMinutes()).padStart(2,'0')}:${String(local8.getUTCSeconds()).padStart(2,'0')}`
        const line = `[${ts}] ${msg}`
        console.log('[log]', line)
        setLogs(prev => [...prev.slice(-(MAX_LOG - 1)), line])
    }

    useEffect(() => {
        setLogger(addLog)
    }, [])

    useEffect(() => {
        if (!logListRef.current) return
        const lbHwnd = gui.GetWindow(logListRef.current, gui.GetWindowCmd.CHILD)
        if (lbHwnd) {
            const count = gui.SendMessage(lbHwnd, gui.LbMsg.GETCOUNT, 0, 0)
            gui.SendMessage(lbHwnd, gui.LbMsg.SETTOPINDEX, Math.max(0, count - 1), 0)
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
                setAppState('main')
                await registerComputer()
                await syncPrinters()
                os.setTimeout(() => connectWs(addLog, setWsStatus), 500)
                return
            } else {
                addLog('[api] not logged in')
            }
        } catch (e: unknown) {
            addLog('[api] error: ' + (e instanceof Error ? e.message : String(e)))
        }
        setAppState('login')
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
                setAppState('main')
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
            const info = await api.computer.computerInfo(devId) as any
            if (info && info.printers) {
                const serverMap: Record<string, boolean> = {}
                for (const sp of info.printers) {
                    serverMap[sp.name] = !sp.disabled
                }
                setPrinters(localPrinters.map(p => ({
                    ...p,
                    enabled: serverMap[p.name] !== undefined ? serverMap[p.name] : true,
                })))
            }
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
        setPrinters(localPrinters)
        addLog('[printer] found ' + localPrinters.length + ' printers')

        const defPrinter = getDefaultPrinter()
        if (defPrinter) {
            addLog('[printer] default: ' + defPrinter)
        }

        os.setTimeout(checkUser, 500)
    }, [])

    if (appState === 'loading') {
        return <w type="STATIC" ws={VISIBLE} text="正在加载..." style={{ flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }} />
    }
    if (appState === 'login') {
        return (
            <LoginForm
                loginUser={loginUser}
                setLoginUser={setLoginUser}
                loginPass={loginPass}
                setLoginPass={setLoginPass}
                handleLogin={handleLogin}
            />
        )
    }

    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', flexGrow: 1 }}>
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
                    content: <ListBox ref={logListRef} items={logs} scrollToBottom={true} style={{ flexGrow: 1 }} />
                },
                {
                    title: '设置',
                    content: <SettingsTab />,
                },
                {
                    title: '二维码测试',
                    content: <QRTestTab />,
                },
            ]} style={{ flexGrow: 1 }} />
        </w>
    )
}
