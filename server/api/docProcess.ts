import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join, extname } from "node:path"
import UZIP from "uzip"
import { recognizeDocument, type RecognizedDocument } from "./ai.ts"
import { downloadMedia, convertOfficeToPdf } from "./weixin/download.ts"
import { generateTaskId } from "./weixin/message.ts"
import { PrintTask, PrintFile, Computer, Printer, WeixinKfUser } from "../models/index.ts"
import { sendMsgMenuMessage } from "./weixin/send.ts"
import { addTokenToUrl } from "./utils.ts"

const ASSETS_DIR = join(import.meta.dirname, "..", "assets")
const UPLOADS_DIR = join(process.cwd(), 'uploads')
const TEMPLATE_PATH = join(ASSETS_DIR, "文件处理.docx")
const WEIXIN_KF_ID = 'wkHnU4FQAAIMj9uECzdKwOI_kRP_IGDQ'

const ensureUploadsDir = (): void => {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

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
  printTaskId: number
  printFileId: number
  fileId: string
}

export const processDocument = async (
  mediaId: string,
  kfid: string,
  externalUserId: string,
  userId: number,
  username: string
): Promise<ProcessDocumentResult> => {
  ensureUploadsDir()

  const downloadResult = await downloadMedia(mediaId, true, false)
  console.log(`文件下载完成: ${downloadResult.filename}`)

  const ext = extname(downloadResult.filename).toLowerCase()
  const filePath = join(UPLOADS_DIR, downloadResult.fileId + ext)
  const fileUrl = `file://${filePath}`

  console.log('开始识别公文...')
  const recognized = await recognizeDocument(fileUrl)
  console.log('识别结果:', recognized)

  console.log('生成 docx 文件...')
  const docxBuffer = generateDocx(recognized)
  const docxFileId = downloadResult.fileId + '_docx'
  const docxPath = join(UPLOADS_DIR, docxFileId + '.docx')
  writeFileSync(docxPath, docxBuffer)
  console.log(`docx 文件已保存: ${docxPath}`)

  // 转换 docx 为 PDF 供前端预览
  const pdfPath = convertOfficeToPdf(docxPath)
  if (pdfPath) {
    console.log(`PDF 预览文件已生成: ${pdfPath}`)
  } else {
    console.warn('PDF 预览文件生成失败')
  }

  const existingTask = PrintTask.findOne({ userId, weixinKfId: kfid, state: "waiting_confirmation" })
  let printTaskId: number

  if (existingTask) {
    printTaskId = existingTask.id
  } else {
    printTaskId = generateTaskId()
    const computers = Computer.findBy({ userId }, { printers: true })
    const printer = computers[0]?.printers?.find((p: any) => !p.disabled)
    if (!printer) {
      throw new Error('未绑定打印机')
    }
    PrintTask.insert([{ id: printTaskId, state: "waiting_confirmation", userId, weixinKfId: kfid, printerId: printer.id }])
  }

  const printFileResult = PrintFile.insert([{
    state: "waiting_print",
    printTaskId,
    fileId: docxFileId,
    filename: `公文_${recognized.title || '未识别'}.docx`,
    duplex: true,
    tumble: false
  }])

  try {
    const task = PrintTask.findOne({ id: printTaskId }, { printer: true })
    const kfUser = WeixinKfUser.findOne({ userId })
    if (task?.printer && kfUser) {
      const printer = Printer.findOne({ id: (task.printer as any).id }, { computer: true })
      const printTaskUrl = await addTokenToUrl(`https://superprint.xna00.top/printTask?id=${printTaskId}`, userId)
      await sendMsgMenuMessage(
        `📄 公文处理完成\n\n文号: ${recognized.document_number}\n单位: ${recognized.issuing_unit}\n标题: ${recognized.title}\n\n计算机: ${(printer as any)?.computer?.name}\n打印机: ${(printer as any)?.name}`,
        [
          { id: `confirm_${printTaskId}`, content: "确认打印" },
          { id: `delete_${printTaskId}`, content: "删除任务" },
          { content: "查看详情", url: printTaskUrl }
        ],
        WEIXIN_KF_ID,
        kfUser.externalUserId
      )
    }
  } catch (error) {
    console.error("发送微信通知失败:", error)
  }

  return {
    recognized,
    printTaskId,
    printFileId: printFileResult.lastInsertRowid as number,
    fileId: docxFileId
  }
}
