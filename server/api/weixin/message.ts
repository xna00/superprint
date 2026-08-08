import { sendTextMessage, sendMsgMenuMessage, uploadMedia, sendFileMessage, sendWelcomeMsg } from './send.ts'

const AUTO_CONFIRM_TIMEOUT = 60_000
const autoConfirmTimers = new Map<number, ReturnType<typeof setTimeout>>()
import { downloadMedia, getFilePath } from './download.ts'
import {
  findWeixinKfUserByExternalUserId,
  insertWeixinKfUser,
  updateWeixinKfUserInfo,
  findPrintTaskWithPrinter,
  updatePrintTaskState,
  findPrintTaskById,
  removePrintFilesByPrintTaskId,
  removePrintTaskById,
  listPrintFilesByPrintTaskIdAndState,
  updatePrintFileState,
  findPrinterById,
  findComputerById,
  listPrintersByWeixinKfUser,
  listWaitingConfirmationTasks,
  listPrintTasksByExternalUserIdAndKfid,
  insertPrintTask,
  findPrinterWithComputer,
  insertPrintFile,
  listPrintFilesByPrintTaskId,
  findPrinterIdByBindKey,
  linkPrinterToWeixinKfUser,
  isPrinterLinkedToWeixinKfUser,
} from '../../models/db.ts'
import { notifyCheckJobs } from '../../ws/index.ts'
import { addTokenToUrl } from '../utils.ts'
import { processDocument, processDocumentSimple } from '../docProcess.ts'
import { handlePdfConvertMessages } from '../pdfConvert.ts'
import { handlePdfToWordMessages } from '../pdfToWord.ts'
import { PRINT_MAN_KF_OPEN_ID, DOCUMENT_KF_OPEN_ID } from './link.ts'
import { getAccessToken } from './token.ts'
import { logger } from "../../logger.ts";

