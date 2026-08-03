import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import { createHandler } from 'api/index.js'
import { API_BASE_URLS } from './config.js'
import { getDeviceId } from './device.js'
import { logger } from './logger.js'

const firstBase = API_BASE_URLS[0]

export const api = createHandler(firstBase, {
  fetch: async (req) => {
    const deviceId = getDeviceId()
    if (deviceId) req.headers.set('X-Computer-ID', deviceId)

    const pathAndQuery = req.url.slice(firstBase.length)
    let lastErr: unknown
    for (const base of API_BASE_URLS) {
      try {
        const r = req.clone()
        const res = await fetch(base + pathAndQuery, {
          method: r.method,
          headers: Object.fromEntries(r.headers.entries()),
          body: r.body,
        })
        return res
      } catch (e) {
        lastErr = e;
        logger.log(base, "failed, try next!")
      }
    }
    throw lastErr
  },
})
