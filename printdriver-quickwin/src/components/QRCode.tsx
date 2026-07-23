import { useRef, useEffect } from 'react'
import * as gui from 'gui'
import qrcode from 'qrcode-generator'
import { createBitmap, deleteObject } from '../qr.js'

const VISIBLE = gui.WindowStyle.VISIBLE
const SS_BITMAP = gui.StaticStyleEx.BITMAP
const STM_SETIMAGE = gui.StaticMsg.SETIMAGE
const IMAGE_BITMAP = gui.ImageType.BITMAP

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
        const scale = size / moduleCount

        const stride = size * 4
        const buf = new Uint8Array(size * stride)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const moduleY = Math.min(Math.floor(y / scale), moduleCount - 1)
                const moduleX = Math.min(Math.floor(x / scale), moduleCount - 1)
                const dark = qr.isDark(moduleY, moduleX)
                const off = y * stride + x * 4
                const v = dark ? 0 : 255
                buf[off] = v
                buf[off + 1] = v
                buf[off + 2] = v
                buf[off + 3] = 255
            }
        }

        if (hbmpRef.current) {
            deleteObject(hbmpRef.current)
        }

        const hbmp = createBitmap(size, size, 32, buf.buffer)
        hbmpRef.current = hbmp

        const oldBmp = gui.SendMessage(hStatic, STM_SETIMAGE, IMAGE_BITMAP, hbmp)
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