export const generateTaskId = (): number => {
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

发送文档、图片或PDF文件即可创建打印任务。`

const sendHelp = async (openKfId: string, externalUserId: string) => {
  await sendTextMessage(HELP_MESSAGE, openKfId, externalUserId)
  logger.log('✅ 帮助信息发送成功')
}

const handleConfirmById = async (openKfId: string, externalUserId: string, printTaskId: number) => {
  const timer = autoConfirmTimers.get(printTaskId)
  if (timer) {
    clearTimeout(timer)
    autoConfirmTimers.delete(printTaskId)
  }

  const printTask = findPrintTaskWithPrinter(printTaskId)

  if (!printTask) {
    await sendTextMessage('❌ 未找到打印任务', openKfId, externalUserId)
    return
  }

  if (printTask.state !== 'waiting_confirmation') {
    await sendTextMessage('⏭️ 该打印任务已处理', openKfId, externalUserId)
    return
  }

  if (printTask.externalUserId !== externalUserId) {
    await sendTextMessage('❌ 无权操作此任务', openKfId, externalUserId)
    return
  }

  updatePrintTaskState(printTaskId, 'waiting_print')
  if (printTask.printer) {
    notifyCheckJobs(printTask.printer.computerId)
  }

  await sendTextMessage('✅ 已确认，等待打印', openKfId, externalUserId)
  logger.log(`✅ 已确认打印任务 ID: ${printTaskId}`)
}

const handleCancelAutoById = (openKfId: string, externalUserId: string, printTaskId: number) => {
  const timer = autoConfirmTimers.get(printTaskId)
  if (timer) {
    clearTimeout(timer)
    autoConfirmTimers.delete(printTaskId)
    sendTextMessage('⏸️ 已取消自动确认，请点击"立即打印"手动确认', openKfId, externalUserId)
    logger.log(`⏸️ 已取消自动确认打印任务 ID: ${printTaskId}`)
  }
}

const handleDeleteById = async (openKfId: string, externalUserId: string, printTaskId: number) => {
  const timer = autoConfirmTimers.get(printTaskId)
  if (timer) {
    clearTimeout(timer)
    autoConfirmTimers.delete(printTaskId)
  }
  const printTask = findPrintTaskById(printTaskId)

  if (!printTask) {
    await sendTextMessage('❌ 未找到打印任务', openKfId, externalUserId)
    return
  }

  if (printTask.externalUserId !== externalUserId) {
    await sendTextMessage('❌ 无权操作此任务', openKfId, externalUserId)
    return
  }

  try {
    removePrintFilesByPrintTaskId(printTaskId)
    removePrintTaskById(printTaskId)
    await sendTextMessage('✅ 已删除', openKfId, externalUserId)
    logger.log(`✅ 已删除打印任务 ID: ${printTaskId}`)
  } catch (error) {
    await sendTextMessage('❌ 删除失败，请稍后重试', openKfId, externalUserId)
    logger.error('删除任务失败:', error)
  }
}

const handleRetryById = async (openKfId: string, externalUserId: string, printTaskId: number) => {
  const printTask = findPrintTaskById(printTaskId)

  if (!printTask) {
    await sendTextMessage('❌ 未找到打印任务', openKfId, externalUserId)
    return
  }

  if (printTask.externalUserId !== externalUserId) {
    await sendTextMessage('❌ 无权操作此任务', openKfId, externalUserId)
    return
  }

  const failedFiles = listPrintFilesByPrintTaskIdAndState(printTaskId, 'failed')
  
  if (failedFiles.length === 0) {
    await sendTextMessage('⏭️ 没有失败的文件需要重试', openKfId, externalUserId)
    return
  }

  try {
    for (const file of failedFiles) {
      updatePrintFileState(file.id, 'waiting_print')
    }
    updatePrintTaskState(printTaskId, 'waiting_print')

    const printer = findPrinterById(printTask.printerId)
    if (printer) {
      const computer = findComputerById(printer.computerId)
      if (computer) {
        notifyCheckJobs(computer.id)
      }
    }

    await sendTextMessage(`✅ 已重新提交 ${failedFiles.length} 个失败文件进行打印。`, openKfId, externalUserId)
    logger.log(`✅ 已重试打印任务 ID: ${printTaskId}, 文件数: ${failedFiles.length}`)
  } catch (error) {
    await sendTextMessage('重试失败，请稍后再试。', openKfId, externalUserId)
    logger.error('重试打印失败:', error)
  }
}

const isPresentationFile = (filename: string): boolean => {
  const presentationExts = ['.ppt', '.pptx']
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
  return presentationExts.includes(ext)
}

const processMediaMessage = async (
  message: Message,
  kfid: string,
  externalUserId: string,
  duplex: boolean = true,
  tumble: boolean = false
): Promise<{ fileId: string; filename: string; type: 'image' | 'pdf' } | null> => {
  if (message.msgtype === 'image' && message.image?.media_id) {
    const result = await downloadMedia(message.image.media_id, duplex, tumble)
    if (result.converted) {
      const pdfPath = getFilePath(result.fileId)
      if (pdfPath) {
        const originalName = result.filename.replace(/\.[^.]+$/, '')
        const previewMediaId = await uploadMedia(pdfPath, 'file', `[预览]${originalName}.pdf`)
        await sendFileMessage(previewMediaId, kfid, externalUserId)
      }
    }
    return { ...result, type: 'image' }
  }

  if (message.msgtype === 'file' && message.file?.media_id) {
    const fileResult = await downloadMedia(message.file.media_id, duplex, tumble)

    const ext = fileResult.filename.substring(fileResult.filename.lastIndexOf('.')).toLowerCase()
    const officeExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
    if (!officeExts.includes(ext)) {
      logger.log(`不支持的文件类型: ${fileResult.filename}`)
      return null
    }

    if (fileResult.converted) {
      const pdfPath = getFilePath(fileResult.fileId)
      if (pdfPath) {
        const originalName = fileResult.filename.replace(/\.[^.]+$/, '')
        const previewMediaId = await uploadMedia(pdfPath, 'file', `[预览]${originalName}.pdf`)
        await sendFileMessage(previewMediaId, kfid, externalUserId)
      }
    }

    return { ...fileResult, type: 'pdf' }
  }

  return null
}

const handleMessagesByPrintMan = async (_messages: NonEventMessage[]): Promise<void> => {
  const messages = _messages
  const grouped = Object.groupBy(messages, m => m.external_userid)

  return Promise.all(Object.entries(grouped).map(async ([externalUserId, userMessages = []]) => {
    const kfUser = findWeixinKfUserByExternalUserId(externalUserId)

    const kfid = userMessages[0].open_kfid

    if (!kfUser) {
      logger.log(`\n用户 ${externalUserId} 未关联，自动创建`)
      insertWeixinKfUser(externalUserId)
      logger.log(`✅ 已自动创建用户 ${externalUserId}`)
    }

    if (kfid) {
      logger.log(`\n用户 ${externalUserId} 已关联`)
    }

    const textMessages = userMessages.filter(m => m.msgtype === 'text')
    const mediaMessages = userMessages.filter(m => m.msgtype === 'image' || m.msgtype === 'file')

    const textContents = [...new Set(textMessages.map(m => m.text.content.trim()))]

    for (const msg of textContents) {
      if (msg === '帮助' || msg === 'help' || msg === '?') {
        await sendHelp(kfid, externalUserId)
      } else {
        const menuMsg = textMessages.find(m => m.text.content.trim() === msg)
        const menuId = menuMsg?.text.menu_id
        if (menuId?.startsWith('confirm_')) {
          const printTaskId = parseInt(menuId.replace('confirm_', ''))
          await handleConfirmById(kfid, externalUserId, printTaskId)
        } else if (menuId?.startsWith('cancel_auto_')) {
          const printTaskId = parseInt(menuId.replace('cancel_auto_', ''))
          handleCancelAutoById(kfid, externalUserId, printTaskId)
        } else if (menuId?.startsWith('delete_')) {
          const printTaskId = parseInt(menuId.replace('delete_', ''))
          await handleDeleteById(kfid, externalUserId, printTaskId)
        } else if (menuId?.startsWith('retry_')) {
          const printTaskId = parseInt(menuId.replace('retry_', ''))
          await handleRetryById(kfid, externalUserId, printTaskId)
        }
      }
    }

    if (mediaMessages.length === 0) return

    const printers = listPrintersByWeixinKfUser(externalUserId, kfid)
    if (printers.length === 0) {
      await sendTextMessage(
        '⚠️ 请先扫描打印机二维码绑定后再发送文件',
        kfid,
        externalUserId
      )
      return
    }

    const printerIds = new Set(printers.map(p => p.id))

    let existingPrintTask = listWaitingConfirmationTasks(
      externalUserId,
      kfid,
    ).at(-1)

    let printTaskId: number
    let isNewJob = false
    let printerId: number
    let defaultDuplex: boolean | null = null

    if (existingPrintTask) {
      printTaskId = existingPrintTask.id
      printerId = existingPrintTask.printerId
      logger.log(`使用现有 PrintTask，ID: ${printTaskId}`)
    } else {
      const tasks = listPrintTasksByExternalUserIdAndKfid(externalUserId, kfid)
      const lastTask = tasks.find(t => printerIds.has(t.printerId))
      printerId = lastTask?.printerId ?? printers.find(p => p.enabled)?.id ?? printers[0].id
      if (lastTask) {
        const lastFiles = listPrintFilesByPrintTaskId(lastTask.id)
        if (lastFiles.length > 0) {
          defaultDuplex = lastFiles[lastFiles.length - 1].duplex
        }
      }
      printTaskId = generateTaskId()
      insertPrintTask({
        id: printTaskId,
        state: 'waiting_confirmation',
        externalUserId: externalUserId,
        weixinKfId: kfid,
        printerId: printerId
      })
      isNewJob = true
      logger.log(`PrintTask 已创建，ID: ${printTaskId}`)
    }

    const printer = findPrinterWithComputer(printerId)!
    if (!printer) {
      await sendTextMessage('⚠️ 该打印机不可用，请联系管理员检查', kfid, externalUserId)
      return
    }

    await Promise.all(mediaMessages.map(async m => {
      const result = await processMediaMessage(m, kfid, externalUserId)
      if (!result) {
        logger.log(`无法处理消息 ${JSON.stringify(m)}: 无法下载文件`)
        return

      }
      const fileId = insertPrintFile({
        state: 'waiting_print',
        printTaskId: printTaskId,
        fileId: result.fileId,
        filename: result.filename,
        duplex: defaultDuplex ?? true,
        tumble: isPresentationFile(result.filename)
      })
      logger.log(`PrintFile 已创建，ID: ${fileId}, 文件: ${result.filename}`)
    }))

    const allFiles = listPrintFilesByPrintTaskId(printTaskId)

    let headContent = isNewJob
      ? `📄 打印任务已创建\n\n`
      : `📄 已追加文件到打印任务\n\n`
    headContent += `🖨️ ${printer.name} (${printer.computer.name})\n\n`

    for (const file of allFiles) {
      const isImage = file.filename.match(/\.(jpg|jpeg|png|gif)$/i)
      const typeLabel = isImage ? '🖼️' : '📄'
      const duplexLabel = file.duplex ? '双面' : '单面'
      const tumbleLabel = file.tumble ? '短边' : '长边'
      headContent += `${typeLabel} ${file.filename} (${duplexLabel}/${tumbleLabel})\n`
    }

    headContent += '\n💡 查看详情可修改设置'
    headContent += `\n⏰ 1分钟后自动确认`

    const printTaskUrl = await addTokenToUrl(`https://superprint.xna00.top/printTask?id=${printTaskId}`, externalUserId)

    await sendMsgMenuMessage(
      headContent,
      [
        { content: '立即打印', id: `confirm_${printTaskId}` },
        { content: '取消自动打印', id: `cancel_auto_${printTaskId}` },
        { content: '删除任务', id: `delete_${printTaskId}` },
        { content: '查看详情', url: printTaskUrl }
      ],
      kfid,
      externalUserId
    )
    logger.log('✅ 打印任务信息已发送给用户')

    // 重置自动确认定时器（追加文件时也重新计时）
    const oldTimer = autoConfirmTimers.get(printTaskId)
    if (oldTimer) clearTimeout(oldTimer)
    const timer = setTimeout(async () => {
      autoConfirmTimers.delete(printTaskId)
      logger.log(`⏰ 自动确认打印任务 ID: ${printTaskId}`)
      await handleConfirmById(kfid, externalUserId, printTaskId)
    }, AUTO_CONFIRM_TIMEOUT)
    autoConfirmTimers.set(printTaskId, timer)
  })).then(() => {
    logger.log('✅ 所有用户消息已处理')
  })

}


