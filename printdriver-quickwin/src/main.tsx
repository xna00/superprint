import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as gui from 'gui'
import { useState } from 'quickwin/lib/preact/hooks.js'
import { render, notifyResize } from 'quickwin/lib/preact/render.js'

const WM_TRAY = 0x8001
const W = 800, H = 600

gui.RegisterClass('SuperPrintWin', (hwnd, msg, wParam, lParam) => {
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
        gui.AppendMenu(hMenu, 2048, 0, '')
        gui.AppendMenu(hMenu, 0, 2, '退出')
        const cmd = gui.TrackPopupMenu(hMenu, x, y, undefined, hwnd)
        gui.DestroyMenu(hMenu)
        if (cmd === 1) {
          gui.ShowWindow(hwnd, 5)
        } else if (cmd === 2) {
          gui.ShellNotifyIcon(2, { hwnd, uID: 1 })
          gui.PostQuitMessage(0)
        }
      }
    }
    return 0
  }
  if (msg === 16) {
    gui.ShowWindow(hwnd, 0)
    return 0
  }
  if (msg === 5) {
    notifyResize(hwnd)
    return 0
  }
  return gui.DefWindowProc(hwnd, msg, wParam, lParam)
})

function App() {
  const [statusText, setStatusText] = useState('就绪\n等待任务...')

  return (
    <w style={{ flexDirection: 'column', padding: 20, gap: 10 }}>
      <w type="static" text="SuperPrint 打印驱动" style={{ height: 30 }} />
      <w type="static" text={statusText} style={{ flexGrow: 1, width: '100%' }} />
      <w style={{ flexDirection: 'row', gap: 10, height: 36 }}>
        <w type="button" text="测试请求" style={{ width: 120, height: 36 }} onEvent={(e) => {
          if (e.msg === 0x0201) {
            setStatusText('请求中...')
            fetch('https://httpbin.org/get')
              .then(r => r.text())
              .then(body => setStatusText(body.slice(0, 2000)))
              .catch(err => setStatusText('错误：' + (err.message ?? String(err))))
          }
        }} />
        <w type="button" text="退出" style={{ width: 120, height: 36 }} onEvent={(e) => {
          if (e.msg === 0x0201) gui.PostQuitMessage(0)
        }} />
      </w>
    </w>
  )
}

try {
  const scr = gui.GetScreenSize()
  const x = (scr[0] - W) >> 1
  const y = (scr[1] - H) >> 1

  const hwnd = gui.CreateWindow(
    'SuperPrintWin', 'SuperPrint 打印驱动 - QuickWin',
    13565952, x, y, W, H, null, null,
  )

  gui.ShowWindow(hwnd)
  render(<App />, hwnd)

  const hIcon = gui.LoadIcon('APPLICATION')
  if (hIcon) {
    gui.ShellNotifyIcon(0, {
      hwnd, uID: 1,
      flags: 1 | 2,
      callbackMessage: WM_TRAY,
      hIcon,
    })
  }
} catch (e) {
  console.log('启动失败：', e)
}
