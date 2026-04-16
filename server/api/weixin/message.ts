import { sendTextMessage, sendMsgMenuMessage } from './send.ts'
import { downloadMedia } from './download.ts'
import { WeixinKfUser, PrintTask, PrintFile, Printer, Computer } from '../../models/index.ts'
import { notifyCheckJobs } from '../../ws/index.ts'
import { addTokenToUrl } from '../utils.ts'

const generateTaskId = (): number => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return timestamp * 1000 + random
}

export type TextMessage = {
  content: string
  menu_id?: string
}

type MediaMessage = {
  media_id: string
}

export type LocationMessage = {
  latitude: number
  longitude: number
  name: string
  address: string
}

export type LinkMessage = {
  title: string
  desc: string
  url: string
  pic_url: string
}

export type BusinessCardMessage = {
  userid: string
}

export type MiniprogramMessage = {
  title: string
  appid: string
  pagepath: string
  thumb_media_id: string
}

export type MenuListItem = {
  type: string
  click?: { id: string; content: string }
  view?: { url: string; content: string }
  miniprogram?: { appid: string; pagepath: string; content: string }
}

export type MenuMessage = {
  head_content: string
  list: MenuListItem[]
  tail_content: string
}

export type EventMessage = {
  event_type: string
  open_kfid?: string
  external_userid?: string
  scene?: string
  scene_param?: string
  welcome_code?: string
  fail_msgid?: string
  fail_type?: number
  servicer_userid?: string
  status?: number
  stop_type?: number
  change_type?: number
  old_servicer_userid?: string
  new_servicer_userid?: string
  msg_code?: string
  recall_msgid?: string
  reject_switch?: number
}

export type Message = {
  msgid: string
  send_time: number
  origin: number
  servicer_userid?: string
} & ({
  open_kfid: string
  external_userid: string
} & ({
  msgtype: 'text'
  text: TextMessage
} | {
  msgtype: 'image'
  image: MediaMessage
} | {
  msgtype: 'voice'
  voice: MediaMessage
} | {
  msgtype: 'video'
  video: MediaMessage
} | {
  msgtype: 'file'
  file: MediaMessage
} | {
  msgtype: 'location'
  location: MediaMessage
} | {
  msgtype: 'link'
  link: MediaMessage
} | {
  msgtype: 'business_card'
  business_card: MediaMessage
} | {
  msgtype: 'miniprogram'
  miniprogram: MediaMessage
} | {
  msgtype: 'msgmenu'
  msgmenu: MediaMessage
}) | {
  msgtype: 'event'
  event: EventMessage
})

type NonEventMessage = Message & { msgtype: Exclude<Message['msgtype'], 'event'> }

const HELP_MESSAGE = `📖 帮助信息

欢迎使用打印服务！

可用命令：
• 帮助 - 显示此帮助信息
• 退出登录 - 解除微信账号绑定

发送图片或PDF文件即可创建打印任务。`

const sendHelp = async (openKfId: string, externalUserId: string) => {
  await sendTextMessage(HELP_MESSAGE, openKfId, externalUserId)
  console.log('✅ 帮助信息发送成功')
}

const handleLogout = async (openKfId: string, externalUserId: string) => {
  const kfUser = WeixinKfUser.findOne({ externalUserId })

  if (kfUser) {
    WeixinKfUser.remove({ externalUserId })
    await sendTextMessage(
      '✅ 已成功退出登录，您的微信账号已解除绑定。',
      openKfId,
      externalUserId
    )
    console.log('✅ 用户已退出登录')
  } else {
    await sendTextMessage(
      '您还未登录，无需退出。',
      openKfId,
      externalUserId
    )
  }
}

const handleConfirmById = async (openKfId: string, externalUserId: string, printTaskId: number) => {
  const printTask = PrintTask.findOne({ id: printTaskId }, { printer: true })

  if (!printTask) {
    await sendTextMessage('未找到对应的打印任务。', openKfId, externalUserId)
    return
  }

  if (printTask.state !== 'waiting_confirmation') {
    await sendTextMessage('该打印任务已处理。', openKfId, externalUserId)
    return
  }

  PrintTask.update({ id: printTaskId }, { state: 'waiting_print' })
  if (printTask.printer) {
    notifyCheckJobs(printTask.userId, printTask.printer.computerId)
  }

  await sendTextMessage('✅ 打印任务已确认，等待打印中。', openKfId, externalUserId)
  console.log(`✅ 已确认打印任务 ID: ${printTaskId}`)
}