const handleDocProcessMessages = async (_messages: NonEventMessage[]): Promise<void> => {
  const grouped = Object.groupBy(_messages, m => m.external_userid)

  await Promise.all(Object.entries(grouped).map(async ([externalUserId, userMessages = []]) => {
    const kfUser = findWeixinKfUserByExternalUserId(externalUserId)
    const kfid = userMessages[0].open_kfid

    const textMessages = userMessages.filter(m => m.msgtype === 'text')
    const mediaMessages = userMessages.filter(m => m.msgtype === 'image' || m.msgtype === 'file')

    for (const message of mediaMessages) {
      const mediaId = message.msgtype === 'image' ? message.image?.media_id : message.file?.media_id
      if (!mediaId) continue

      try {
        await sendTextMessage('🔍 正在识别公文，请稍候...', kfid, externalUserId)

        if (kfUser) {
          const result = await processDocument(mediaId, kfid, externalUserId)
          const pdfMediaId = await uploadMedia(result.pdfPath, 'file')
          await sendFileMessage(pdfMediaId, kfid, externalUserId)
        } else {
          const result = await processDocumentSimple(mediaId)
          
          await sendTextMessage(
            `✅ 公文识别完成\n\n文号: ${result.recognized.document_number}\n单位: ${result.recognized.issuing_unit}\n标题: ${result.recognized.title}`,
            kfid,
            externalUserId
          )

          const pdfMediaId = await uploadMedia(result.pdfPath, 'file')
          await sendFileMessage(pdfMediaId, kfid, externalUserId)
        }
      } catch (error: any) {
        logger.error('公文处理失败:', error)
        await sendTextMessage(`❌ 公文处理失败: ${error.message}`, kfid, externalUserId)
      }
    }

    for (const message of textMessages) {
      const content = message.text.content.trim()
      const menuId = message.text.menu_id

      if (menuId?.startsWith('confirm_')) {
        const printTaskId = parseInt(menuId.replace('confirm_', ''))
        await handleConfirmById(kfid, externalUserId, printTaskId)
      } else if (menuId?.startsWith('cancel_auto_')) {
        const printTaskId = parseInt(menuId.replace('cancel_auto_', ''))
        handleCancelAutoById(kfid, externalUserId, printTaskId)
      } else if (menuId?.startsWith('delete_')) {
        const printTaskId = parseInt(menuId.replace('delete_', ''))
        await handleDeleteById(kfid, externalUserId, printTaskId)
      } else if (menuId?.startsWith('retry_')) {
        const printTaskId = parseInt(menuId.replace('retry_', ''))
        await handleRetryById(kfid, externalUserId, printTaskId)
      }
    }
  }))
}

