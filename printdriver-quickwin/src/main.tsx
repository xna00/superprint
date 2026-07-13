import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import 'quickwin/lib/websocket.js'
import * as gui from 'gui'
import * as os from 'os'
import * as std from 'std'
import { createRoot } from 'quickwin/lib/react-qw/index.js'
import { cleanupWs } from './ws.js'
import { setPrintWorker } from './print-queue.js'
import type { PrintWorker, WorkerInMsg } from './worker-types.js'
import { App } from './App.js'
import { startUpdateCheck, timer } from './update.js'
import { storageGet } from './storage.js'
import { InstallApp } from './components/InstallApp.js'
import { UninstallApp } from './components/UninstallApp.js'

const args = scriptArgs.slice(0)
console.log('[main] scriptArgs:', args)

const SETUP_W = 400
const SETUP_H = 220

if (args.includes('--uninstall')) {
    const root = createRoot({
        text: '超人打印 - 卸载',
        width: SETUP_W,
        height: SETUP_H,
        onEvent: ({ msg }) => {
            if (msg === gui.WmMsg.CLOSE || msg === gui.WmMsg.DESTROY) {
                gui.PostQuitMessage(0)
                return 0
            }
        }
    })
    root.render(<UninstallApp onComplete={() => gui.PostQuitMessage(0)} />)
} else if (!args.includes('--run')) {
    const root = createRoot({
        text: '超人打印 - 安装',
        width: SETUP_W,
        height: SETUP_H,
        onEvent: ({ msg }) => {
            if (msg === gui.WmMsg.CLOSE || msg === gui.WmMsg.DESTROY) {
                gui.PostQuitMessage(0)
                return 0
            }
        }
    })
    root.render(<InstallApp onComplete={() => gui.PostQuitMessage(0)} />)
} else runMainApp()

export let printWorker: PrintWorker | null = null

import pWorkerUrl from './print-worker?worker&url'

function runMainApp() {
    const winW = 600
    const winH = 400
    const WM_TRAY = 0x8001

    const scale = gui.GetScaleFactor()
    const [scrW, scrH] = gui.GetScreenSize()
    const cx = Math.max(0, Math.floor((scrW / scale - winW) / 2))
    const cy = Math.max(0, Math.floor((scrH / scale - winH) / 2))

    const root = createRoot({
        text: 'SuperPrint',
        width: winW,
        height: winH,
        x: cx,
        y: cy,
        noShowWindow: true,
        onEvent: ({ hwnd, msg, wParam, lParam }) => {
            if (msg === WM_TRAY) {
                const evt = lParam
                if (evt === gui.WmMsg.LBUTTONDOWN) {
                    gui.ShowWindow(hwnd, 9)
                    gui.SetForegroundWindow(hwnd)
                } else if (evt === gui.WmMsg.RBUTTONDOWN || evt === gui.WmMsg.CONTEXTMENU) {
                    gui.SetForegroundWindow(hwnd)
                    const pos = gui.GetCursorPos()
                    const x = pos ? pos[0] : 0
                    const y = pos ? pos[1] : 0
                    const hMenu = gui.CreatePopupMenu()
                    if (hMenu) {
                        gui.AppendMenu(hMenu, gui.MenuFlag.STRING, 1, '显示窗口')
                        gui.AppendMenu(hMenu, gui.MenuFlag.SEPARATOR, 0, '')
                        gui.AppendMenu(hMenu, gui.MenuFlag.STRING, 2, '退出')
                        const cmd = gui.TrackPopupMenu(hMenu, x, y, undefined, hwnd)
                        gui.DestroyMenu(hMenu)
                        if (cmd === 1) {
                            gui.ShowWindow(hwnd, 9)
                        } else if (cmd === 2) {
                            gui.ShellNotifyIcon(gui.NotifyIconCmd.DELETE, { hwnd, uID: 1 })
                            gui.PostQuitMessage(0)
                        }
                    }
                }
                return 0
            }
            if (msg === gui.WmMsg.CLOSE) {
                const minimizeToTray = storageGet('minimizeToTray')
                if (minimizeToTray !== false) {
                gui.ShowWindow(hwnd, gui.ShowWindowCmd.HIDE)
                return 0
            }
            gui.DestroyWindow(hwnd)
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
        }
    })

    root.render(<App />)
    const isAutoStart = args.includes('--autostart')
    if (!isAutoStart || storageGet('showOnStartup') !== false) gui.ShowWindow(root.hwnd)

    const hIcon = gui.LoadIcon('APPLICATION')
    if (hIcon) {
        const ok = gui.ShellNotifyIcon(gui.NotifyIconCmd.ADD, {
            hwnd: root.hwnd,
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

    console.log('[main] worker URL:', pWorkerUrl)
    printWorker = new os.Worker(pWorkerUrl) as any as PrintWorker
    setPrintWorker(printWorker)
    console.log('[main] print worker initialized')

    if (globalThis.checkUpdate !== false) {
        startUpdateCheck()
    }
}
