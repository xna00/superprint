import { useState, useEffect } from 'react'
import * as gui from 'gui'
import { ListView, type Column, Button, Input, createRoot } from 'quickwin/lib/react-qw/index.js'
import type { LocalPrinterInfo } from '../printer.js'
import { QRCode } from './QRCode.js'
import { api } from '../api.js'
import { logger } from '../logger.js'
import jpeg from 'jpeg-js'

const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

interface PrinterRow {
    name: string
    status: string
    action: string
    qr: string
    manage: string
    enabled: boolean
    id: number | null
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

async function fetchAvatar(url: string, size: number): Promise<ArrayBuffer | null> {
    try {
        const res = await fetch(url.replace(/\/0$/, '/64'))
        const blob = await res.arrayBuffer()
        const raw = jpeg.decode(new Uint8Array(blob), { useTArray: true, formatAsRGBA: true })
        const canvas = new Uint8Array(size * size * 4)
        const scaleX = raw.width / size
        const scaleY = raw.height / size
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const sx = Math.min(Math.floor(x * scaleX), raw.width - 1)
                const sy = Math.min(Math.floor(y * scaleY), raw.height - 1)
                const si = (sy * raw.width + sx) * 4
                const di = (y * size + x) * 4
                canvas[di] = raw.data[si + 2]
                canvas[di + 1] = raw.data[si + 1]
                canvas[di + 2] = raw.data[si]
                canvas[di + 3] = 255
            }
        }
        return canvas.buffer
    } catch (e) {
        logger.log('[avatar] fetch failed: ' + url + ' ' + String(e))
        return null
    }
}

const showManagerWindow = async (printerId: number, printerName: string) => {
    const AVATAR_SIZE = 32
    const winW = 400
    const winH = 300

    const root = createRoot({
        text: '管理用户 - ' + printerName,
        width: winW,
        height: winH,
    })

    let users: { externalUserId: string; nickname: string | null; avatar: string | null }[] = []
    try {
        const res = await api.computer.listPrinterUsers(printerId)
        users = res.users
    } catch (e) {
        logger.log('[manager] listPrinterUsers failed: ' + String(e))
    }

    const avatarPromises = users.map(async (u, idx) => {
        const bgra = u.avatar ? await fetchAvatar(u.avatar, AVATAR_SIZE) : null
        return { idx, bgra }
    })
    const avatarResults = await Promise.all(avatarPromises)
    const iconIndexMap: (number | undefined)[] = []
    const icons: ArrayBuffer[] = []
    for (const { idx, bgra } of avatarResults) {
        if (bgra) {
            iconIndexMap[idx] = icons.length
            icons.push(bgra)
        } else {
            iconIndexMap[idx] = undefined
        }
    }

    const renderUsers = () => {
        const userColumns: Column<{ nickname: string; userId: string; action: string }>[] = [
            { name: '用户', dataIndex: 'nickname' },
            {
                name: '操作',
                dataIndex: 'action',
                width: 60,
                align: 'center',
                cellStyle: { color: 0xFF0000, underline: true, cursor: 32649 },
                onCellClick: async (record) => {
                    try {
                        await api.computer.removePrinterUser(printerId, record.userId)
                        logger.log('[manager] removed user: ' + record.userId)
                        const res = await api.computer.listPrinterUsers(printerId)
                        users = res.users
                        renderUsers()
                    } catch (e) {
                        logger.log('[manager] removePrinterUser failed: ' + String(e))
                    }
                },
            },
        ]

        const userData = users.map(u => ({
            nickname: u.nickname || u.externalUserId,
            userId: u.externalUserId,
            action: '移除',
        }))

        root.render(
            <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', flexGrow: 1, padding: 8 }}>
                <w type="STATIC" ws={VISIBLE} text={'打印机: ' + printerName} style={{ height: 24 }} />
                <w type="STATIC" ws={VISIBLE} text={'已关联用户 (' + users.length + ')'} style={{ height: 24 }} />
                <ListView
                    columns={userColumns}
                    data={userData}
                    icons={icons}
                    iconSize={AVATAR_SIZE}
                    getIcon={(_, i) => iconIndexMap[i]}
                    style={{ flexGrow: 1 }}
                />
            </w>
        )
    }

    renderUsers()
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
            name: '',
            dataIndex: 'qr',
            align: 'center',
            cellStyle: (record) => record.enabled ? { cursor: 32649 } : { color: 0x808080, cursor: 32648 },
            onCellClick: (record) => { if (record.enabled) showQrWindow(record.name) }
        },
        {
            name: '',
            dataIndex: 'manage',
            align: 'center',
            cellStyle: (record) => record.enabled ? { color: 0x0000FF, underline: true, cursor: 32649 } : { color: 0x808080, cursor: 32648 },
            onCellClick: (record) => { if (record.enabled && record.id != null) showManagerWindow(record.id, record.name) },
        },
        { name: '', dataIndex: undefined },
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
                <w type="STATIC" ws={VISIBLE} text={name} style={{ height: 24, width: 'auto' }} />
                {link
                    ? <QRCode text={link} size={size} />
                    : <w type="STATIC" ws={VISIBLE} text={'获取二维码失败'} style={{ height: 24, width: 'auto' }} />}
            </w>
        )
    }
    const data: PrinterRow[] = printers.map(p => ({
        name: p.name,
        status: p.enabled ? '启用' : '禁用',
        action: p.enabled ? '禁用' : '启用',
        qr: '二维码',
        manage: '管理用户',
        enabled: p.enabled,
        id: p.id,
    }))
    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', gap: 4, flexGrow: 1, padding: 8 }}>
            <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'row', gap: 4, height: 24 }}>
                <w type="STATIC" ws={VISIBLE} text={'计算机ID: ' + (showDeviceId ? computerId : maskDeviceId(computerId))} style={{ width: 'auto' }} />
                <Button onClick={() => setShowDeviceId(v => !v)} style={{ width: 56, height: 20 }}>{showDeviceId ? '隐藏' : '显示'}</Button>
            </w>
            <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'row', gap: 4, height: 24 }}>
                <w type="STATIC" ws={VISIBLE} text={'计算机名: '} style={{ width: 'auto' }} />
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