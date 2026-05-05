import { sendTextMessage, uploadMedia, sendFileMessage } from './weixin/send.ts'
import { getAccessToken } from './weixin/token.ts'
import { execSync } from 'node:child_process'
import { extname, join } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { logger } from "../logger.ts";

const WEIXIN_KF_ID = 'wkHnU4FQAAgFJKiO2JHdsWVrKIM3157Q'
const UPLOADS_DIR = join(process.cwd(), 'uploads')

type NonEventMessage = {
  msgtype: string
  external_userid: string
  open_kfid: string
  file?: { media_id: string }
}

const ensureUploadsDir = (): void => {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

const downloadPdf = async (mediaId: string): Promise<{ fileId: string; filePath: string }> => {
  ensureUploadsDir()

  const accessToken = await getAccessToken()
  const url = `https://qyapi.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`下载文件失败: HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  const contentDisposition = response.headers.get('content-disposition') || ''

  let ext = '.pdf'
  if (contentType.includes('pdf')) {
    ext = '.pdf'
  }

  const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^'";\s]+)/i)
  const filename = filenameMatch ? filenameMatch[1] : `file${ext}`

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16)
  const fileId = hash

  const filePath = join(UPLOADS_DIR, fileId + ext)
  writeFileSync(filePath, buffer)

  return { fileId, filePath }
}

export const handlePdfToWordMessages = async (messages: NonEventMessage[]): Promise<void> => {
  const grouped = Object.groupBy(messages, m => m.external_userid)

  await Promise.all(Object.entries(grouped).map(async ([externalUserId, userMessages = []]) => {
    const kfid = userMessages[0].open_kfid
    const fileMessages = userMessages.filter(m => m.msgtype === 'file')

    for (const msg of fileMessages) {
      const mediaId = msg.file?.media_id
      if (!mediaId) continue

      try {
        await sendTextMessage('📥 正在下载 PDF...', kfid, externalUserId)
        const { fileId, filePath } = await downloadPdf(mediaId)

        const ext = extname(filePath).toLowerCase()
        if (ext !== '.pdf') {
          await sendTextMessage('❌ 请发送 PDF 文件', kfid, externalUserId)
          continue
        }

        await sendTextMessage('📄 正在转换为 Word...', kfid, externalUserId)
        const docxPath = join(UPLOADS_DIR, fileId + '.docx')

        execSync(`/home/xna/.local/bin/pdf2docx convert "${filePath}" --docx_file "${docxPath}" --connected_border_tolerance=0.5`, {
          stdio: 'pipe',
          timeout: 60000
        })

        await sendTextMessage('📤 正在上传 Word...', kfid, externalUserId)
        const docxMediaId = await uploadMedia(docxPath, 'file')
        await sendFileMessage(docxMediaId, kfid, externalUserId)

      } catch (error) {
        logger.error('PDF 转 Word 失败:', error)
        await sendTextMessage('❌ 转换失败，请稍后重试', kfid, externalUserId)
      }
    }
  }))
}
