import { readFileSync } from "node:fs"
import { join } from "node:path"
import UZIP from "uzip"
import { recognizeDocument, imageBufferToDataUrl, type RecognizedDocument } from "./ai.ts"
import { downloadMediaToMemory, convertOfficeToPdf } from "./weixin/download.ts"
import { generateTaskId } from "./weixin/message.ts"
import {
  findPrintTaskWithPrinter,
  findPrinterWithComputer,
  insertPrintFile,
  insertPrintTask,
  listPrintersByWeixinKfUser,
  listWaitingConfirmationTasks,
} from "../models/db.ts"
import { sendMsgMenuMessage } from "./weixin/send.ts"
import { addTokenToUrl } from "./utils.ts"
import { logger } from "../logger.ts";

const ASSETS_DIR = join(import.meta.dirname, "..", "assets")
const TEMPLATE_PATH = join(ASSETS_DIR, "文件处理.docx")
const WEIXIN_KF_ID = 'wkHnU4FQAAIMj9uECzdKwOI_kRP_IGDQ'

export const generateDocx = (data: RecognizedDocument): Buffer => {
  const templateBuffer = readFileSync(TEMPLATE_PATH)
  const zip = UZIP.parse(templateBuffer.buffer as ArrayBuffer) as Record<string, Uint8Array>

  const docXmlKey = 'word/document.xml'
  const docXmlData = zip[docXmlKey]
  if (!docXmlData) throw new Error('无法找到 document.xml')

  let xmlContent = Buffer.from(docXmlData).toString('utf8')

  const now = new Date()
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

  const replacements: [string, string][] = [
    ['{{文号}}', data.document_number || '未识别'],
    ['{{发文单位}}', data.issuing_unit || '未识别'],
    ['{{标题}}', data.title || '未识别'],
    ['{{当天日期}}', dateStr]
  ]

  for (const [placeholder, value] of replacements) {
    xmlContent = xmlContent.split(placeholder).join(value)
  }

  const newZip: Record<string, Uint8Array> = {}
  for (const [key, value] of Object.entries(zip)) {
    if (key === docXmlKey) {
      newZip[key] = new TextEncoder().encode(xmlContent)
    } else {
      newZip[key] = new Uint8Array(value)
    }
  }

  const resultBuffer = UZIP.encode(newZip)
  return Buffer.from(resultBuffer)
}

export type ProcessDocumentResult = {
  recognized: RecognizedDocument
  printTaskId?: number
  printFileId?: number
  fileId: string
  pdfPath: string
}

export const processDocumentSimple = async (
  mediaId: string
): Promise<ProcessDocumentResult> => {
  const media = await downloadMediaToMemory(mediaId)
  logger.log(`文件下载完成: ${media.filename}`)

  const dataUrl = imageBufferToDataUrl(media.buffer, media.ext)
  logger.log('开始识别公文...')
  const recognized = await recognizeDocument(dataUrl)
  logger.log('识别结果:', recognized)

  logger.log('生成 docx（内存）...')
  const docxBuffer = generateDocx(recognized)

  const pdfPath = await convertOfficeToPdf({ buffer: docxBuffer, filename: `${media.fileId}.docx` })
  if (!pdfPath) {
    throw new Error('PDF 生成失败')
  }
  logger.log(`PDF 预览文件已生成: ${pdfPath}`)

  return {
    recognized,
    fileId: media.fileId,
    pdfPath
  }
}

export const processDocument = async (
  mediaId: string,
  kfid: string,
  externalUserId: string,
): Promise<ProcessDocumentResult> => {
  const media = await downloadMediaToMemory(mediaId)
  logger.log(`文件下载完成: ${media.filename}`)

  const dataUrl = imageBufferToDataUrl(media.buffer, media.ext)
  logger.log('开始识别公文...')
  const recognized = await recognizeDocument(dataUrl)
  logger.log('识别结果:', recognized)

  logger.log('生成 docx（内存）...')
  const docxBuffer = generateDocx(recognized)

  // 转换 docx 为 PDF 供前端预览（docx 直传 WPS，不落盘）
  const pdfPath = await convertOfficeToPdf({ buffer: docxBuffer, filename: `${media.fileId}.docx` })
  if (pdfPath) {
    logger.log(`PDF 预览文件已生成: ${pdfPath}`)
  } else {
    logger.warn('PDF 预览文件生成失败')
  }

  const existingTask = listWaitingConfirmationTasks(externalUserId, kfid)[0]
  let printTaskId: number

  if (existingTask) {
    printTaskId = existingTask.id
  } else {
    printTaskId = generateTaskId()
    const printers = listPrintersByWeixinKfUser(externalUserId, kfid)
    const printer = printers.find(p => p.enabled)
    if (!printer) {
      throw new Error('请先绑定打印机')
    }
    insertPrintTask({ id: printTaskId, state: "waiting_confirmation", externalUserId, weixinKfId: kfid, printerId: printer.id })
  }

  const printFileId = insertPrintFile({
    state: "waiting_print",
    printTaskId,
    fileId: media.fileId,
    filename: `公文_${recognized.title || '未识别'}.docx`,
    duplex: true,
    tumble: false
  })

  try {
    const task = findPrintTaskWithPrinter(printTaskId)
    if (task?.printer) {
      const printer = findPrinterWithComputer(task.printer.id)
      const printTaskUrl = await addTokenToUrl(`https://superprint.xna00.top/printTask?id=${printTaskId}`, externalUserId)
      await sendMsgMenuMessage(
        `📄 公文处理完成\n\n文号: ${recognized.document_number}\n单位: ${recognized.issuing_unit}\n标题: ${recognized.title}\n\n计算机: ${printer?.computer?.name}\n打印机: ${printer?.name}`,
        [
          { id: `confirm_${printTaskId}`, content: "确认打印" },
          { id: `delete_${printTaskId}`, content: "删除任务" },
          { content: "查看详情", url: printTaskUrl }
        ],
        WEIXIN_KF_ID,
        externalUserId
      )
    }
  } catch (error) {
    logger.error("发送微信通知失败:", error)
  }

  return {
    recognized,
    printTaskId,
    printFileId,
    fileId: media.fileId,
    pdfPath: pdfPath || ''
  }
}