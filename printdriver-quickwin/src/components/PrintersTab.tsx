import * as gui from 'gui'
import { ListBox } from 'quickwin/lib/react-qw/index.js'

const VISIBLE = gui.WindowStyle.VISIBLE

interface PrintersTabProps {
    computerId: string
    computerName: string
    username: string
    wsStatus: string
    printers: string[]
}

export function PrintersTab({ computerId, computerName, username, wsStatus, printers }: PrintersTabProps) {
    return (
        <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'column', gap: 4, flexGrow: 1 }}>
            <w type="STATIC" ws={VISIBLE} text={'设备ID: ' + computerId} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text={'计算机: ' + computerName} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text={'用户: ' + username} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text={'连接状态: ' + wsStatus} style={{ height: 24 }} />
            <w type="STATIC" ws={VISIBLE} text="打印机列表:" style={{ height: 24 }} />
            <ListBox items={printers} style={{ flexGrow: 1 }} />
        </w>
    )
}
