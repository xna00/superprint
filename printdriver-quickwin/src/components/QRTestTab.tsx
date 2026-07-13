import * as gui from 'gui'
import { QRCode } from './QRCode.js'

const VISIBLE = gui.WindowStyle.VISIBLE

export function QRTestTab() {
    return (
        <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'column', flexGrow: 1, padding: 16, alignItems: 'center', gap: 8 }}>
            <w type="STATIC" ws={VISIBLE} text="二维码测试" style={{ height: 22 }} />
            <QRCode text="https://www.baidu.com" size={200} />
        </w>
    )
}
