import { getAccessToken } from './token.ts'

type SendMessageRequest = {
  touser: string
  open_kfid: string
  msgtype: string
  text: {
    content: string
  }
}

type SendMessageResponse = {
  errcode: number
  errmsg: string
  msgid: string
}

export const sendTextMessage = async (
  content: string,
  openKfId: string,
  externalUserId: string
): Promise<string> => {
  const accessToken = await getAccessToken()
  const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg?access_token=${accessToken}`
  
  const requestBody: SendMessageRequest = {
    touser: externalUserId,
    open_kfid: openKfId,
    msgtype: 'text',
    text: {
      content: content
    }
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  
  const data = await response.json() as SendMessageResponse
  
  if (data.errcode !== 0) {
    throw new Error(`发送消息失败: ${data.errmsg} (errcode: ${data.errcode})`)
  }
  
  return data.msgid
}
