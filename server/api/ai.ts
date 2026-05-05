import { execSync } from "node:child_process"
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"
import { GLM_API_KEY } from "./constants.local.ts"
import { jsonrepair } from "jsonrepair"
import { logger } from "../logger.ts";

const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
const MODEL_NAME = 'glm-4v-flash'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

export type RecognizedDocument = {
  document_number: string
  issuing_unit: string
  title: string
}

export const pdfToImage = (pdfPath: string): string | null => {
  const hash = createHash('sha256').update(pdfPath + Date.now().toString()).digest('hex').slice(0, 16)
  const outputPrefix = join(UPLOADS_DIR, `temp_${hash}`)
  const outputPath = `${outputPrefix}.jpg`

  try {
    execSync(`pdftoppm -jpeg -singlefile -r 200 "${pdfPath}" "${outputPrefix}"`, { stdio: 'ignore' })
    if (existsSync(outputPath)) {
      return outputPath
    }
    return null
  } catch (error) {
    logger.error('PDF转图片失败:', error)
    return null
  }
}

export const recognizeDocument = async (fileUrl: string): Promise<RecognizedDocument> => {
  let imageUrl = fileUrl

  // 处理本地文件 (file:// URL)
  if (fileUrl.startsWith('file://')) {
    const localPath = fileUrl.replace('file://', '')
    const ext = localPath.split('.').pop()?.toLowerCase() || ''
    const isPdf = ext === 'pdf'

    if (isPdf) {
      const imagePath = pdfToImage(localPath)
      if (imagePath) {
        const imageBuffer = readFileSync(imagePath)
        const base64Image = imageBuffer.toString('base64')
        imageUrl = `data:image/jpeg;base64,${base64Image}`
        try { unlinkSync(imagePath) } catch {}
      } else {
        throw new Error('PDF转图片失败')
      }
    } else {
      // 图片文件，直接转 base64
      const imageBuffer = readFileSync(localPath)
      const base64Image = imageBuffer.toString('base64')
      imageUrl = `data:image/jpeg;base64,${base64Image}`
    }
    return recognizeFromImageUrl(imageUrl)
  }

  // 远程 URL，先检测类型
  let isPdf = false
  try {
    const resp = await fetch(fileUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    const contentType = resp.headers.get('content-type') || ''
    isPdf = contentType.toLowerCase().includes('pdf')
  } catch {
    try {
      const resp = await fetch(fileUrl, { signal: AbortSignal.timeout(5000) })
      const contentType = resp.headers.get('content-type') || ''
      isPdf = contentType.toLowerCase().includes('pdf')
    } catch {
      // 无法判断，假设不是 PDF
    }
  }

  if (isPdf) {
    const resp = await fetch(fileUrl)
    const pdfBuffer = Buffer.from(await resp.arrayBuffer())
    const tempPdfPath = join(UPLOADS_DIR, `temp_${Date.now()}.pdf`)
    writeFileSync(tempPdfPath, pdfBuffer)
    const imagePath = pdfToImage(tempPdfPath)
    try { unlinkSync(tempPdfPath) } catch {}
    if (imagePath) {
      const imageBuffer = readFileSync(imagePath)
      const base64Image = imageBuffer.toString('base64')
      imageUrl = `data:image/jpeg;base64,${base64Image}`
      try { unlinkSync(imagePath) } catch {}
    }
  }

  return recognizeFromImageUrl(imageUrl)
}

const recognizeFromImageUrl = async (imageUrl: string): Promise<RecognizedDocument> => {
  const systemPrompt = `你是一个公文识别专家。请仔细识别图片或PDF中的公文信息，提取以下字段：
- document_number: 公文文号（如：科发〔2024〕1号）
- issuing_unit: 发文单位（如：XX市科技局）
- title: 公文标题

重要提示：文号中的年份必须使用中文方括号〔〕，禁止使用英文方括号[]。例如：〔2024〕是正确的，[2024]是错误的。

请以JSON格式返回，格式如下：
{"document_number": "xxx", "issuing_unit": "xxx", "title": "xxx"}

只返回JSON，不要有其他内容。`

  const payload = {
    model: MODEL_NAME,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: '请识别这个公文（图片或PDF），提取文号、发文单位和标题。' }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 1024
  }

  const apiUrl = `${ZHIPU_BASE_URL}/chat/completions`
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GLM_API_KEY}`
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GLM API 错误 ${response.status}: ${error}`)
  }

  const result = await response.json() as any
  const content = result.choices?.[0]?.message?.content || ''

  // 解析 JSON 响应
  try {
    const repaired = jsonrepair(content)
    const parsed = JSON.parse(repaired)
    return {
      document_number: parsed.document_number || '',
      issuing_unit: parsed.issuing_unit || '',
      title: parsed.title || ''
    }
  } catch {
    throw new Error(`无法解析识别结果: ${content}`)
  }
}
