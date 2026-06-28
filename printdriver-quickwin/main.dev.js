globalThis.checkUpdate = false
const url = 'http://localhost:4173/entry.js?' + Date.now()
import(url).then(() => {}, console.log)