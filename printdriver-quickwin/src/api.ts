import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as std from 'std'
import { createHandler } from 'api/index.js'
import { API_BASE_URLS, COOKIE_FILE } from './config.js'

let _cookie: string | null = null

{
  const f = std.open(COOKIE_FILE, 'r')
  if (f) { const l = f.getline(); f.close(); if (l) _cookie = l }
}

const firstBase = API_BASE_URLS[0]

export const api = createHandler(firstBase, {
  fetch: async (req) => {
    const f = std.open(COOKIE_FILE, 'r')
    if (f) { const l = f.getline(); f.close(); if (l) req.headers.set('Cookie', l) }

    const pathAndQuery = req.url.slice(firstBase.length)
    let lastErr: unknown
    for (const base of API_BASE_URLS) {
      try {
        const res = await fetch(base + pathAndQuery, {
          ...req,
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
          body: req.body ?? undefined,
        })
        const sc = res.headers.get('set-cookie')
        if (sc) {
          const semi = sc.indexOf(';')
          _cookie = semi >= 0 ? sc.slice(0, semi) : sc
          const f2 = std.open(COOKIE_FILE, 'w')
          if (f2) { f2.puts(_cookie!); f2.close() }
        }
        return res
      } catch (e) {
        lastErr = e;
        console.log(base, "failed, try next!")
      }
    }
    throw lastErr
  },
})
export function getCookie(): string | null { return _cookie }
