import { useRef, useEffect } from 'react'
import * as gui from 'gui'
import { generate, correction, mode } from 'lean-qr'
import { createBitmap, deleteObject } from '../qr.js'
import { scaleFactor } from 'quickwin/lib/react-qw/reconciler.js'
import { InvalidateRect } from 'quickwin/lib/windows/user32.js'
import { NULL } from 'quickwin/lib/ffi/ctype.js'
import { ImageType, StaticMsg, StaticStyleEx, WindowStyle } from 'quickwin/constants'

const VISIBLE = WindowStyle.VISIBLE
const SS_BITMAP = StaticStyleEx.BITMAP
const SS_CENTERIMAGE = StaticStyleEx.CENTERIMAGE
const STM_SETIMAGE = StaticMsg.SETIMAGE
const IMAGE_BITMAP = ImageType.BITMAP

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

        const px = Math.round(size * scaleFactor)
        const qr = generate(text, {
            minCorrectionLevel: correction.M,
            maxCorrectionLevel: correction.M,
            modes: [mode.numeric, mode.alphaNumeric, mode.ascii, mode.utf8],
        })
        const moduleCount = qr.size
        const scale = px / moduleCount

        const stride = px * 4
        const buf = new Uint8Array(px * stride)
        for (let y = 0; y < px; y++) {
            for (let x = 0; x < px; x++) {
                const moduleY = Math.min(Math.floor(y / scale), moduleCount - 1)
                const moduleX = Math.min(Math.floor(x / scale), moduleCount - 1)
                const dark = qr.get(moduleX, moduleY)
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

        const hbmp = createBitmap(px, px, 32, buf.buffer)
        hbmpRef.current = hbmp

        const oldBmp = gui.SendMessage(hStatic, STM_SETIMAGE, IMAGE_BITMAP, hbmp)
        InvalidateRect(hStatic, NULL, 1)
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
        <w type="STATIC" ws={VISIBLE | SS_BITMAP | SS_CENTERIMAGE} ref={hStaticRef} style={{ width: size, height: size }} />
    )
}
