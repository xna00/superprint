import * as os from 'os'
import * as std from 'std'

const installDir = (std.getenv('LOCALAPPDATA') || '') + '\\SuperPrint'
os.chdir(installDir)

const timestamp = Date.now()

import('https://superprint6.xna00.top/printdriver/entry.js?' + timestamp).catch(e => {
    console.log("Error loading superprint6, trying fallback: superprint.xna00.top\n", e)
    return import('https://superprint.xna00.top/printdriver/entry.js?' + timestamp)
}).catch(e => {
    console.log("Error loading superprint:", e)
})