import { getAccessToken } from './token.ts'

type SendMessageRequest = {
  touser: string
  open_kfid: string
  msgtype: string
  text: {
    content: string
  }
}

type MsgMenuItem = 
  | { content: string; id: string }
  | { content: string; url: string }

type MsgMenuRequest = {
  touser: string
  open_kfid: string
  msgtype: 'msgmenu'
  msgmenu: {
    head_content: string
    list: { click?: { id: string; content: string }; view?: { url: string; content: string } }[]
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

export const sendMsgMenuMessage = async (
  headContent: string,
  menuList: MsgMenuItem[],
  openKfId: string,
  externalUserId: string
): Promise<string> => {
  const accessToken = await getAccessToken()
  const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg?access_token=${accessToken}`

  const list = menuList.map(item => {
    if ('url' in item) {
      return { type: 'view' as const, view: { url: item.url, content: item.content } }
    } else {
      return { type: 'click' as const, click: { id: item.id, content: item.content } }
    }
  })

  const requestBody: MsgMenuRequest = {
    touser: externalUserId,
    open_kfid: openKfId,
    msgtype: 'msgmenu',
    msgmenu: {
      head_content: headContent,
      list: list
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
  console.log('msgmenu response:', data)

  if (data.errcode !== 0) {
    throw new Error(`发送消息失败: ${data.errmsg} (errcode: ${data.errcode})`)
  }

  return data.msgid
}
