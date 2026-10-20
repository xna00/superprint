import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as gui from 'gui'
import * as os from 'os'
import * as std from 'std'
import { NULL } from 'quickwin/lib/ffi/ctype.js'
import type { MaybePtr } from 'quickwin/lib/ffi/ctype.js'
import { CloseHandle } from 'quickwin/lib/windows/kernel32.js'
import { ShellNotifyIcon } from 'quickwin/lib/windows/shell32.js'
import {
    AppendMenu, CreatePopupMenu, DestroyMenu, PostQuitMessage, SetForegroundWindow,
    ShowWindow, TrackPopupMenu,
} from 'quickwin/lib/windows/user32.js'
import { NOTIFYICONDATAW } from 'quickwin/lib/windows/structs.js'
import {
    MenuFlag, NotifyIconCmd, NotifyIconFlag, PowerBroadcast, ShowWindowCmd,
    TrackPopupMenuFlag, WmMsg,
} from 'quickwin/constants'
import { createRoot } from 'quickwin/lib/react-qw/index.js'
import { cleanupWs, resetWs } from './ws.js'
import { setPrintWorker } from './print-queue.js'
import type { PrintWorker } from './worker-types.js'
import { App } from './App.js'
import { storageGet } from './storage.js'
import { logger } from './logger.js'
import { startUpdateCheck, clearUpdateTimer } from './update.js'
import { acquireSingleInstanceMutex, bailOnSecondInstance, getCursorPos } from './win32.js'

export let printWorker: PrintWorker | null = null
export let mainHwnd: gui.HWND | null = null
export let hMutex: MaybePtr<'HMUTEX'> | null = null

const MUTEX_NAME = 'SuperPrint_SingleInstance'

const args = scriptArgs.slice(0)
logger.log('[main] scriptArgs:', args)

const SETUP_W = 400
const SETUP_H = 220

/** 已有一份在跑 → 提示并退出（返回 true）。命中时不留句柄。 */
function checkRunning(): boolean {
    const h = acquireSingleInstanceMutex(MUTEX_NAME)
    if (h === null) {
        bailOnSecondInstance()
        return true
    }
    if (h) CloseHandle(h)
    return false
}

