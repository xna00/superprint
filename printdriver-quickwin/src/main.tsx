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
import { storageGet } from './storage.js'
import { InstallApp } from './components/InstallApp.js'
import { UninstallApp } from './components/UninstallApp.js'

const args = scriptArgs.slice(0)
console.log('[main] scriptArgs:', args)

const SETUP_W = 400
const SETUP_H = 220
const SCALE = gui.GetScaleFactor()

if (args.includes('--uninstall')) {
    gui.RegisterClass('SetupWin', (hwnd, msg, wParam, lParam) => {
        if (msg === gui.WmMsg.CLOSE || msg === gui.WmMsg.DESTROY) {
            gui.PostQuitMessage(0)
            return 0
        }
        return gui.DefWindowProc(hwnd, msg, wParam, lParam)
    })
    const scr = gui.GetScreenSize()
    const hwnd = gui.CreateWindow('SetupWin', '超人打印 - 卸载',
        gui.WindowStyle.OVERLAPPEDWINDOW,
        Math.max(0, (scr[0] - Math.round(SETUP_W * SCALE)) / 2), Math.max(0, (scr[1] - Math.round(SETUP_H * SCALE)) / 2),
        Math.round(SETUP_W * SCALE), Math.round(SETUP_H * SCALE), null, null)
    if (hwnd) {
        render(<UninstallApp cw={SETUP_W} ch={SETUP_H} onComplete={() => gui.PostQuitMessage(0)} />, hwnd)
        gui.ShowWindow(hwnd)
    }
} else if (!args.includes('--run')) {
    gui.RegisterClass('SetupWin', (hwnd, msg, wParam, lParam) => {
        if (msg === gui.WmMsg.CLOSE || msg === gui.WmMsg.DESTROY) {
            gui.PostQuitMessage(0)
            return 0
        }
        return gui.DefWindowProc(hwnd, msg, wParam, lParam)
    })
    const scr = gui.GetScreenSize()
    const hwnd = gui.CreateWindow('SetupWin', '超人打印 - 安装',
        gui.WindowStyle.OVERLAPPEDWINDOW,
        Math.max(0, (scr[0] - Math.round(SETUP_W * SCALE)) / 2), Math.max(0, (scr[1] - Math.round(SETUP_H * SCALE)) / 2),
        Math.round(SETUP_W * SCALE), Math.round(SETUP_H * SCALE), null, null)
    if (hwnd) {
        render(<InstallApp cw={SETUP_W} ch={SETUP_H} onComplete={() => gui.PostQuitMessage(0)} />, hwnd)
        gui.ShowWindow(hwnd)
    }
} else runMainApp()

export let printWorker: PrintWorker | null = null

import pWorkerUrl from './print-worker?worker&url'

function runMainApp() {
    const winW = 600
    const winH = 400
    const scr = gui.GetScreenSize()
    const winX = Math.max(0, (scr[0] - Math.round(winW * SCALE)) / 2)
    const winY = Math.max(0, (scr[1] - Math.round(winH * SCALE)) / 2)

    const WM_TRAY = 0x8001

    gui.RegisterClass('TestWin', (hwnd, msg, wParam, lParam) => {
        if (msg === WM_TRAY) {
            const evt = lParam
            if (evt === 0x0201) {
                gui.ShowWindow(hwnd, 5)
                gui.SetForegroundWindow(hwnd)
            } else if (evt === 0x0204 || evt === 0x007B) {
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
            const minimizeToTray = storageGet('minimizeToTray')
            if (minimizeToTray !== false) {
                gui.ShowWindow(hwnd, 0)
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
        return gui.DefWindowProc(hwnd, msg, wParam, lParam)
    })

    const hwnd = gui.CreateWindow('TestWin', 'SuperPrint',
        gui.WindowStyle.OVERLAPPEDWINDOW,
        winX, winY, Math.round(winW * SCALE), Math.round(winH * SCALE), null, null)

    if (hwnd) {
        render(<App cw={winW} ch={winH} />, hwnd)
        const isAutoStart = args.includes('--autostart')
        if (!isAutoStart || storageGet('showOnStartup') !== false) gui.ShowWindow(hwnd)

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

    console.log('[main] worker URL:', pWorkerUrl)
    printWorker = new os.Worker(pWorkerUrl) as any as PrintWorker
    setPrintWorker(printWorker)
    console.log('[main] print worker initialized')

    if (globalThis.checkUpdate !== false) {
        startUpdateCheck()
    }
}
