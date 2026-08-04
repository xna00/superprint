import { useState, useEffect } from 'react'
import * as gui from 'gui'
import { ListView, type Column, Button, Input, createRoot } from 'quickwin/lib/react-qw/index.js'
import type { LocalPrinterInfo } from '../printer.js'
import { QRCode } from './QRCode.js'
import { api } from '../api.js'
import { logger } from '../logger.js'

const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

interface PrinterRow {
    name: string
    status: string
    action: string
    qr: string
    enabled: boolean
}

interface PrintersTabProps {
    computerId: string
    computerName: string
    
    wsStatus: string
    printers: LocalPrinterInfo[]
    onTogglePrinter: (printerName: string, enable: boolean) => void
    onSaveComputerName: (name: string) => Promise<void>
    onResetComputerName: () => Promise<void>
}

export function PrintersTab({ computerId, computerName, wsStatus, printers, onTogglePrinter, onSaveComputerName, onResetComputerName }: PrintersTabProps) {
    const columns: Column<PrinterRow>[] = [
        { name: '打印机名', dataIndex: 'name' },
        { name: '状态', dataIndex: 'status' },
        {
            name: '操作',
            dataIndex: 'action',
            width: 60,
            align: 'center',
            cellStyle: { color: 0xFF0000, underline: true, cursor: 32649 },
            onCellClick: (record) => onTogglePrinter(record.name, record.action === '启用'),
        },
        {
            name: '二维码',
            dataIndex: 'qr',
            width: 90,
            align: 'center',
            cellStyle: (record) => record.enabled ? { cursor: 32649 } : { color: 0x808080, cursor: 32648 },
            onCellClick: (record) => { if (record.enabled) showQrWindow(record.name) }
        },
    ]
    const [showDeviceId, setShowDeviceId] = useState(false)
    const [nameDraft, setNameDraft] = useState(computerName)
    useEffect(() => {
        setNameDraft(computerName)
    }, [computerName])
    const maskDeviceId = (id: string) =>
        id.length > 6 ? id.slice(0, 6) + '...' : id
    const showQrWindow = async (name: string) => {
        const size = 220
        let link: string | null = null
        try {
            const res = await api.computer.getPrinterKfLink(name)
            link = res.link
        } catch (e) {
            logger.log('[qr] getPrinterKfLink failed: ' + String(e))
        }
        const root = createRoot({
            text: '打印机二维码',
            width: size + 16,
            height: size + 40,
        })
        root.render(
            <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                <w type="STATIC" ws={VISIBLE} text={name} style={{ height: 24 }} />
                {link
                    ? <QRCode text={link} size={size} />
                    : <w type="STATIC" ws={VISIBLE} text={'获取二维码失败'} style={{ height: 24 }} />}
            </w>
        )
    }
    const data: PrinterRow[] = printers.map(p => ({
        name: p.name,
        status: p.enabled ? '启用' : '禁用',
        action: p.enabled ? '禁用' : '启用',
        qr: '查看',
        enabled: p.enabled,
    }))
    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', gap: 4, flexGrow: 1, padding: 8 }}>
            <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'row', gap: 4, height: 24 }}>
                <w type="STATIC" ws={VISIBLE} text={'设备ID: ' + (showDeviceId ? computerId : maskDeviceId(computerId))} style={{ width: 'auto' }} />
                <Button onClick={() => setShowDeviceId(v => !v)} style={{ width: 56, height: 20 }}>{showDeviceId ? '隐藏' : '显示'}</Button>
            </w>
            <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'row', gap: 4, height: 24 }}>
                <w type="STATIC" ws={VISIBLE} text={'计算机: '} style={{ width: 'auto' }} />
                <Input value={nameDraft} onChange={setNameDraft} style={{ width: 160, height: 20 }} />
                <Button onClick={() => onSaveComputerName(nameDraft.trim())} style={{ width: 50, height: 20 }}>保存</Button>
                <Button onClick={() => onResetComputerName()} style={{ width: 50, height: 20 }}>重置</Button>
            </w>
            <w type="STATIC" ws={VISIBLE} text={'连接状态: ' + wsStatus} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text="打印机列表:" style={{ height: 24 }} />
            <ListView columns={columns} data={data} style={{ flexGrow: 1 }} />
        </w>
    )
}
