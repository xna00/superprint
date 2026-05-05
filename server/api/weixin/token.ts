import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { WECOM_CORP_ID, WECOM_CORP_SECRET } from '../constants.ts'
import { logger } from "../../logger.ts";

const CACHE_FILE = join(process.cwd(), 'cache.local.json')

type AccessTokenResponse = {
  errcode: number
  errmsg: string
  access_token: string
  expires_in: number
}

type CachedToken = {
  accessToken: string
  expiresAt: number
}

let tokenCache: CachedToken | null = null

const loadTokenFromCache = (): CachedToken | null => {
  try {
    if (existsSync(CACHE_FILE)) {
      const data = readFileSync(CACHE_FILE, 'utf-8')
      const cached = JSON.parse(data) as CachedToken
      if (cached.accessToken && cached.expiresAt && Date.now() < cached.expiresAt) {
        return cached
      }
    }
  } catch (error) {
    logger.error('读取缓存文件失败:', error)
  }
  return null
}

const saveTokenToCache = (token: CachedToken): void => {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(token, null, 2), 'utf-8')
  } catch (error) {
    logger.error('写入缓存文件失败:', error)
  }
}

const deleteCacheFile = (): void => {
  try {
    if (existsSync(CACHE_FILE)) {
      writeFileSync(CACHE_FILE, '', 'utf-8')
    }
  } catch (error) {
    logger.error('删除缓存文件失败:', error)
  }
}

export const getAccessToken = async (): Promise<string> => {
  if (!tokenCache) {
    tokenCache = loadTokenFromCache()
  }
  
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken
  }

  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${WECOM_CORP_ID}&corpsecret=${WECOM_CORP_SECRET}`
  
  const response = await fetch(url)
  const data = await response.json() as AccessTokenResponse
  
  if (data.errcode !== 0) {
    throw new Error(`获取 access_token 失败: ${data.errmsg} (errcode: ${data.errcode})`)
  }
  
  const bufferTime = 5 * 60 * 1000
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000) - bufferTime
  }
  
  saveTokenToCache(tokenCache)
  
  return data.access_token
}

export const clearAccessTokenCache = (): void => {
  tokenCache = null
  deleteCacheFile()
}

export const getTestToken = async () => {
  try {
    const token = await getAccessToken()
    return {
      success: true,
      access_token: token.substring(0, 20) + '...',
      expires_at: tokenCache?.expiresAt,
      remaining_time: tokenCache ? Math.floor((tokenCache.expiresAt - Date.now()) / 1000) : 0
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
