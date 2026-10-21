import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs"
import { join, extname, basename } from "node:path"
import { createHash } from "node:crypto"
import { getAccessToken } from './token.ts'
import PDFDocument from "pdfkit"
import { logger } from "../../logger.ts";
import { WPS2PDF_URLS } from "../constants.ts"

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const ensureUploadsDir = (): void => {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

export const convertImageToPdf = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pdfPath = imagePath.replace(/\.(jpg|jpeg|png|gif)$/i, '.pdf')

    const doc = new PDFDocument({ autoFirstPage: false })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      writeFileSync(pdfPath, pdfBuffer)
      logger.log('PDFKit: PDF 生成完成', pdfPath)
      resolve(pdfPath)
    })
    doc.on('error', reject)

    const imgBuffer = readFileSync(imagePath)

    // @ts-ignore - openImage 不在类型定义中但运行时可用
    const img = doc.openImage(imgBuffer)
    const isLandscape = img.width > img.height

    const pageWidth = isLandscape ? 841.89 : 595.28
    const pageHeight = isLandscape ? 595.28 : 841.89

    doc.addPage({ size: [pageWidth, pageHeight], margin: 0 })

    const scale = Math.min(pageWidth / img.width, pageHeight / img.height)
    const imgWidth = img.width * scale
    const imgHeight = img.height * scale
    const x = (pageWidth - imgWidth) / 2
    const y = (pageHeight - imgHeight) / 2

    doc.image(imgBuffer, x, y, {
      width: imgWidth,
      height: imgHeight
    })

    doc.end()
  })
}

export const isOfficeFile = (ext: string): boolean => {
  const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
  return officeExts.includes(ext.toLowerCase())
}

export const isPresentationFile = (ext: string): boolean => {
  const presentationExts = ['.ppt', '.pptx']
  return presentationExts.includes(ext.toLowerCase())
}

const MAX_ATTEMPTS = 3 // 每个地址的重试次数
const RETRY_DELAYS = [1000, 2000] // 每次重试前的退避(ms)
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

type WpsInput = string | { buffer: Buffer; filename: string }

const resolveWpsInput = (input: WpsInput): { buffer: Buffer; filename: string } =>
  typeof input === 'string'
    ? { buffer: readFileSync(input), filename: basename(input) }
    : input

export const convertWithWpsApi = async (
  input: WpsInput,
  outputPath: string,
  attempts: number = MAX_ATTEMPTS,
  delays: number[] = RETRY_DELAYS,
): Promise<boolean> => {
  const { buffer: fileBuffer, filename: fileName } = resolveWpsInput(input)

  for (const baseUrl of WPS2PDF_URLS) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      // FormData 的 body 只能读一次，每次尝试都要重建
      const form = new FormData()
      form.append('file', new Blob([fileBuffer]), fileName)

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch(`${baseUrl}/convert`, {
          method: 'POST',
          body: form,
          signal: controller.signal
        })

        if (response.ok) {
          const pdfBuffer = Buffer.from(await response.arrayBuffer())
          if (pdfBuffer.length > 0) {
            writeFileSync(outputPath, pdfBuffer)
            return true
          }
          logger.error(`WPS转PDF返回空内容 [${baseUrl}] 第 ${attempt}/${attempts} 次`)
        } else {
          let detail = `HTTP ${response.status}`
          try {
            const data = await response.json() as { detail?: string }
            if (data.detail) detail = data.detail
          } catch {
            // 忽略响应解析失败
          }
          logger.error(`WPS转PDF失败 [${baseUrl}] 第 ${attempt}/${attempts} 次:`, detail)
          // 4xx 是格式不支持/文件过大等客户端错误，对同一地址重试无意义 → 直接换下一个地址
          if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
            break
          }
        }
      } catch (error) {
        logger.error(`WPS转PDF请求失败 [${baseUrl}] 第 ${attempt}/${attempts} 次:`, error)
      } finally {
        clearTimeout(timer)
      }

      if (attempt < attempts) await sleep(delays[attempt - 1] ?? 2000)
    }
  }

  return false
}

export const convertOfficeToPdf = async (input: WpsInput): Promise<string | null> => {
  const filename = typeof input === 'string' ? basename(input) : input.filename
  const ext = extname(filename)
  if (!isOfficeFile(ext)) return null

  ensureUploadsDir()
  const pdfPath = join(UPLOADS_DIR, filename.replace(/\.[^.]+$/, '.pdf'))

  if (await convertWithWpsApi(input, pdfPath)) {
    logger.log('WPS: PDF 转换完成', pdfPath)
    return pdfPath
  }

  logger.error('Office转PDF失败（无回退）:', pdfPath)
  return null
}

