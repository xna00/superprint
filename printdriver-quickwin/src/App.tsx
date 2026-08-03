import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import * as gui from 'gui'
import * as os from 'os'
import { Tab, ListBox } from 'quickwin/lib/react-qw/index.js'
import { api } from './api.js'
import { getDeviceId, getComputerName } from './device.js'
import { enumLocalPrinters, type LocalPrinterInfo } from './printer.js'
import { setLogger } from './print-queue.js'
import { connectWs } from './ws.js'
import { logger } from './logger.js'
import { toCST } from './utils.js'
import { PrintersTab } from './components/PrintersTab.js'


const SettingsTab = lazy(() => import('./components/SettingsTab.js').then(m => ({ default: m.SettingsTab })))


const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

export function App() {
    const [appState, setAppState] = useState<'loading' | 'main'>('loading')
    const [computerId, setComputerId] = useState('')
    const [computerName, setComputerName] = useState('')
    const [printers, setPrinters] = useState<LocalPrinterInfo[]>([])
    const [wsStatus, setWsStatus] = useState('未连接')
    const [logs, setLogs] = useState<string[]>([])
    const logListRef = useRef<gui.HWND>(null)
    const MAX_LOG = 100

    const addLog = (msg: string) => {
        const local8 = toCST()
        const ts = `${local8.getUTCMonth()+1}/${local8.getUTCDate()} ${String(local8.getUTCHours()).padStart(2,'0')}:${String(local8.getUTCMinutes()).padStart(2,'0')}:${String(local8.getUTCSeconds()).padStart(2,'0')}`
        const line = `[${ts}] ${msg}`
        logger.log('[log]', line)
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

    const init = async () => {
        const devId = getDeviceId()
        if (!devId) {
            addLog('[device] cannot get device ID')
            setAppState('main')
            return
        }
        const compName = getComputerName() || 'Unknown'
        setComputerId(devId)
        setComputerName(compName)
        addLog('[device] ID: ' + devId)
        addLog('[device] name: ' + compName)

        try {
            addLog('[computer] registering device...')
            await api.computer.addComputer(devId, compName)
            addLog('[computer] registered successfully')
        } catch (e) {
            addLog('[computer] registration error: ' + String(e))
        }

        await syncPrinters(devId)
        os.setTimeout(() => connectWs(addLog, setWsStatus), 500)
        setAppState('main')
    }

    const syncPrinters = async (devId: string) => {
        const localPrinters = enumLocalPrinters()
        try {
            await api.computer.syncPrinters(devId, localPrinters.map(p => ({ name: p.name, port: p.port, driver: p.driver })))
            const info = await api.computer.computerInfo(devId) as any
            if (info && info.printers) {
                const serverMap: Record<string, boolean> = {}
                for (const sp of info.printers) {
                    serverMap[sp.name] = sp.enabled
                }
                setPrinters(localPrinters.map(p => ({
                    ...p,
                    enabled: Boolean(serverMap[p.name]),
                })))
            }
            addLog('[printer] synced ' + localPrinters.length + ' printers')
        } catch (e) {
            addLog('[printer] sync failed: ' + String(e))
        }
    }

    useEffect(() => {
        os.setTimeout(init, 500)
    }, [])

    if (appState === 'loading') {
        return <w type="STATIC" ws={VISIBLE} text="正在加载..." style={{ flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }} />
    }

    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', flexGrow: 1 }}>
            <Tab defaultSelectedIndex={2} tabs={[
                {
                    title: '打印机',
                    content: (
                        <PrintersTab
                            computerId={computerId}
                            computerName={computerName}
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
                    content: <Suspense fallback={null}><SettingsTab /></Suspense>,
                },
            ]} style={{ flexGrow: 1 }} />
        </w>
    )
}