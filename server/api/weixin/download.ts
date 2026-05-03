import { writeFileSync, readFileSync, existsSync, mkdirSync, createWriteStream, appendFileSync } from "node:fs"
import { join, extname } from "node:path"
import { createHash } from "node:crypto"
import { execSync } from "node:child_process"
import { getAccessToken } from './token.ts'
import PDFDocument from "pdfkit"

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const ensureUploadsDir = (): void => {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

const embedPrintTicket = (xpsPath: string, duplex: boolean, tumble: boolean): void => {
  let duplexOption = 'OneSided'
  if (duplex) {
    duplexOption = tumble ? 'TwoSidedShortEdge' : 'TwoSidedLongEdge'
  }
  
  const printTicket = `<?xml version="1.0" encoding="UTF-8"?>
<psf:PrintTicket xmlns:psf="http://schemas.microsoft.com/windows/2003/08/printing/printschemaframework"
                 xmlns:psk="http://schemas.microsoft.com/windows/2003/08/printing/printschemakeywords">
  <psf:Feature name="psk:JobDuplexAllDocumentsContiguously">
    <psf:Option name="psk:${duplexOption}"/>
  </psf:Feature>
</psf:PrintTicket>`
  
  try {
    const xpsData = readFileSync(xpsPath)
    const zip = UZIP.parse(xpsData)
    
    zip['Job_PT.xml'] = Buffer.from(printTicket, 'utf-8')
    
    let contentTypes = zip['[Content_Types].xml'].toString('utf-8')
    if (!contentTypes.includes('Job_PT.xml')) {
      contentTypes = contentTypes.replace(
        '</Types>',
        '  <Override PartName="/Job_PT.xml" ContentType="application/vnd.ms-printing.printticket+xml"/>\n</Types>'
      )
      zip['[Content_Types].xml'] = Buffer.from(contentTypes, 'utf-8')
    }
    
    const newXpsData = UZIP.encode(zip)
    writeFileSync(xpsPath, newXpsData)
  } catch (error) {
    console.error('嵌入PrintTicket失败:', error)
  }
}

export const convertPdfToXps = (pdfPath: string, duplex: boolean = true, tumble: boolean = false): void => {
  const xpsPath = pdfPath.replace(/\.pdf$/i, '.xps')
  try {
    const cmd = `gs -q -sDEVICE=xpswrite -dNOPAUSE -dBATCH -sOutputFile="${xpsPath}" "${pdfPath}"`
    execSync(cmd, { stdio: 'ignore', shell: true } as any)
    embedPrintTicket(xpsPath, duplex, tumble)
  } catch (error) {
    console.error('PDF转XPS失败:', error)
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
      console.log('PDFKit: PDF 生成完成', pdfPath)
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
  const xpsPath = imagePath.replace(/\.(jpg|jpeg|png|gif)$/i, '.xps')

  try {
    const pdfPath = await convertImageToPdf(imagePath)

    const cmd = `gs -q -sDEVICE=xpswrite -dNOPAUSE -dBATCH -sOutputFile="${xpsPath}" "${pdfPath}"`
    execSync(cmd, { stdio: 'ignore', shell: true } as any)
  } catch (error) {
    console.error('PDFKit 转PDF失败:', error)
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
    console.error('Office转PDF失败:', error)
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
  const exts = ['.pdf', '.xps', '.ps', '.jpg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
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