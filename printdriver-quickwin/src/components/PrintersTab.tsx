import { useState } from 'react'
import * as gui from 'gui'
import { ListView, type Column, Button } from 'quickwin/lib/react-qw/index.js'
import type { LocalPrinterInfo } from '../printer.js'

const VISIBLE = gui.WindowStyle.VISIBLE

interface PrinterRow {
    name: string
    status: string
}

interface PrintersTabProps {
    computerId: string
    computerName: string
    username: string
    wsStatus: string
    printers: LocalPrinterInfo[]
}

const columns: Column<PrinterRow>[] = [
    { name: '打印机名', dataIndex: 'name' },
    { name: '状态', dataIndex: 'status' },
]

export function PrintersTab({ computerId, computerName, username, wsStatus, printers }: PrintersTabProps) {
    const [showDeviceId, setShowDeviceId] = useState(false)
    const maskDeviceId = (id: string) =>
        id.length > 12 ? id.slice(0, 8) + '...' + id.slice(-4) : id
    const data: PrinterRow[] = printers.map(p => ({
        name: p.name,
        status: p.enabled ? '启用' : '禁用',
    }))
    return (
        <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'column', gap: 4, flexGrow: 1, padding: 8 }}>
            <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'row', gap: 4, height: 24 }}>
                <w type="STATIC" ws={VISIBLE} text={'设备ID: ' + (showDeviceId ? computerId : maskDeviceId(computerId))} />
                <Button onClick={() => setShowDeviceId(v => !v)} style={{ width: 56, height: 20 }}>{showDeviceId ? '隐藏' : '显示'}</Button>
            </w>
            <w type="STATIC" ws={VISIBLE} text={'计算机: ' + computerName} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text={'用户: ' + username} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text={'连接状态: ' + wsStatus} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text="打印机列表:" style={{ height: 24 }} />
            <ListView columns={columns} data={data} style={{ flexGrow: 1 }} />
        </w>
    )
}
