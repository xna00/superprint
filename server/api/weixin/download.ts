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

export const convertWithWpsApi = async (filePath: string, outputPath: string): Promise<boolean> => {
  const fileBuffer = readFileSync(filePath)
  const fileName = basename(filePath)

  for (const baseUrl of WPS2PDF_URLS) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
          logger.error(`WPS转PDF返回空内容 [${baseUrl}] 第 ${attempt}/${MAX_ATTEMPTS} 次`)
        } else {
          let detail = `HTTP ${response.status}`
          try {
            const data = await response.json() as { detail?: string }
            if (data.detail) detail = data.detail
          } catch {
            // 忽略响应解析失败
          }
          logger.error(`WPS转PDF失败 [${baseUrl}] 第 ${attempt}/${MAX_ATTEMPTS} 次:`, detail)
          // 4xx 是格式不支持/文件过大等客户端错误，对同一地址重试无意义 → 直接换下一个地址
          if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
            break
          }
        }
      } catch (error) {
        logger.error(`WPS转PDF请求失败 [${baseUrl}] 第 ${attempt}/${MAX_ATTEMPTS} 次:`, error)
      } finally {
        clearTimeout(timer)
      }

      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAYS[attempt - 1] ?? 2000)
    }
  }

  return false
}

export const convertOfficeToPdf = async (filePath: string): Promise<string | null> => {
  const ext = extname(filePath)
  if (!isOfficeFile(ext)) return null

  const absolutePath = filePath.startsWith('/') ? filePath : join(process.cwd(), filePath)
  const pdfPath = filePath.replace(/\.[^.]+$/, '.pdf')

  if (await convertWithWpsApi(absolutePath, pdfPath)) {
    logger.log('WPS: PDF 转换完成', pdfPath)
    return pdfPath
  }

  logger.error('Office转PDF失败（无回退）:', absolutePath)
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
}

export const downloadMedia = async (
  mediaId: string,
  duplex: boolean = true,
  tumble: boolean = false
): Promise<DownloadResult> => {
  ensureUploadsDir()

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
  const fileHash = hash + ext

  const filePath = join(UPLOADS_DIR, fileHash)

  writeFileSync(filePath, buffer)

  const extLower = ext.toLowerCase()
  if (isOfficeFile(extLower)) {
    const pdfPath = await convertOfficeToPdf(filePath)
    if (pdfPath) {
      return { fileId: hash, filename: filename.replace(/\.[^.]+$/, '.pdf'), converted: true }
    }
  } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(extLower)) {
    const pdfPath = await convertImageToPdf(filePath)
    return { fileId: hash, filename: filename.replace(/\.[^.]+$/, '.pdf'), converted: true }
  }

  return { fileId: hash, filename, converted: false }
}

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
