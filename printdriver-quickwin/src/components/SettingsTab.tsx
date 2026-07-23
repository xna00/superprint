import { useState } from 'react'
import * as gui from 'gui'
import * as os from 'os'
import * as std from 'std'
import { CheckBox, Button, RadioButton, Input } from 'quickwin/lib/react-qw/index.js'
import { storageGet, storageSet, getRenderEngine, setRenderEngine, getRenderDPI, setRenderDPI } from '../storage.js'
import { BUILD_TIME } from '../config.js'
import { checkAndUpdate } from '../update.js'
import { getExePath } from '../utils.js'
import { logger } from '../logger.js'
import { mainHwnd, cleanupMain } from '../main.js'

const VISIBLE = gui.WindowStyle.VISIBLE

export function SettingsTab() {
  const [minimizeToTray, setMinimizeToTray] = useState(() => {
    const v = storageGet('minimizeToTray')
    return v !== false
  })
  const [showOnStartup, setShowOnStartup] = useState(() => {
    const v = storageGet('showOnStartup')
    return v !== false
  })
  const [renderEngine, setRenderEngineState] = useState(() => getRenderEngine())
  const [renderDPI, setRenderDPIState] = useState(() => String(getRenderDPI()))
  const [checking, setChecking] = useState(false)

  function changeRenderEngine(v: 'pdfium' | 'mupdf') {
    setRenderEngineState(v)
    setRenderEngine(v)
  }

  function changeDPI(s: string) {
    setRenderDPIState(s)
  }

  function saveDPI() {
    const v = parseInt(renderDPI, 10)
    if (isNaN(v) || v < 72) return
    setRenderDPI(v)
  }

  return (
    <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'column', gap: 8, flexGrow: 1, padding: 8 }}>
      <CheckBox
        checked={minimizeToTray}
        onChange={(v) => { setMinimizeToTray(v); storageSet('minimizeToTray', v) }}
        label="关闭窗口时，最小化到托盘"
        style={{ height: 26 }}
      />
      <CheckBox
        checked={showOnStartup}
        onChange={(v) => { setShowOnStartup(v); storageSet('showOnStartup', v) }}
        label="开机自启动时弹出"
        style={{ height: 26 }}
      />
      <w type="STATIC" ws={VISIBLE} text="PDF 渲染引擎" style={{ height: 22 }} />
      <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'row', gap: 4 }}>
        <RadioButton checked={renderEngine === 'pdfium'} onChange={() => changeRenderEngine('pdfium')} label="PDFium（快速）" style={{ height: 24 }} />
        <RadioButton checked={renderEngine === 'mupdf'} onChange={() => changeRenderEngine('mupdf')} label="MuPDF（兼容）" style={{ height: 24 }} />
      </w>
      <w type="STATIC" ws={VISIBLE} text="渲染 DPI" style={{ height: 22 }} />
      <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'row', gap: 4, height: 22 }}>
        <Input value={renderDPI} onChange={changeDPI} number style={{ width: 80, height: 20 }} />
        <Button onClick={saveDPI} style={{ width: 50, height: 20 }}>保存</Button>
      </w>
      <w type="STATIC" ws={VISIBLE} text={"构建时间: " + BUILD_TIME} style={{ height: 22 }} />
      <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'row', gap: 4 }}>
        <Button onClick={async () => { setChecking(true); try { await checkAndUpdate() } finally { setChecking(false) } }} disabled={checking} style={{ width: 110, height: 26 }}>{checking ? '检查中...' : '检查更新'}</Button>
        <Button onClick={() => { logger.log('[gc] manual GC triggered'); std.gc() }} style={{ width: 110, height: 26 }}>释放内存 (GC)</Button>
        <Button onClick={() => {
          const exe = getExePath()
          const installDir = exe.substring(0, exe.lastIndexOf('\\'))
          const cacheDir = installDir + '\\_cache'
          logger.log('[cache] exe:', exe)
          logger.log('[cache] cacheDir:', cacheDir)
          const dirResult = os.readdir(cacheDir)
          const names = dirResult ? dirResult[0] : null
          if (names) {
            for (let i = 0; i < names.length; i++) {
              if (names[i] === '.' || names[i] === '..') continue
              os.remove(cacheDir + '\\' + names[i])
            }
          }
          logger.log('[cache] cleared: ' + (names ? names.length : 0) + ' files')
        }} style={{ width: 110, height: 26 }}>清除缓存</Button>
      </w>
      <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'row', gap: 4 }}>
        <Button onClick={() => {
          if (mainHwnd) gui.ShellNotifyIcon(gui.NotifyIconCmd.DELETE, { hwnd: mainHwnd, uID: 1 })
          cleanupMain()
          gui.PostQuitMessage(0)
        }} style={{ width: 110, height: 26 }}>退出</Button>
      </w>
    </w>
  )
}