const handleDeleteById = async (openKfId: string, externalUserId: string, printTaskId: number) => {
  const kfUser = WeixinKfUser.findOne({ externalUserId })
  if (!kfUser) {
    await sendTextMessage('用户未关联。', openKfId, externalUserId)
    return
  }

  const printTask = PrintTask.findOne({ id: printTaskId })

  if (!printTask) {
    await sendTextMessage('未找到对应的打印任务。', openKfId, externalUserId)
    return
  }

  if (printTask.userId !== kfUser.userId) {
    await sendTextMessage('无权删除此任务。', openKfId, externalUserId)
    return
  }

  try {
    PrintFile.remove({ printTaskId: printTaskId })
    PrintTask.remove({ id: printTaskId })
    await sendTextMessage('✅ 打印任务已删除。', openKfId, externalUserId)
    console.log(`✅ 已删除打印任务 ID: ${printTaskId}`)
  } catch (error) {
    await sendTextMessage('删除任务失败，请稍后重试。', openKfId, externalUserId)
    console.error('删除任务失败:', error)
  }
}

const isPresentationFile = (filename: string): boolean => {
  const presentationExts = ['.ppt', '.pptx']
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
  return presentationExts.includes(ext)
}

const processMediaMessage = async (
  message: Message,
  duplex: boolean = true,
  tumble: boolean = false
): Promise<{ fileId: string; filename: string; type: 'image' | 'pdf' } | null> => {
  if (message.msgtype === 'image' && message.image?.media_id) {
    const result = await downloadMedia(message.image.media_id, duplex, tumble)
    return { ...result, type: 'image' }
  }

  if (message.msgtype === 'file' && message.file?.media_id) {
    const fileResult = await downloadMedia(message.file.media_id, duplex, tumble)

    const ext = fileResult.filename.substring(fileResult.filename.lastIndexOf('.')).toLowerCase()
    const officeExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
    if (!officeExts.includes(ext)) {
      console.log(`不支持的文件类型: ${fileResult.filename}`)
      return null
    }

    return { ...fileResult, type: 'pdf' }
  }

  return null
}

