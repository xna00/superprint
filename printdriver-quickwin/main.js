import * as std from 'std'

const timestamp = Date.now()
const noRetry = scriptArgs.includes('--noretry')

// 远程 entry.js 加载失败时的兜底：启动安装目录下的更新器。
// 更新器会下载最新 exe、替换并重新拉起主程序；透传 --noretry 让重试实例
// 即使再次加载失败也不再触发本兜底，避免死循环。
function launchSetup() {
    if (noRetry) return
    const setup = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint\\QuickSuperPrint_Setup.exe'
    const f = std.open(setup, 'r')
    if (!f) return
    f.close()
    const p = std.popen('start "" "' + setup + '" --noretry', 'r')
    if (p) p.close()
}

import('https://superprint.112287.xyz/printdriver/entry.js?' + timestamp).catch(e => {
    console.log("Error loading superprint.112287.xyz, trying fallback: superprint.xna00.top\n", e)
    return import('https://superprint.xna00.top/printdriver/entry.js?' + timestamp)
}).catch(e => {
    console.log("Error loading superprint:", e)
    launchSetup()
})
