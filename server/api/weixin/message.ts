import { sendTextMessage } from './send.ts'
import { downloadMedia } from './download.ts'
import { WeixinKfUser, PrintJob, PrintTask, Printer, Computer } from '../../models/index.ts'
import { notifyCheckJobs } from '../../ws/index.ts'

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
• 确认 - 确认打印任务
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

const handleConfirm = async (openKfId: string, externalUserId: string, userId: number) => {
  const printJobs = PrintJob.findBy({
    userId,
    state: 'waiting_confirmation'
  }, { printer: true })

  if (printJobs.length === 0) {
    await sendTextMessage(
      '没有待确认的打印任务。',
      openKfId,
      externalUserId
    )
    return
  }

  for (const job of printJobs) {
    PrintJob.update({ id: job.id }, { state: 'waiting_print' })
    if (job.printer) {
      notifyCheckJobs(userId, job.printer.computerId)
    }
  }

  await sendTextMessage(
    `✅ 已确认 ${printJobs.length} 个打印任务，等待打印中。`,
    openKfId,
    externalUserId
  )
  console.log(`✅ 已确认 ${printJobs.length} 个打印任务`)
}

const processMediaMessage = async (message: Message): Promise<{ fileId: string; filename: string; type: 'image' | 'pdf' } | null> => {
  if (message.msgtype === 'image' && message.image?.media_id) {
    const result = await downloadMedia(message.image.media_id)
    return { ...result, type: 'image' }
  }

  if (message.msgtype === 'file' && message.file?.media_id) {
    const result = await downloadMedia(message.file.media_id)

    if (!result.filename.toLowerCase().endsWith('.pdf')) {
      console.log(`文件类型不是PDF: ${result.filename}`)
      return null
    }

    return { ...result, type: 'pdf' }
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
      } else if (msg === '确认') {
        await handleConfirm(kfid, externalUserId, kfUser.userId)
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
    const defaultPrinter = defaultComputer.printers[0]

    let existingPrintJob = PrintJob.findBy({
      userId: kfUser.userId,
      state: 'waiting_confirmation'
    }).pop()

    let printJobId: number
    let isNewJob = false

    if (existingPrintJob) {
      printJobId = existingPrintJob.id
      console.log(`使用现有 PrintJob，ID: ${printJobId}`)
    } else {
      const printJobResult = PrintJob.insert([{
        state: 'waiting_confirmation',
        userId: kfUser.userId,
        printerId: defaultPrinter.id
      }])
      printJobId = printJobResult.lastInsertRowid as number
      isNewJob = true
      console.log(`PrintJob 已创建，ID: ${printJobId}`)
    }

    await Promise.all(mediaMessages.map(async m => {
      const result = await processMediaMessage(m)
      if (!result) {
        console.log(`无法处理消息 ${JSON.stringify(m)}: 无法下载文件`)
        return

      }
      const taskResult = PrintTask.insert([{
        state: 'waiting_print',
        printJobId: printJobId,
        fileId: result.fileId,
        filename: result.filename,
        duplex: true,
        tumple: false
      }])
      const taskId = taskResult.lastInsertRowid
      console.log(`PrintTask 已创建，ID: ${taskId}, 文件: ${result.filename}`)
    }))

    const allTasks = PrintTask.findBy({ printJobId })

    let taskInfo = isNewJob
      ? `📄 打印工作已创建\n\n`
      : `📄 已添加打印任务\n\n`
    taskInfo += `计算机: ${defaultComputer.name}\n`
    taskInfo += `打印机: ${defaultPrinter.name}\n\n`
    taskInfo += `打印工作ID: ${printJobId}\n`
    taskInfo += `任务数量: ${allTasks.length}\n\n`
    taskInfo += `任务列表:\n`

    for (const task of allTasks) {
      const isImage = task.filename.match(/\.(jpg|jpeg|png|gif)$/i)
      const typeLabel = isImage ? '🖼️' : '📄'
      const duplexLabel = task.duplex ? '双面' : '单面'
      const tumbleLabel = task.tumple ? '短边' : '长边'
      let displayName = task.filename
      if (isImage && displayName.length > 10) {
        displayName = displayName.slice(0, 10) + '...'
      }
      taskInfo += `${typeLabel} ${displayName} (${duplexLabel}/${tumbleLabel})\n`
    }

    taskInfo += `\n回复"确认"开始打印\n`
    taskInfo += `\n🔗 查看详情: https://superprint.xna00.top/print-job?id=${printJobId}`

    await sendTextMessage(taskInfo, kfid, externalUserId)
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