const getFilenameFromResponse = (response: Response, mediaId: string): string => {
  const contentDisposition = response.headers.get('content-disposition')
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*?[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      let filename = filenameMatch[1].replace(/['"]/g, '')
      filename = filename.replace(/^utf-8['"]*/i, '')
      return decodeURIComponent(filename)
    }
  }

  const contentType = response.headers.get('content-type')
  const ext = getExtensionFromContentType(contentType)
  return `${mediaId}${ext}`
}

const getExtensionFromContentType = (contentType: string | null): string => {
  if (!contentType) return ''

  const typeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'audio/amr': '.amr',
    'video/mp4': '.mp4',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  }

  for (const [type, ext] of Object.entries(typeMap)) {
    if (contentType.includes(type)) {
      return ext
    }
  }

  return ''
}

export type DownloadResult = {
  fileId: string
  filename: string
  converted: boolean
  /** 下载后落盘的原文件路径（图片/Office 转换前，用于识别时直接读取原图） */
  originalPath: string
}

type FetchedMedia = {
  /** 内容 sha256 前 16 位，落盘文件名与 fileId 都用它 */
  fileId: string
  filename: string
  ext: string
  buffer: Buffer
}

// downloadMedia / downloadMediaToMemory 共用的下载核心：取 token → fetch →
// 校验 HTTP 与微信 JSON 错误体 → 按 content-disposition/content-type 定文件名 →
// 算内容 hash。两者只差「落盘 + 转换」vs「纯内存」，其余完全相同。
const fetchMedia = async (mediaId: string): Promise<FetchedMedia> => {
  const accessToken = await getAccessToken()
  const url = `https://qyapi.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`下载文件失败: HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    const errorData = await response.json() as { errcode?: number; errmsg?: string }
    if (errorData.errcode && errorData.errcode !== 0) {
      throw new Error(`下载文件失败: ${errorData.errmsg} (errcode: ${errorData.errcode})`)
    }
  }

  const filename = getFilenameFromResponse(response, mediaId)

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16)
  const ext = extname(filename)

  return { fileId: hash, filename, ext, buffer }
}

const downloadMediaUncached = async (
  mediaId: string,
  duplex: boolean = true,
  tumble: boolean = false
): Promise<DownloadResult> => {
  ensureUploadsDir()

  const { fileId, filename, ext, buffer } = await fetchMedia(mediaId)
  const filePath = join(UPLOADS_DIR, fileId + ext)

  writeFileSync(filePath, buffer)

  const extLower = ext.toLowerCase()
  if (isOfficeFile(extLower)) {
    const pdfPath = await convertOfficeToPdf(filePath)
    if (pdfPath) {
      return { fileId, filename: filename.replace(/\.[^.]+$/, '.pdf'), converted: true, originalPath: filePath }
    }
  } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(extLower)) {
    const pdfPath = await convertImageToPdf(filePath)
    return { fileId, filename: filename.replace(/\.[^.]+$/, '.pdf'), converted: true, originalPath: filePath }
  }

  return { fileId, filename, converted: false, originalPath: filePath }
}

// 同一 mediaId 的并发下载去重：message.ts 用 Promise.all 并发处理一批媒体消息，
// 同一 media_id（转发、回调重投）会同时触发多次下载——重复请求微信接口、
// 并发写同一个内容寻址文件、重复跑 PDF 转换。这里按 mediaId 合并在途请求，
// 后到者直接复用前者的 Promise；失败即移除（不缓存失败），后续调用可重新发起。
// duplex/tumble 在本函数体里未使用，去重键只需 mediaId。
const inflightDownloads = new Map<string, Promise<DownloadResult>>()

export const downloadMedia = async (
  mediaId: string,
  duplex: boolean = true,
  tumble: boolean = false
): Promise<DownloadResult> => {
  const inflight = inflightDownloads.get(mediaId)
  if (inflight) return inflight

  const download = downloadMediaUncached(mediaId, duplex, tumble)
  inflightDownloads.set(mediaId, download)
  try {
    return await download
  } finally {
    // 只删自己这一条：若期间已有更新的在途请求占位，不能误删
    if (inflightDownloads.get(mediaId) === download) {
      inflightDownloads.delete(mediaId)
    }
  }
}

// 与 downloadMedia 等价，但只返回内存字节、不落盘。
// 供 docProcess 使用：原文件仅用于 AI 识别，识别完即弃，无需写入 uploads/。
export const downloadMediaToMemory = async (
  mediaId: string,
): Promise<{ fileId: string; buffer: Buffer; ext: string; filename: string }> =>
  fetchMedia(mediaId)

export const getFilePath = (fileId: string): string | null => {
  const exts = ['.pdf', '.ps', '.jpg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
  for (const ext of exts) {
    const filePath = join(UPLOADS_DIR, fileId + ext)
    if (existsSync(filePath)) {
      return filePath
    }
  }
  return null
}

export const getUploadsDir = (): string => {
  return UPLOADS_DIR
}
