import './ua.js'
import './metadata.js'
import './main.js'
import { logger } from './logger.js'
import * as win from 'win'

const exePath = win.GetModuleFileName() || 'unknown'
const baseUrl = import.meta.url.substring(0, import.meta.url.lastIndexOf('/') + 1)
logger.log('[entry] exe:', exePath)
logger.log('[entry] baseUrl:', baseUrl)
logger.log('[entry] scriptArgs:', scriptArgs)

globalThis.__APP_METADATA__?.then(m => {
  for (const file of m.preload || []) {
    const url = baseUrl + file
    console.log('[preload]', url)
    fetch(url)
      .then(() => console.log('[preload] done:', file))
      .catch(e => console.log('[preload] error:', file, e))
  }
}).catch(e => {
  console.log('[preload] metadata error:', e)
})
