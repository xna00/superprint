import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import 'quickwin/lib/websocket.js'
import * as gui from 'gui'
import * as os from 'os'
import { render } from 'quickwin/lib/react-qw/index.js'
import { cleanupWs } from './ws.js'
import { setPrintWorker } from './print-queue.js'
import type { PrintWorker, WorkerInMsg } from './worker-types.js'
import { App } from './App.js'
import { startUpdateCheck } from './update.js'

const winW = 600
const winH = 400
const scr = gui.GetScreenSize()
const winX = Math.max(0, (scr[0] - winW) / 2)
const winY = Math.max(0, (scr[1] - winH) / 2)

let printWorker: PrintWorker | null = null

gui.RegisterClass('TestWin', (hwnd, msg, wParam, lParam) => {
    if (msg === gui.WmMsg.DESTROY) {
        cleanupWs()
        if (printWorker) {
            printWorker.onmessage = null
            printWorker.postMessage({ type: 'done' })
        }
        gui.PostQuitMessage(0)
        return 0
    }
    return gui.DefWindowProc(hwnd, msg, wParam, lParam)
})

const hwnd = gui.CreateWindow('TestWin', 'SuperPrint',
    gui.WindowStyle.OVERLAPPEDWINDOW,
    winX, winY, winW, winH, null, null)

const cr = hwnd ? gui.GetClientRect(hwnd) : null
const cw = cr ? cr.right - cr.left : winW
const ch = cr ? cr.bottom - cr.top : winH

if (hwnd) {
    render(<App cw={cw} ch={ch} />, hwnd)
    gui.ShowWindow(hwnd)
}

import pWorkerUrl from './print-worker?worker&url'
console.log('[main] worker URL:', pWorkerUrl)
printWorker = new os.Worker(pWorkerUrl) as any as PrintWorker
setPrintWorker(printWorker)
console.log('[main] print worker initialized')

startUpdateCheck()