if (args.includes('--uninstall')) {
    if (!checkRunning()) {
        import('./components/UninstallApp.js').then(({ UninstallApp }) => {
            const root = createRoot({
                text: '超人打印 - 卸载',
                width: SETUP_W,
                height: SETUP_H,
                onEvent: ({ msg }) => {
                    if (msg === WmMsg.CLOSE || msg === WmMsg.DESTROY) {
                        PostQuitMessage(0)
                        return 0
                    }
                }
            })
            root.render(<UninstallApp onComplete={() => PostQuitMessage(0)} />)
        })
    }
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
    import('./install.js').then(({ ensureInstalled }) => ensureInstalled().catch((e) => {
        logger.log('[main] ensureInstalled failed:', e)
    }))

    // 单实例互斥体：抢不到说明已有实例，静默退出
    const m = acquireSingleInstanceMutex(MUTEX_NAME)
    if (m === null) {
        PostQuitMessage(0)
        return
    }
    hMutex = m

    const winW = 600
    const winH = 400
    const WM_TRAY = WmMsg.USER + 0x401
    const WM_POWERBROADCAST = WmMsg.POWERBROADCAST
    const PBT_APMRESUMESUSPEND = PowerBroadcast.APMRESUMESUSPEND
    const PBT_APMRESUMEAUTOMATIC = PowerBroadcast.APMRESUMEAUTOMATIC

    const root = createRoot({
        text: '超人打印',
        width: winW,
        height: winH,
        noShowWindow: true,
        onEvent: ({ hwnd, msg, wParam, lParam }) => {
            if (msg === WM_POWERBROADCAST) {
                logger.log(`[main] WM_POWERBROADCAST wParam=${wParam} (expected suspend=${PBT_APMRESUMESUSPEND} auto=${PBT_APMRESUMEAUTOMATIC})`)
                if (wParam === PBT_APMRESUMESUSPEND || wParam === PBT_APMRESUMEAUTOMATIC) {
                    logger.log('[main] resuming from sleep, refreshing tray icon + resetting ws')
                    ShellNotifyIcon(NotifyIconCmd.DELETE, { cbSize: NOTIFYICONDATAW.size, hWnd: hwnd, uID: 1 })
                    const hIcon = gui.LoadAppIcon()
                    if (hIcon) {
                        ShellNotifyIcon(NotifyIconCmd.ADD, {
                            cbSize: NOTIFYICONDATAW.size,
                            hWnd: hwnd, uID: 1,
                            uFlags: NotifyIconFlag.MESSAGE | NotifyIconFlag.ICON | NotifyIconFlag.TIP,
                            uCallbackMessage: WM_TRAY,
                            hIcon,
                            szTip: '超人打印',
                        })
                        logger.log('[main] tray icon re-added after wake')
                    } else {
                        logger.log('[main] WARNING: failed to load tray icon after wake')
                    }
                    resetWs()
                }
                return 0
            }
            if (msg === WM_TRAY) {
                const evt = lParam
                if (evt === WmMsg.LBUTTONDOWN) {
                    ShowWindow(hwnd, ShowWindowCmd.RESTORE)
                    SetForegroundWindow(hwnd)
                } else if (evt === WmMsg.RBUTTONDOWN || evt === WmMsg.CONTEXTMENU) {
                    SetForegroundWindow(hwnd)
                    const [x, y] = getCursorPos()
                    const hMenu = CreatePopupMenu()
                    if (hMenu) {
                        AppendMenu(hMenu, MenuFlag.STRING, 1, '显示窗口')
                        AppendMenu(hMenu, MenuFlag.SEPARATOR, 0, NULL)
                        AppendMenu(hMenu, MenuFlag.STRING, 2, '退出')
                        // TPM_RETURNCMD 让命令 ID 直接作为返回值回来
                        const cmd = TrackPopupMenu(hMenu, TrackPopupMenuFlag.RETURNCMD | TrackPopupMenuFlag.RIGHTBUTTON, x, y, 0, hwnd, NULL)
                        DestroyMenu(hMenu)
                        gui.SendMessage(hwnd, WmMsg.NULL, 0, 0) // WM_NULL
                        if (cmd === 1) {
                            ShowWindow(hwnd, ShowWindowCmd.RESTORE)
                        } else if (cmd === 2) {
                            gui.DestroyWindow(hwnd)
                        }
                    }
                }
                return 0
            }
            if (msg === WmMsg.CLOSE) {
                const minimizeToTray = storageGet('minimizeToTray')
                if (minimizeToTray !== false) {
                ShowWindow(hwnd, ShowWindowCmd.HIDE)
                return 0
            }
            gui.DestroyWindow(hwnd)
            return 0
        }
        if (msg === WmMsg.DESTROY) {
                ShellNotifyIcon(NotifyIconCmd.DELETE, { cbSize: NOTIFYICONDATAW.size, hWnd: hwnd, uID: 1 })
                cleanupWs()
                destroyPrintWorker()
                clearUpdateTimer()
                PostQuitMessage(0)
                return 0
            }
        }
    })

    root.render(<App />)
    mainHwnd = root.hwnd
    const isAutoStart = args.includes('--autostart')
    if (!isAutoStart || storageGet('showOnStartup') !== false) ShowWindow(root.hwnd, ShowWindowCmd.SHOWNORMAL)

    const hIcon = gui.LoadAppIcon()
    if (hIcon) {
        const ok = ShellNotifyIcon(NotifyIconCmd.ADD, {
            cbSize: NOTIFYICONDATAW.size,
            hWnd: root.hwnd,
            uID: 1,
            uFlags: NotifyIconFlag.MESSAGE | NotifyIconFlag.ICON | NotifyIconFlag.TIP,
            uCallbackMessage: WM_TRAY,
            hIcon,
            szTip: '超人打印',
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

    let heartbeatCount = 0
    function heartbeat() {
        heartbeatCount++
        logger.log(`[heartbeat] alive #${heartbeatCount}`)
        os.setTimeout(heartbeat, 30000)
    }
    os.setTimeout(heartbeat, 30000)

    if (globalThis.checkUpdate !== false) {
        os.setTimeout(startUpdateCheck, 1000)
    }
}
