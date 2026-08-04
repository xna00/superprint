import { useState, useEffect, lazy, Suspense } from 'react'
import * as gui from 'gui'
import * as os from 'os'
import { Tab } from 'quickwin/lib/react-qw/index.js'
import { api } from './api.js'
import { getDeviceId, getComputerName } from './device.js'
import { enumLocalPrinters, type LocalPrinterInfo } from './printer.js'
import { connectWs } from './ws.js'
import { pushLog } from './log-store.js'
import { PrintersTab } from './components/PrintersTab.js'
import { LogsPanel } from './components/LogsPanel.js'


const SettingsTab = lazy(() => import('./components/SettingsTab.js').then(m => ({ default: m.SettingsTab })))


const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

export function App() {
    const [appState, setAppState] = useState<'loading' | 'main'>('loading')
    const [computerId, setComputerId] = useState('')
    const [computerName, setComputerName] = useState('')
    const [printers, setPrinters] = useState<LocalPrinterInfo[]>([])
    const [wsStatus, setWsStatus] = useState('未连接')

    const init = async () => {
        const devId = getDeviceId()
        if (!devId) {
            pushLog('[device] cannot get device ID')
            setAppState('main')
            return
        }
        const compName = getComputerName() || 'Unknown'
        setComputerId(devId)
        setComputerName(compName)
        pushLog('[device] ID: ' + devId)
        pushLog('[device] name: ' + compName)

        try {
            pushLog('[computer] registering device...')
            await api.computer.addComputer(devId, compName)
            pushLog('[computer] registered successfully')
        } catch (e) {
            pushLog('[computer] registration error: ' + String(e))
        }

        try {
            const info = await api.computer.computerInfo(devId)
            if (info?.name) {
                setComputerName(info.name)
                pushLog('[computer] server name: ' + info.name)
            }
        } catch (e) {
            pushLog('[computer] fetch name failed: ' + String(e))
        }

        await syncPrinters(devId)
        os.setTimeout(() => connectWs(pushLog, setWsStatus), 500)
        setAppState('main')
    }

    const syncPrinters = async (devId: string) => {
        const localPrinters = enumLocalPrinters()
        pushLog('[printer] local printers: ' + localPrinters.length + ' -> ' + JSON.stringify(localPrinters.map(p => p.name)))
        try {
            const syncRes = await api.computer.syncPrinters(devId, localPrinters.map(p => ({ name: p.name, port: p.port, driver: p.driver })))
            pushLog('[printer] syncPrinters response: ' + JSON.stringify(syncRes))
            const info = await api.computer.computerInfo(devId)
            pushLog('[printer] computerInfo response: ' + JSON.stringify(info))
            if (info && info.printers) {
                const serverMap: Record<string, boolean> = {}
                for (const sp of info.printers) {
                    serverMap[sp.name] = sp.enabled
                }
                pushLog('[printer] serverMap: ' + JSON.stringify(serverMap))
                const mapped = localPrinters.map(p => ({
                    ...p,
                    enabled: Boolean(serverMap[p.name]),
                }))
                pushLog('[printer] mapped printers: ' + JSON.stringify(mapped.map(p => ({ name: p.name, enabled: p.enabled }))))
                setPrinters(mapped)
            } else {
                pushLog('[printer] computerInfo returned no printers field')
            }
        } catch (e) {
            pushLog('[printer] sync failed: ' + String(e))
        }
    }

    const togglePrinter = async (printerName: string, enable: boolean) => {
        try {
            if (enable) {
                await api.computer.addComputerPrinter(computerId, printerName)
            } else {
                await api.computer.removeComputerPrinter(computerId, printerName)
            }
            const info = await api.computer.computerInfo(computerId)
            if (info && info.printers) {
                const serverMap: Record<string, boolean> = {}
                for (const sp of info.printers) {
                    serverMap[sp.name] = sp.enabled
                }
                setPrinters(prev => prev.map(p => ({
                    ...p,
                    enabled: Boolean(serverMap[p.name]),
                })))
            }
        } catch (e) {
            pushLog('[printer] toggle failed: ' + String(e))
        }
    }

    const saveComputerName = async (name: string) => {
        try {
            await api.computer.setComputerName(computerId, name)
            const info = await api.computer.computerInfo(computerId)
            setComputerName(info?.name ?? name)
            pushLog('[computer] name saved: ' + name)
        } catch (e) {
            pushLog('[computer] save name failed: ' + String(e))
        }
    }

    const resetComputerName = async () => {
        const name = getComputerName() || 'Unknown'
        await saveComputerName(name)
    }

    useEffect(() => {
        os.setTimeout(init, 500)
    }, [])

    if (appState === 'loading') {
        return <w type="STATIC" ws={VISIBLE} text="正在加载..." style={{ flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }} />
    }

    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', flexGrow: 1 }}>
            <Tab defaultSelectedIndex={0} tabs={[
                {
                    title: '打印机',
                    content: (
                        <PrintersTab
                            computerId={computerId}
                            computerName={computerName}
                            wsStatus={wsStatus}
                            printers={printers}
                            onTogglePrinter={togglePrinter}
                            onSaveComputerName={saveComputerName}
                            onResetComputerName={resetComputerName}
                        />
                    )
                },
                {
                    title: '日志',
                    content: <LogsPanel />
                },
                {
                    title: '设置',
                    content: <Suspense fallback={null}><SettingsTab /></Suspense>,
                },
            ]} style={{ flexGrow: 1 }} />
        </w>
    )
}