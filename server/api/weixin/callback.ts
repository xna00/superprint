import { decrypt } from "@wecom/crypto"
import { WECOM_ENCODING_AES_KEY } from '../constants.ts'
import { syncMessages } from './sync.ts'
import { handleMessages } from './message.ts'

type CallbackEvent = {
  ToUserName: string
  CreateTime: number
  MsgType: string
  Event: string
  Token: string
  OpenKfId: string
}

const parseXml = async (xmlString: string): Promise<CallbackEvent> => {
  const getValue = (tag: string): string => {
    const match = xmlString.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`))
    return match ? match[1] : ''
  }
  
  return {
    ToUserName: getValue('ToUserName'),
    CreateTime: parseInt(getValue('CreateTime') || '0'),
    MsgType: getValue('MsgType'),
    Event: getValue('Event'),
    Token: getValue('Token'),
    OpenKfId: getValue('OpenKfId')
  }
}

const validateUrl = (req: Request): Promise<Response> => {
  const searchParams = new URL(req.url).searchParams
  const echostr = searchParams.get("echostr")
  const { message } = decrypt(WECOM_ENCODING_AES_KEY, echostr!)
  return Promise.resolve(new Response(message))
}

export const _outKFCallback = async (req: Request): Promise<Response> => {
  if (req.method === "GET") {
    return validateUrl(req)
  }
  
  if (req.method === "POST") {
    try {
      const body = await req.text()
      console.log('\n========== 收到回调 ==========')
      console.log('时间:', new Date().toISOString())
      console.log('原始请求体:', body.substring(0, 200) + '...')
      
      const url = new URL(req.url)
      const msgSignature = url.searchParams.get('msg_signature')
      const timestamp = url.searchParams.get('timestamp')
      const nonce = url.searchParams.get('nonce')
      
      console.log('签名参数:', { msgSignature, timestamp, nonce })
      
      const encryptMatch = body.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/)
      if (encryptMatch) {
        console.log('检测到加密消息，正在解密...')
        const encrypt = encryptMatch[1]
        const { message, id } = decrypt(WECOM_ENCODING_AES_KEY, encrypt)
        console.log('解密后的完整消息:', message)
        
        const callbackEvent = await parseXml(message)
        console.log('解析结果:', JSON.stringify(callbackEvent, null, 2))
        console.log('事件类型:', callbackEvent.Event)
        console.log('客服账号:', callbackEvent.OpenKfId)
        console.log('Token:', callbackEvent.Token ? callbackEvent.Token.substring(0, 20) + '...' : 'null')
        
        if (callbackEvent.Event === 'kf_msg_or_event') {
          console.log('\n开始拉取消息...')
          const syncResponse = await syncMessages(
            callbackEvent.Token,
            callbackEvent.OpenKfId
          )
          
          const msgList = syncResponse.msg_list || []
          console.log(`拉取到 ${msgList.length} 条消息`)
          console.log(`还有更多: ${syncResponse.has_more === 1 ? '是' : '否'}`)
          
          const allMessages = [...msgList]
          
          while (syncResponse.has_more === 1) {
            console.log('\n继续拉取更多消息...')
            const nextResponse = await syncMessages(
              callbackEvent.Token,
              callbackEvent.OpenKfId,
              syncResponse.next_cursor
            )
            
            const nextMsgList = nextResponse.msg_list || []
            console.log(`拉取到 ${nextMsgList.length} 条消息`)
            
            allMessages.push(...nextMsgList)
            
            if (nextResponse.has_more === 0) break
          }
          
          await handleMessages(allMessages)
        }
      } else {
        console.log('未检测到加密，尝试直接解析...')
        const callbackEvent = await parseXml(body)
        console.log('事件类型:', callbackEvent.Event)
        console.log('客服账号:', callbackEvent.OpenKfId)
        console.log('Token:', callbackEvent.Token.substring(0, 20) + '...')
      }
      
      console.log('==============================\n')
      return new Response("success")
    } catch (error) {
      console.error('处理回调失败:', error)
      return new Response("success")
    }
  }
  
  return new Response("success")
}