/**
 * open_kfid 处理函数映射表
 */
const messageHandlerMap: Partial<Record<string, (messages: NonEventMessage[]) => Promise<void>>> = {
  [PRINT_MAN_KF_OPEN_ID]: handleMessagesByPrintMan,
  [DOCUMENT_KF_OPEN_ID]: handleDocProcessMessages,
  'wkHnU4FQAAAO-EtO4HBU2vWdk213Gwjg': handlePdfConvertMessages,
  'wkHnU4FQAAgFJKiO2JHdsWVrKIM3157Q': handlePdfToWordMessages,
}

const batchgetCustomerInfo = async (externalUserId: string) => {
  try {
    const accessToken = await getAccessToken()
    const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/customer/batchget?access_token=${accessToken}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ external_userid_list: [externalUserId] }),
    })
    const data = await response.json() as {
      errcode: number
      errmsg: string
      customer_list?: {
        external_userid: string
        nickname: string
        avatar: string
        gender: number
        unionid: string
      }[]
      invalid_external_userid?: string[]
    }
    if (data.errcode !== 0) {
      logger.error(`获取客户信息失败: ${data.errmsg} (errcode: ${data.errcode})`)
      return
    }
    const customer = data.customer_list?.[0]
    if (customer) {
      updateWeixinKfUserInfo(
        externalUserId,
        customer.nickname || null,
        customer.avatar || null,
        typeof customer.gender === 'number' ? customer.gender as 0 | 1 | 2 : null,
        customer.unionid || null,
      )
      logger.log(`✅ 已更新客户信息: ${externalUserId} nickname=${customer.nickname}`)
    }
  } catch (error) {
    logger.error(`获取客户信息异常: ${error}`)
  }
}

