import { getAccessToken } from './token.ts'
import type { Message } from './message.ts'
import { WeixinKf } from '../../models/index.ts'

type SyncMsgRequest = {
  cursor?: string
  token?: string
  limit?: number
  voice_format?: number
  open_kfid: string
}

type SyncMsgResponse = {
  errcode: number
  errmsg: string
  next_cursor?: string
  has_more?: number
  msg_list?: Message[]
}

const loadCursor = (openKfId: string): string | null => {
  try {
    const kf = WeixinKf.findOne({ id: openKfId })
    return kf?.messageCursor || null
  } catch (error) {
    console.error('读取 cursor 失败:', error)
  }
  return null
}

const saveCursor = (openKfId: string, cursor: string): void => {
  try {
    const existing = WeixinKf.findOne({ id: openKfId })
    if (existing) {
      WeixinKf.update({ id: openKfId }, { messageCursor: cursor })
    } else {
      WeixinKf.insert([{ id: openKfId, messageCursor: cursor }])
    }
  } catch (error) {
    console.error('保存 cursor 失败:', error)
  }
}

export const syncMessages = async (
  token: string,
  openKfId: string,
  cursor?: string
): Promise<SyncMsgResponse & { next_cursor: string; has_more: number }> => {
  const accessToken = await getAccessToken()
  const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/sync_msg?access_token=${accessToken}`
  
  const requestBody: SyncMsgRequest = {
    token,
    open_kfid: openKfId,
    limit: 1000,
    voice_format: 0
  }
  
  const savedCursor = cursor || loadCursor(openKfId)
  if (savedCursor) {
    requestBody.cursor = savedCursor
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  
  const data = await response.json() as SyncMsgResponse
  
  if (data.errcode !== 0) {
    throw new Error(`同步消息失败: ${data.errmsg} (errcode: ${data.errcode})`)
  }
  
  if (data.next_cursor) {
    saveCursor(openKfId, data.next_cursor)
  }
  
  return data as SyncMsgResponse & { next_cursor: string; has_more: number }
}
