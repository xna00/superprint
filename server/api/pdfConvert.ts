import { downloadMedia, convertOfficeToPdf, convertImageToPdf, isOfficeFile, getUploadsDir } from './weixin/download.ts'
import { sendTextMessage, uploadMedia, sendFileMessage } from './weixin/send.ts'
import { extname, join } from 'node:path'
import { existsSync } from 'node:fs'

const WEIXIN_KF_ID = 'wkHnU4FQAAAO-EtO4HBU2vWdk213Gwjg'

const SUPPORTED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif']
const SUPPORTED_OFFICE_EXTS = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']

type NonEventMessage = {
  msgtype: string
  external_userid: string
  open_kfid: string
  image?: { media_id: string }
  file?: { media_id: string }
}

export const handlePdfConvertMessages = async (messages: NonEventMessage[]): Promise<void> => {
  const grouped = Object.groupBy(messages, m => m.external_userid)

  await Promise.all(Object.entries(grouped).map(async ([externalUserId, userMessages = []]) => {
    const kfid = userMessages[0].open_kfid
    const mediaMessages = userMessages.filter(m => m.msgtype === 'image' || m.msgtype === 'file')

    for (const msg of mediaMessages) {
      await processFileMessage(msg, kfid, externalUserId)
    }
  }))
}

const processFileMessage = async (msg: NonEventMessage, kfid: string, externalUserId: string): Promise<void> => {
  const mediaId = msg.msgtype === 'image' ? msg.image?.media_id : msg.file?.media_id
  if (!mediaId) return

  try {    
    await sendTextMessage('📄 正在转换为 PDF...', kfid, externalUserId)
    const result = await downloadMediaSimple(mediaId)
    const pdfPath = await convertToPdf(result.fileId, result.filename)

    if (!pdfPath) {
      await sendTextMessage('❌ 不支持的文件类型', kfid, externalUserId)
      return
    }

    const pdfMediaId = await uploadMedia(pdfPath, 'file')

    await sendFileMessage(pdfMediaId, kfid, externalUserId)
    console.log(`✅ PDF 发送成功: ${result.filename}`)

  } catch (error) {
    console.error('PDF 转换失败:', error)
    await sendTextMessage('❌ 转换失败，请稍后重试', kfid, externalUserId)
  }
}

const downloadMediaSimple = async (mediaId: string): Promise<{ fileId: string; filename: string }> => {
  const result = await downloadMedia(mediaId, false, false)
  return result
}

const convertToPdf = async (fileId: string, filename: string): Promise<string | null> => {
  const ext = extname(filename).toLowerCase()
  const uploadsDir = getUploadsDir()

  if (ext === '.pdf') {
    const pdfPath = join(uploadsDir, fileId + '.pdf')
    if (existsSync(pdfPath)) return pdfPath
    return null
  }

  if (SUPPORTED_IMAGE_EXTS.includes(ext)) {
    const imagePath = join(uploadsDir, fileId + ext)
    if (!existsSync(imagePath)) return null
    const pdfPath = convertImageToPdf(imagePath)
    return pdfPath
  }

  if (SUPPORTED_OFFICE_EXTS.includes(ext)) {
    const officePath = join(uploadsDir, fileId + ext)
    if (!existsSync(officePath)) return null
    const pdfPath = convertOfficeToPdf(officePath)
    return pdfPath
  }

  return null
}
