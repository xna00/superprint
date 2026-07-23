import 'quickwin/lib/polyfill.js'
import "./main.js"

const baseUrl = import.meta.url.substring(0, import.meta.url.lastIndexOf('/') + 1)

fetch(baseUrl + 'vite_manifest.json?t=' + Date.now())
  .then(r => r.json())
  .then(m => {
    for (const [src, info] of Object.entries(m)) {
      const entry = info as any
      if (entry.isDynamicEntry && entry.file && entry.file.endsWith('.js')) {
        const url = baseUrl + entry.file
        console.log('[preload]', src, url)
        fetch(url)
          .then(() => console.log('[preload] done:', entry.file))
          .catch(e => console.log('[preload] error:', entry.file, e))
      }
    }
  })
  .catch(e => {
    console.log('[preload] manifest error:', e)
  })
