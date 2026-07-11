import { useState } from 'react'
import * as gui from 'gui'
import { CheckBox } from 'quickwin/lib/react-qw/index.js'
import { storageGet, storageSet } from '../storage.js'
import { BUILD_TIME } from '../config.js'

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
    </w>
  )
}
