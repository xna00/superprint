import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import 'quickwin/lib/websocket.js'
import * as gui from 'gui'
import * as os from 'os'
import * as std from 'std'
import { render } from 'quickwin/lib/react-qw/index.js'
import { cleanupWs } from './ws.js'
import { setPrintWorker } from './print-queue.js'
import type { PrintWorker, WorkerInMsg } from './worker-types.js'
import { App } from './App.js'
import { startUpdateCheck, timer } from './update.js'
import { install, uninstall } from './install.js'

const args = scriptArgs.slice(0)
console.log('[main] scriptArgs:', args)
if (args.includes('--uninstall')) { uninstall(); std.exit(0) }
if (!args.includes('--run')) { install(); std.exit(0) }

const winW = 600
const winH = 400
const scr = gui.GetScreenSize()
const winX = Math.max(0, (scr[0] - winW) / 2)
const winY = Math.max(0, (scr[1] - winH) / 2)

const WM_TRAY = 0x8001

export let printWorker: PrintWorker | null = null

gui.RegisterClass('TestWin', (hwnd, msg, wParam, lParam) => {
    if (msg === WM_TRAY) {
        const evt = lParam
        if (evt === 0x0201) { // WM_LBUTTONDOWN
            gui.ShowWindow(hwnd, 5) // SW_SHOW
            gui.SetForegroundWindow(hwnd)
        } else if (evt === 0x0204 || evt === 0x007B) { // WM_RBUTTONDOWN or WM_CONTEXTMENU
            gui.SetForegroundWindow(hwnd)
            const pos = gui.GetCursorPos()
            const x = pos ? pos[0] : 0
            const y = pos ? pos[1] : 0
            const hMenu = gui.CreatePopupMenu()
            if (hMenu) {
                gui.AppendMenu(hMenu, 0, 1, '显示窗口')
                gui.AppendMenu(hMenu, 0x0800, 0, '')
                gui.AppendMenu(hMenu, 0, 2, '退出')
                const cmd = gui.TrackPopupMenu(hMenu, x, y, undefined, hwnd)
                gui.DestroyMenu(hMenu)
                if (cmd === 1) {
                    gui.ShowWindow(hwnd, 5)
                } else if (cmd === 2) {
                    gui.ShellNotifyIcon(gui.NotifyIconCmd.DELETE, { hwnd, uID: 1 })
                    gui.PostQuitMessage(0)
                }
            }
        }
        return 0
    }
    if (msg === gui.WmMsg.CLOSE) {
        gui.ShowWindow(hwnd, 0) // SW_HIDE → 隐藏到托盘
        return 0
    }
    if (msg === gui.WmMsg.DESTROY) {
        cleanupWs()
        if (printWorker) {
            printWorker.onmessage = null
            printWorker.postMessage({ type: 'done' })
        }
        if (timer !== null) {
            os.clearTimeout(timer)
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

    const hIcon = gui.LoadIcon('APPLICATION')
    if (hIcon) {
        const ok = gui.ShellNotifyIcon(gui.NotifyIconCmd.ADD, {
            hwnd,
            uID: 1,
            flags: gui.NotifyIconFlag.MESSAGE | gui.NotifyIconFlag.ICON,
            callbackMessage: WM_TRAY,
            hIcon,
        })
        std.out.printf('[main] tray icon %s\n', ok ? 'added' : 'FAILED')
        std.out.flush()
    } else {
        std.out.printf('[main] failed to load tray icon\n')
        std.out.flush()
    }
}

import pWorkerUrl from './print-worker?worker&url'
console.log('[main] worker URL:', pWorkerUrl)
printWorker = new os.Worker(pWorkerUrl) as any as PrintWorker
setPrintWorker(printWorker)
console.log('[main] print worker initialized')

if (globalThis.checkUpdate !== false) {
    startUpdateCheck()
}
