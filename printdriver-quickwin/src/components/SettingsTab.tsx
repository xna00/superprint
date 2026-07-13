import { useState } from 'react'
import * as gui from 'gui'
import * as os from 'os'
import * as std from 'std'
import { CheckBox, Button } from 'quickwin/lib/react-qw/index.js'
import { storageGet, storageSet } from '../storage.js'
import { BUILD_TIME } from '../config.js'
import { checkAndUpdate } from '../update.js'
import { getExePath } from '../utils.js'

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

  return (
    <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'column', gap: 8, flexGrow: 1 }}>
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
      <w type="STATIC" ws={VISIBLE} text={"构建时间: " + BUILD_TIME} style={{ height: 22 }} />
      <Button onClick={checkAndUpdate} style={{ height: 26 }}>检查更新</Button>
      <Button onClick={() => { console.log('[gc] manual GC triggered'); std.gc() }} style={{ height: 26 }}>释放内存 (GC)</Button>
      <Button onClick={() => {
        const exe = getExePath()
        const installDir = exe.substring(0, exe.lastIndexOf('\\'))
        const cacheDir = installDir + '\\_cache'
        console.log('[cache] exe:', exe)
        console.log('[cache] cacheDir:', cacheDir)
        const dirResult = os.readdir(cacheDir)
        const names = dirResult ? dirResult[0] : null
        if (names) {
          for (let i = 0; i < names.length; i++) {
            if (names[i] === '.' || names[i] === '..') continue
            os.remove(cacheDir + '\\' + names[i])
          }
        }
        console.log('[cache] cleared: ' + (names ? names.length : 0) + ' files')
      }} style={{ height: 26 }}>清除缓存</Button>
    </w>
  )
}
