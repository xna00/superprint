import { useState } from 'react'
import * as gui from 'gui'
import { ListView, type Column, Button } from 'quickwin/lib/react-qw/index.js'
import type { LocalPrinterInfo } from '../printer.js'

const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

interface PrinterRow {
    name: string
    status: string
    action: string
}

interface PrintersTabProps {
    computerId: string
    computerName: string
    
    wsStatus: string
    printers: LocalPrinterInfo[]
    onTogglePrinter: (printerName: string, enable: boolean) => void
}

export function PrintersTab({ computerId, computerName, wsStatus, printers, onTogglePrinter }: PrintersTabProps) {
    const columns: Column<PrinterRow>[] = [
        { name: '打印机名', dataIndex: 'name' },
        { name: '状态', dataIndex: 'status' },
        {
            name: '操作',
            dataIndex: 'action',
            width: 60,
            align: 'center',
            cellStyle: { color: 0xFF0000, underline: true },
            onCellClick: (record) => onTogglePrinter(record.name, record.action === '启用'),
        },
    ]
    const [showDeviceId, setShowDeviceId] = useState(false)
    const maskDeviceId = (id: string) =>
        id.length > 6 ? id.slice(0, 6) + '...' : id
    const data: PrinterRow[] = printers.map(p => ({
        name: p.name,
        status: p.enabled ? '启用' : '禁用',
        action: p.enabled ? '禁用' : '启用',
    }))
    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', gap: 4, flexGrow: 1, padding: 8 }}>
            <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'row', gap: 4, height: 24 }}>
                <w type="STATIC" ws={VISIBLE} text={'设备ID: ' + (showDeviceId ? computerId : maskDeviceId(computerId))} style={{ width: 'auto' }} />
                <Button onClick={() => setShowDeviceId(v => !v)} style={{ width: 56, height: 20 }}>{showDeviceId ? '隐藏' : '显示'}</Button>
            </w>
            <w type="STATIC" ws={VISIBLE} text={'计算机: ' + computerName} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text={'连接状态: ' + wsStatus} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text="打印机列表:" style={{ height: 24 }} />
            <ListView columns={columns} data={data} style={{ flexGrow: 1 }} />
        </w>
    )
}
