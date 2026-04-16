import { writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join, extname } from "node:path"
import { createHash } from "node:crypto"
import { execSync } from "node:child_process"
import { getAccessToken } from './token.ts'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const ensureUploadsDir = (): void => {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

const convertPdfToPs = (pdfPath: string, duplex: boolean = true, tumble: boolean = false): void => {
  const psPath = pdfPath.replace(/\.pdf$/i, '.ps')
  try {
    let cmd = `gs -q -dSAFER -dBATCH -dNOPAUSE -sDEVICE=ps2write -r300 -sOutputFile="${psPath}" -sPAPERSIZE=a4 -dFIXEDMEDIA -dPDFFitPage`

    if (duplex) {
      const duplexSetting = tumble ? 'Duplex true /Tumble true' : 'Duplex true'
      cmd += ` -c '<</PSDocOptions (<</${duplexSetting}>> setpagedevice)>> setdistillerparams'`
    }

    cmd += ` -f "${pdfPath}"`

    execSync(cmd, { stdio: 'ignore', shell: true } as any)
  } catch (error) {
    console.error('PDF转PS失败:', error)
  }
}

const isOfficeFile = (ext: string): boolean => {
  const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
  return officeExts.includes(ext.toLowerCase())
}

const isPresentationFile = (ext: string): boolean => {
  const presentationExts = ['.ppt', '.pptx']
  return presentationExts.includes(ext.toLowerCase())
}

const convertOfficeToPdf = (filePath: string): string | null => {
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
    convertPdfToPs(filePath, duplex, tumble)
  } else if (isOfficeFile(extLower)) {
    const pdfPath = convertOfficeToPdf(filePath)
    if (pdfPath) {
      const tumbleForPresentation = isPresentationFile(extLower)
      convertPdfToPs(pdfPath, duplex, tumbleForPresentation)
    }
  }

  return { fileId: hash, filename }
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

export const reconvertPdfToPs = (fileId: string, duplex: boolean, tumble: boolean): boolean => {
  const filePath = getFilePath(fileId)
  if (!filePath || !filePath.toLowerCase().endsWith('.pdf')) {
    return false
  }
  convertPdfToPs(filePath, duplex, tumble)
  return true
}

export const getUploadsDir = (): string => {
  return UPLOADS_DIR
}
