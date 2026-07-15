import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import { createHandler } from 'api/index.js'
import { API_BASE_URLS } from './config.js'
import { getCookie, setCookie } from './storage.js'
import { logger } from './logger.js'

const firstBase = API_BASE_URLS[0]

export const api = createHandler(firstBase, {
  fetch: async (req) => {
    const cookie = getCookie()
    if (cookie) req.headers.set('Cookie', cookie)

    const pathAndQuery = req.url.slice(firstBase.length)
    let lastErr: unknown
    for (const base of API_BASE_URLS) {
      try {
        const res = await fetch(base + pathAndQuery, {
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
          body: req.body ?? undefined,
        })
        const sc = res.headers.get('set-cookie')
        if (sc) {
          const semi = sc.indexOf(';')
          setCookie(semi >= 0 ? sc.slice(0, semi) : sc)
        }
        return res
      } catch (e) {
        lastErr = e;
        logger.log(base, "failed, try next!")
      }
    }
    throw lastErr
  },
})