const handleEnterSessionEvents = async (events: (Message & { msgtype: 'event' })[]) => {
  for (const m of events) {
    try {
      const event = m.event
      if (event.event_type !== 'enter_session') continue

      const sceneParam = event.scene_param
      const externalUserId = event.external_userid
      const openKfId = event.open_kfid
      if (!sceneParam || !externalUserId || !openKfId) continue

      const printerId = findPrinterIdByBindKey(sceneParam)
      if (!printerId) {
        logger.log(`进入会话未匹配打印机: externalUserId=${externalUserId} sceneParam=${sceneParam}`)
        continue
      }

      if (!findWeixinKfUserByExternalUserId(externalUserId)) {
        insertWeixinKfUser(externalUserId)
      }

      const printer = findPrinterById(printerId)
      const alreadyLinked = isPrinterLinkedToWeixinKfUser(externalUserId, printerId, openKfId)
      let result = { changes: 0 }
      if (!alreadyLinked) {
        result = linkPrinterToWeixinKfUser(externalUserId, printerId, openKfId)
      }
      if (openKfId === PRINT_MAN_KF_OPEN_ID && !isPrinterLinkedToWeixinKfUser(externalUserId, printerId, DOCUMENT_KF_OPEN_ID)) {
        linkPrinterToWeixinKfUser(externalUserId, printerId, DOCUMENT_KF_OPEN_ID)
      }
      if (result.changes > 0 && printer) {
        logger.log(`✅ 用户 ${externalUserId} 经客服 ${openKfId} 绑定打印机 ${printer.name} (#${printerId})`)
        await sendTextMessage(`✅ 已绑定打印机「${printer.name}」，现在可以发送文件打印了`, openKfId, externalUserId)
        if (event.welcome_code) {
          try {
            await sendWelcomeMsg(
              event.welcome_code,
              openKfId,
              externalUserId,
              `✅ 已绑定打印机「${printer.name}」，现在可以发送文件打印了`
            )
          } catch (error) {
            logger.error('发送欢迎语失败:', error)
          }
        }
      }
      batchgetCustomerInfo(externalUserId)
    } catch (error) {
      logger.error('处理进入会话事件失败:', error)
    }
  }
}

export const handleMessages = async (_messages: Message[]) => {
  const events = _messages.filter((m): m is Message & { msgtype: 'event' } => m.msgtype === 'event')
  const messages = _messages.filter(m => m.msgtype !== 'event')
  if (events.length > 0) {
    await handleEnterSessionEvents(events)
  }
  logger.log(`共 ${messages.length} 条消息, 来自 ${Object.keys(Object.groupBy(messages, m => m.external_userid)).length} 个用户`)
  const grouped = Object.groupBy(messages, m => m.open_kfid)
  return Promise.all(Object.entries(grouped).map(([openKfId, userMessages = []]) => {
    return messageHandlerMap[openKfId]?.(userMessages)
  }))

}