import { writeFileSync, readFileSync, existsSync, mkdirSync, createWriteStream, appendFileSync, readdirSync, unlinkSync, statSync, rmSync } from "node:fs"
import { join, extname } from "node:path"
import { createHash } from "node:crypto"
import { execSync } from "node:child_process"
import { getAccessToken } from './token.ts'
import PDFDocument from "pdfkit"
import UZIP from "uzip"
import { logger } from "../../logger.ts";

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const ensureUploadsDir = (): void => {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

const renderPdfToJpegs = (pdfPath: string, dpi: number = 300): string[] => {
  const tempDir = join(UPLOADS_DIR, `_xps_tmp_${Date.now()}`)
  mkdirSync(tempDir, { recursive: true })
  
  const a4PdfPath = join(tempDir, 'a4.pdf')
  const cmd1 = `pdftocairo -pdf -paper A4 -expand "${pdfPath}" "${a4PdfPath}"`
  execSync(cmd1, { stdio: 'ignore', shell: true } as any)
  
  const prefix = join(tempDir, 'page')
  const cmd2 = `pdftocairo -jpeg -r ${dpi} -jpegopt quality=85 "${a4PdfPath}" "${prefix}"`
  execSync(cmd2, { stdio: 'ignore', shell: true } as any)
  
  const files = readdirSync(tempDir)
    .filter(f => f.endsWith('.jpg'))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0')
      const nb = parseInt(b.match(/\d+/)?.[0] || '0')
      return na - nb
    })
    .map(f => join(tempDir, f))
  
  return files
}

const packageJpegsToZip = (jpegPaths: string[], outputPath: string): void => {
  const zip: Record<string, Uint8Array> = {}
  
  for (let i = 0; i < jpegPaths.length; i++) {
    const jpegData = readFileSync(jpegPaths[i])
    zip[`page-${i + 1}.jpg`] = jpegData
  }
  
  const zipData = UZIP.encode(zip)
  writeFileSync(outputPath, Buffer.from(zipData))
}

export const convertPdfToXps = (pdfPath: string, duplex: boolean = true, tumble: boolean = false): void => {
  const zipPath = pdfPath.replace(/\.pdf$/i, '.zip')
  try {
    const jpegPaths = renderPdfToJpegs(pdfPath, 300)
    if (jpegPaths.length === 0) {
      logger.error('PDF渲染JPEG失败：未生成任何图片')
      return
    }
    packageJpegsToZip(jpegPaths, zipPath)
    
    try {
      const tempDirs = readdirSync(UPLOADS_DIR).filter(d => d.startsWith('_xps_tmp_'))
      for (const dir of tempDirs) {
        rmSync(join(UPLOADS_DIR, dir), { recursive: true, force: true })
      }
    } catch (cleanupError) {
      logger.error('清理临时目录失败:', cleanupError)
    }
  } catch (error) {
    logger.error('PDF转ZIP失败:', error)
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

const convertImageToXps = async (imagePath: string, duplex: boolean = true, tumble: boolean = false): Promise<void> => {
  try {
    const pdfPath = await convertImageToPdf(imagePath)
    if (pdfPath) {
      convertPdfToXps(pdfPath, duplex, tumble)
    }
  } catch (error) {
    logger.error('图片转PDF失败:', error)
  }
}

export const isOfficeFile = (ext: string): boolean => {
  const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
  return officeExts.includes(ext.toLowerCase())
}

export const isPresentationFile = (ext: string): boolean => {
  const presentationExts = ['.ppt', '.pptx']
  return presentationExts.includes(ext.toLowerCase())
}

export const convertOfficeToPdf = (filePath: string): string | null => {
  const ext = extname(filePath)
  if (!isOfficeFile(ext)) return null

  const outputDir = join(UPLOADS_DIR)
  const absolutePath = filePath.startsWith('/') ? filePath : join(process.cwd(), filePath)

  try {
    const cmd = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${absolutePath}"`
    execSync(cmd, { stdio: 'ignore', shell: true } as any)

    const pdfPath = filePath.replace(/\.[^.]+$/, '.pdf')
    if (existsSync(pdfPath)) {
      return pdfPath
    }
    return null
  } catch (error) {
    logger.error('Office转PDF失败:', error)
    return null
  }
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

  if (extLower === '.pdf') {
    convertPdfToXps(filePath, duplex, tumble)
  } else if (isOfficeFile(extLower)) {
    const pdfPath = convertOfficeToPdf(filePath)
    if (pdfPath) {
      const tumbleForPresentation = isPresentationFile(extLower)
      convertPdfToXps(pdfPath, duplex, tumbleForPresentation)
    }
  } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(extLower)) {
    await convertImageToXps(filePath, duplex, tumble)
  }

  return { fileId: hash, filename }
}

export const getFilePath = (fileId: string): string | null => {
  const exts = ['.pdf', '.zip', '.ps', '.jpg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
  for (const ext of exts) {
    const filePath = join(UPLOADS_DIR, fileId + ext)
    if (existsSync(filePath)) {
      return filePath
    }
  }
  return null
}

export const reconvertPdfToXps = (fileId: string, duplex: boolean, tumble: boolean): boolean => {
  const filePath = getFilePath(fileId)
  if (!filePath || !filePath.toLowerCase().endsWith('.pdf')) {
    return false
  }
  convertPdfToXps(filePath, duplex, tumble)
  return true
}

export const getUploadsDir = (): string => {
  return UPLOADS_DIR
}
