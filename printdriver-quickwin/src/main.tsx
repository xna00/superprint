import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as gui from 'gui'
import * as win from 'win'
import { ffiCall, FFI_TYPE_POINTER, FFI_TYPE_UINT32, FFI_TYPE_SINT32 } from 'ffi'
import * as os from 'os'
import * as std from 'std'
import { createRoot } from 'quickwin/lib/react-qw/index.js'
import { cleanupWs } from './ws.js'
import { setPrintWorker } from './print-queue.js'
import type { PrintWorker } from './worker-types.js'
import { App } from './App.js'
import { storageGet } from './storage.js'
import { logger } from './logger.js'
import { startUpdateCheck, clearUpdateTimer } from './update.js'
import { strToWideBuf } from './utils.js'

export let printWorker: PrintWorker | null = null
export let mainHwnd: gui.HWND | null = null
export let hMutex: number | null = null

const args = scriptArgs.slice(0)
logger.log('[main] scriptArgs:', args)

const SETUP_W = 400
const SETUP_H = 220

if (args.includes('--uninstall')) {
    import('./components/UninstallApp.js').then(({ UninstallApp }) => {
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
    })
} else if (!args.includes('--run')) {
    import('./components/InstallApp.js').then(({ InstallApp }) => {
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
    })
} else runMainApp()

import pWorkerUrl from './print-worker?worker&url'

export function destroyPrintWorker() {
    if (printWorker) {
        printWorker.postMessage({ type: 'done' })
        printWorker.onmessage = null
        printWorker = null
    }
}

export function cleanupMain() {
    cleanupWs()
    destroyPrintWorker()
    clearUpdateTimer()
}

function runMainApp() {
    const k32 = win.LoadLibrary('kernel32.dll')
    const pCreateMutexW = k32 ? win.GetProcAddress(k32, 'CreateMutexW') : 0
    const pGetLastError = k32 ? win.GetProcAddress(k32, 'GetLastError') : 0
    if (pCreateMutexW && pGetLastError) {
        hMutex = ffiCall(pCreateMutexW, [FFI_TYPE_POINTER, FFI_TYPE_SINT32, FFI_TYPE_POINTER],
            [null, 0, strToWideBuf('SuperPrint_SingleInstance')], FFI_TYPE_POINTER)
        const err = ffiCall(pGetLastError, [], [], FFI_TYPE_UINT32)
        if (err === 183) {
            gui.PostQuitMessage(0)
            return
        }
    }

    const winW = 600
    const winH = 400
    const WM_TRAY = gui.WmMsg.USER + 0x401
    const WM_POWERBROADCAST = gui.WmMsg.POWERBROADCAST
    const PBT_APMRESUMESUSPEND = gui.PowerBroadcast.APMRESUMESUSPEND
    const PBT_APMRESUMEAUTOMATIC = gui.PowerBroadcast.APMRESUMEAUTOMATIC

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
            if (msg === WM_POWERBROADCAST) {
                if (wParam === PBT_APMRESUMESUSPEND || wParam === PBT_APMRESUMEAUTOMATIC) {
                    gui.ShellNotifyIcon(gui.NotifyIconCmd.DELETE, { hwnd, uID: 1 })
                    const hIcon = gui.LoadIcon('APPLICATION')
                    if (hIcon) {
                        gui.ShellNotifyIcon(gui.NotifyIconCmd.ADD, {
                            hwnd, uID: 1,
                            flags: gui.NotifyIconFlag.MESSAGE | gui.NotifyIconFlag.ICON,
                            callbackMessage: WM_TRAY,
                            hIcon,
                        })
                    }
                }
                return 0
            }
            if (msg === WM_TRAY) {
                const evt = lParam
                if (evt === gui.WmMsg.LBUTTONDOWN) {
                    gui.ShowWindow(hwnd, gui.ShowWindowCmd.RESTORE)
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
                        gui.SendMessage(hwnd, gui.WmMsg.NULL, 0, 0) // WM_NULL
                        if (cmd === 1) {
                            gui.ShowWindow(hwnd, gui.ShowWindowCmd.RESTORE)
                        } else if (cmd === 2) {
                            gui.DestroyWindow(hwnd)
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
                gui.ShellNotifyIcon(gui.NotifyIconCmd.DELETE, { hwnd, uID: 1 })
                cleanupWs()
                destroyPrintWorker()
                clearUpdateTimer()
                gui.PostQuitMessage(0)
                return 0
            }
        }
    })

    root.render(<App />)
    mainHwnd = root.hwnd
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

    logger.log('[main] worker URL:', pWorkerUrl)
    printWorker = new os.Worker(pWorkerUrl) as any as PrintWorker
    setPrintWorker(printWorker)
    logger.log('[main] print worker initialized')

    if (globalThis.checkUpdate !== false) {
        os.setTimeout(startUpdateCheck, 1000)
    }
}
