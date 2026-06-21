const url = 'http://localhost:4173/entry.js?' + Date.now()
console.log(url)
import(url).then(() => {}, console.log)