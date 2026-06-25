import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as std from 'std'
import { createHandler } from 'api/index.js'
import { API_BASE_URL } from './config.js'

let _cookie: string | null = null

{
  const f = std.open('cookie.txt', 'r')
  if (f) { const l = f.getline(); f.close(); if (l) _cookie = l }
}

export const api = createHandler(API_BASE_URL, {
  beforeRequest: async (req) => {
    const f = std.open('cookie.txt', 'r')
    if (f) { const l = f.getline(); f.close(); if (l) req.headers.set('Cookie', l) }
    return req
  },
  beforeResponse: async (res) => {
    const sc = res.headers.get('set-cookie')
    if (sc) {
      const semi = sc.indexOf(';')
      _cookie = semi >= 0 ? sc.slice(0, semi) : sc
      const f = std.open('cookie.txt', 'w')
      if (f) { f.puts(_cookie!); f.close() }
    }
    return res
  },
})
export function getCookie(): string | null { return _cookie }
