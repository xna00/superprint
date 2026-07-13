import { useRef, useEffect } from 'react'
import * as gui from 'gui'
import qrcode from 'qrcode-generator'
import { createBitmap, deleteObject } from '../qr.js'

const VISIBLE = gui.WindowStyle.VISIBLE
const SS_BITMAP = 0x0E
const STM_SETIMAGE = 0x0172
const IMAGE_BITMAP = 0

interface QRCodeProps {
    text: string
    size: number
}

export function QRCode({ text, size }: QRCodeProps) {
    const hStaticRef = useRef<gui.HWND>(null)
    const hbmpRef = useRef<number>(0)

    useEffect(() => {
        const hStatic = hStaticRef.current
        if (!hStatic || !text) return

        const qr = qrcode(0, 'M')
        qr.addData(text)
        qr.make()
        const moduleCount = qr.getModuleCount()
        const moduleSize = Math.floor(size / moduleCount)
        const bmpSize = moduleSize * moduleCount

        const stride = bmpSize * 4
        const buf = new Uint8Array(bmpSize * stride)
        for (let y = 0; y < moduleCount; y++) {
            for (let x = 0; x < moduleCount; x++) {
                const dark = qr.isDark(y, x)
                for (let py = 0; py < moduleSize; py++) {
                    for (let px = 0; px < moduleSize; px++) {
                        const off = (y * moduleSize + py) * stride + (x * moduleSize + px) * 4
                        const v = dark ? 0 : 255
                        buf[off] = v
                        buf[off + 1] = v
                        buf[off + 2] = v
                        buf[off + 3] = 255
                    }
                }
            }
        }

        if (hbmpRef.current) {
            deleteObject(hbmpRef.current)
        }

        const hbmp = createBitmap(bmpSize, bmpSize, 32, buf.buffer)
        hbmpRef.current = hbmp

        const oldBmp = gui.SendMessage(hStatic, STM_SETIMAGE, IMAGE_BITMAP, hbmp) as number
        gui.InvalidateRect(hStatic, null, true)
        if (oldBmp && oldBmp !== hbmp) {
            deleteObject(oldBmp)
        }
    }, [text, size])

    useEffect(() => {
        return () => {
            if (hbmpRef.current) {
                const hStatic = hStaticRef.current
                if (hStatic) {
                    gui.SendMessage(hStatic, STM_SETIMAGE, IMAGE_BITMAP, 0)
                }
                deleteObject(hbmpRef.current)
                hbmpRef.current = 0
            }
        }
    }, [])

    return (
        <w type="STATIC" ws={VISIBLE | SS_BITMAP} ref={hStaticRef} style={{ width: size, height: size }} />
    )
}