const handleMessagesByPrintMan = async (_messages: NonEventMessage[]): Promise<void> => {
  const messages = _messages
  const grouped = Object.groupBy(messages, m => m.external_userid)

  return Promise.all(Object.entries(grouped).map(async ([externalUserId, userMessages = []]) => {
    const kfUser = WeixinKfUser.findOne({
      externalUserId
    }, { user: true })

    const kfid = userMessages[0].open_kfid

    if (!kfUser) {
      console.log(`\n用户 ${externalUserId} 未关联，发送登录链接`)
      if (kfid) {
        const loginUrl = `http://superprint.xna00.top/?external_userid=${externalUserId}&open_kfid=${kfid}`
        await sendTextMessage(
          `请先登录以使用完整功能：${loginUrl}`,
          kfid,
          externalUserId
        )
        console.log('✅ 登录链接发送成功')
      }
      return
    }

    console.log(`\n用户 ${externalUserId} 已关联: ${kfUser.user.username}`)

    const textMessages = userMessages.filter(m => m.msgtype === 'text')
    const mediaMessages = userMessages.filter(m => m.msgtype === 'image' || m.msgtype === 'file')

    const textContents = [...new Set(textMessages.map(m => m.text.content.trim()))]

    for (const msg of textContents) {
      if (msg === '帮助' || msg === 'help' || msg === '?') {
        await sendHelp(kfid, externalUserId)
      } else if (msg === '退出登录' || msg === 'logout') {
        await handleLogout(kfid, externalUserId)
      } else {
        const menuMsg = textMessages.find(m => m.text.content.trim() === msg)
        const menuId = menuMsg?.text.menu_id
        if (menuId?.startsWith('confirm_')) {
          const printTaskId = parseInt(menuId.replace('confirm_', ''))
          await handleConfirmById(kfid, externalUserId, printTaskId)
        } else if (menuId?.startsWith('delete_')) {
          const printTaskId = parseInt(menuId.replace('delete_', ''))
          await handleDeleteById(kfid, externalUserId, printTaskId)
        }
      }
    }

    if (mediaMessages.length === 0) return

    const computers = Computer.findBy({ userId: kfUser.userId }, { printers: true })
    if (computers.length === 0) {
      await sendTextMessage(
        '您还没有添加计算机，请先在网页端添加计算机。',
        kfid,
        externalUserId
      )
      return
    }
    const defaultComputer = computers[0]
    if (defaultComputer.printers.length === 0) {
      await sendTextMessage(
        '您还没有添加打印机，请先在网页端添加打印机。',
        kfid,
        externalUserId
      )
      return
    }

    let existingPrintTask = PrintTask.findBy({
      userId: kfUser.userId,
      state: 'waiting_confirmation'
    }).pop()

    let printTaskId: number
    let isNewJob = false
    let printerId: number

    if (existingPrintTask) {
      printTaskId = existingPrintTask.id
      printerId = existingPrintTask.printerId
      console.log(`使用现有 PrintTask，ID: ${printTaskId}`)
    } else {
      const lastTask = PrintTask.findBy({userId: kfUser.userId}, {printFiles: false, printer: false, user: false}).sort((a, b) => b.id - a.id)[0]
      printerId = lastTask?.printerId ?? defaultComputer.printers[0].id
      printTaskId = generateTaskId()
      PrintTask.insert([{
        id: printTaskId,
        state: 'waiting_confirmation',
        userId: kfUser.userId,
        printerId: printerId
      }])
      isNewJob = true
      console.log(`PrintTask 已创建，ID: ${printTaskId}`)
    }

    const printer = Printer.findBy({id: printerId}, {computer: true}).at(0)!
    if (!printer) {
      await sendTextMessage('未找到可用的打印机，请检查打印机配置。', kfid, externalUserId)
      return
    }

    await Promise.all(mediaMessages.map(async m => {
      const result = await processMediaMessage(m)
      if (!result) {
        console.log(`无法处理消息 ${JSON.stringify(m)}: 无法下载文件`)
        return

      }
      const fileResult = PrintFile.insert([{
        state: 'waiting_print',
        printTaskId: printTaskId,
        fileId: result.fileId,
        filename: result.filename,
        duplex: true,
        tumble: isPresentationFile(result.filename)
      }])
      const fileId = fileResult.lastInsertRowid
      console.log(`PrintFile 已创建，ID: ${fileId}, 文件: ${result.filename}`)
    }))

    const allFiles = PrintFile.findBy({ printTaskId })

    let headContent = isNewJob
      ? `📄 打印工作已创建\n\n`
      : `📄 已添加打印任务\n\n`
    headContent += `计算机: ${printer.computer.name}\n`
    headContent += `打印机: ${printer.name}\n\n`
    headContent += `文件列表:\n`

    for (const file of allFiles) {
      const isImage = file.filename.match(/\.(jpg|jpeg|png|gif)$/i)
      const typeLabel = isImage ? '🖼️' : '📄'
      const duplexLabel = file.duplex ? '双面' : '单面'
      const tumbleLabel = file.tumble ? '短边' : '长边'
      headContent += `${typeLabel} ${file.filename} (${duplexLabel}/${tumbleLabel})\n`
    }

    const printTaskUrl = await addTokenToUrl(`https://superprint.xna00.top/printTask?id=${printTaskId}`, kfUser.userId)

    await sendMsgMenuMessage(
      headContent,
      [
        { content: '确认打印', id: `confirm_${printTaskId}` },
        { content: '删除任务', id: `delete_${printTaskId}` },
        { content: '查看详情', url: printTaskUrl }
      ],
      kfid,
      externalUserId
    )
    console.log('✅ 打印任务信息已发送给用户')
  })).then(() => {
    console.log('✅ 所有用户消息已处理')
  })

}


/**
 * open_kfid 处理函数映射表
 */
const messageHandlerMap: Partial<Record<string, (messages: NonEventMessage[]) => Promise<void>>> = {
  // kfc980d7a665f29536a
  'wkHnU4FQAAnkssZ2Y0t7gAKpQxcw7gjQ': handleMessagesByPrintMan,
}

export const handleMessages = async (_messages: Message[]) => {
  const messages = _messages.filter(m => m.msgtype !== 'event')
  console.log(`共 ${messages.length} 条消息, 来自 ${Object.keys(Object.groupBy(messages, m => m.external_userid)).length} 个用户`)
  const grouped = Object.groupBy(messages, m => m.open_kfid)
  return Promise.all(Object.entries(grouped).map(([openKfId, userMessages = []]) => {
    return messageHandlerMap[openKfId]?.(userMessages)
  }))

}
