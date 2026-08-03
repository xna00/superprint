import './ua.js'
import "./main.js"
import { logger } from './logger.js'
type ManifestEntry = { isDynamicEntry?: boolean; file?: string }
import * as win from 'win'

const exePath = win.GetModuleFileName() || 'unknown'
const baseUrl = import.meta.url.substring(0, import.meta.url.lastIndexOf('/') + 1)
logger.log('[entry] exe:', exePath)
logger.log('[entry] baseUrl:', baseUrl)
logger.log('[entry] scriptArgs:', scriptArgs)

fetch(baseUrl + 'vite_manifest.json?t=' + Date.now())
  .then(r => r.json())
  .then(m => {
    for (const [src, info] of Object.entries(m as Record<string, unknown>)) {
      const entry = info as ManifestEntry
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
