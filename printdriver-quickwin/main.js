const timestamp = Date.now()

import('https://superprint6.xna00.top/printdriver/entry.js?' + timestamp).catch(e => {
    console.log(e)
    return import('https://superprint.xna00.top/printdriver/entry.js?' + timestamp)
}).catch(e => {
    console.log(e)
})