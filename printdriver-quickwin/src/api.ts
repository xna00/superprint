import 'quickwin/lib/polyfill.js'
import 'quickwin/lib/fetch.js'
import * as std from 'std'
import { API_BASE_URLS, COOKIE_FILE } from './config.js'

let _cookie: string | null = null

function isGetMethod(path: string): boolean {
    const last = path.split('/').pop() || ''
    return last.startsWith('get')
}

export function getCookie(): string | null {
    return _cookie
}

export function setCookie(cookie: string): void {
    _cookie = cookie
}

export function saveCookie(filepath?: string): void {
    if (!_cookie) return
    const f = std.open(filepath || COOKIE_FILE, 'w')
    if (f) {
        f.puts(_cookie)
        f.close()
    }
}

export function loadCookie(filepath?: string): void {
    const f = std.open(filepath || COOKIE_FILE, 'r')
    if (f) {
        const line = f.getline()
        f.close()
        if (line) _cookie = line
    }
}

async function apiFetch(path: string, args: any[]): Promise<any> {
    const isGet = isGetMethod(path)

    for (const baseUrl of API_BASE_URLS) {
        const url = isGet
            ? `${baseUrl}${path}?data=${encodeURIComponent(JSON.stringify(args))}`
            : `${baseUrl}${path}`

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }
        if (_cookie) headers['Cookie'] = _cookie

        try {
            const resp = await fetch(url, {
                method: isGet ? 'GET' : 'POST',
                headers,
                body: isGet ? undefined : JSON.stringify(args),
                timeout: 30000,
            })

            if (resp.status === 401) {
                return null
            }

            if (resp.status >= 500) {
                continue
            }

            const contentType = resp.headers.get('content-type') || ''
            if (contentType.toLowerCase().includes('application/json')) {
                const data = await resp.json()

                if (!_cookie) {
                    const setCookieHeader = resp.headers.get('set-cookie')
                    if (setCookieHeader) {
                        const semiIdx = setCookieHeader.indexOf(';')
                        _cookie = semiIdx >= 0 ? setCookieHeader.slice(0, semiIdx) : setCookieHeader
                    }
                }

                return data
            }

            return resp
        } catch {
            continue
        }
    }

    return null
}

export const auth = {
    login: async (user: { username: string; password: string; weixinKfExternalUserId?: string; openKfId?: string }) => {
        return apiFetch('/api/auth/login', [user])
    },
}

export const user = {
    currentUser: async () => {
        return apiFetch('/api/user/currentUser', [])
    },
}

export const computer = {
    computerInfo: async (computerId: string) => {
        return apiFetch('/api/computer/computerInfo', [computerId])
    },
    addComputer: async (id: string, name: string) => {
        return apiFetch('/api/computer/addComputer', [id, name])
    },
    setComputerName: async (id: string, name: string) => {
        return apiFetch('/api/computer/setComputerName', [id, name])
    },
    addComputerPrinter: async (computerId: string, printerName: string) => {
        return apiFetch('/api/computer/addComputerPrinter', [computerId, printerName])
    },
    removeComputerPrinter: async (computerId: string, printerName: string) => {
        return apiFetch('/api/computer/removeComputerPrinter', [computerId, printerName])
    },
}

export const printTask = {
    listPrintTasks: async (query?: { computerId?: string; state?: string }) => {
        return apiFetch('/api/printTask/listPrintTasks', [query])
    },
    fileSucceed: async (id: number) => {
        return apiFetch('/api/printTask/fileSucceed', [id])
    },
    fileFailed: async (id: number) => {
        return apiFetch('/api/printTask/fileFailed', [id])
    },
}

export const files = {
    getPsFile: async (fileId: string): Promise<ArrayBuffer | null> => {
        for (const baseUrl of API_BASE_URLS) {
            const dataParam = encodeURIComponent('["' + fileId + '"]')
            const url = baseUrl + '/api/files/getPsFile?data=' + dataParam
            const headers: Record<string, string> = {}
            if (_cookie) headers['Cookie'] = _cookie
            
            console.log('[api] getPsFile URL: ' + url)
            console.log('[api] getPsFile Cookie: ' + (_cookie ? _cookie.slice(0, 50) + '...' : 'none'))
            
            try {
                const resp = await fetch(url, {
                    method: 'GET',
                    headers,
                    timeout: 60000,
                })
                
                console.log('[api] getPsFile status: ' + resp.status)
                
                if (resp.status !== 200) {
                    const text = await resp.text()
                    console.log('[api] getPsFile response: ' + text.slice(0, 500))
                    continue
                }
                
                const contentType = resp.headers.get('content-type') || ''
                console.log('[api] getPsFile content-type: ' + contentType)
                
                if (contentType.includes('application/json')) {
                    const json = await resp.json()
                    console.log('[api] getPsFile JSON response: ' + JSON.stringify(json).slice(0, 200))
                    continue
                }
                
                const buf = await resp.arrayBuffer()
                console.log('[api] getPsFile downloaded: ' + buf.byteLength + ' bytes')
                return buf
            } catch (e) {
                console.log('[api] getPsFile error: ' + String(e))
                continue
            }
        }
        return null
    },
    getFile: async (fileName: string) => {
        return apiFetch('/api/files/getFile', [fileName])
    },
}
