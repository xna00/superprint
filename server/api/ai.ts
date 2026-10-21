import { readFileSync } from "node:fs"
import { extname } from "node:path"
import { GLM_API_KEY } from "./constants.local.ts"
import { jsonrepair } from "jsonrepair"

const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
const MODEL_NAME = 'glm-4v-flash'

const IMAGE_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
}

type GLMChoice = { message?: { content?: string } };
type GLMResponse = { choices?: GLMChoice[] };

export type RecognizedDocument = {
  document_number: string
  issuing_unit: string
  title: string
}

// 图片直接转 base64 交给大模型，不做 PDF 中转
const toImageDataUrl = (filePath: string): string => {
  const ext = extname(filePath).toLowerCase()
  const mime = IMAGE_MIME_TYPES[ext]
  if (!mime) {
    throw new Error(`目前只支持发送图片，请拍照或截图后发送（收到 ${ext || '未知格式'}）`)
  }
  return `data:${mime};base64,${readFileSync(filePath).toString('base64')}`
}

// 与 toImageDataUrl 等价，但接受内存 Buffer，避免「先落盘再读回」的往返
export const imageBufferToDataUrl = (buffer: Buffer, ext: string): string => {
  const mime = IMAGE_MIME_TYPES[ext.toLowerCase()]
  if (!mime) {
    throw new Error(`目前只支持发送图片，请拍照或截图后发送（收到 ${ext || '未知格式'}）`)
  }
  return `data:${mime};base64,${buffer.toString('base64')}`
}

const mimeFromContentType = (contentType: string): string | null => {
  const ct = contentType.toLowerCase()
  return Object.values(IMAGE_MIME_TYPES).find(mime => ct.startsWith(mime)) ?? null
}

export const recognizeDocument = async (fileUrl: string): Promise<RecognizedDocument> => {
  // 内存中的 data URL（如 docProcess 直接由字节生成，无需落盘）
  if (fileUrl.startsWith('data:')) {
    return recognizeFromImageUrl(fileUrl)
  }

  // 本地文件 (file:// URL)
  if (fileUrl.startsWith('file://')) {
    return recognizeFromImageUrl(toImageDataUrl(fileUrl.replace('file://', '')))
  }

  // 远程 URL：只接受图片
  const resp = await fetch(fileUrl, { signal: AbortSignal.timeout(15000) })
  if (!resp.ok) {
    throw new Error(`下载待识别文件失败: HTTP ${resp.status}`)
  }
  const mime = mimeFromContentType(resp.headers.get('content-type') || '')
  if (!mime) {
    throw new Error(`目前只支持发送图片，请拍照或截图后发送（收到 ${resp.headers.get('content-type') || '未知格式'}）`)
  }
  const buffer = Buffer.from(await resp.arrayBuffer())
  return recognizeFromImageUrl(`data:${mime};base64,${buffer.toString('base64')}`)
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

  const result = await response.json() as GLMResponse
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
