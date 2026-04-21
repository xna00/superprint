import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PdfPreviewProps {
  fileId: string
  onClose: () => void
}

interface PDFDocument {
  numPages: number
  getPage: (pageNumber: number) => Promise<PDFPage>
}

interface PDFPage {
  getViewport: (options: { scale: number }) => { width: number; height: number }
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> }
}

interface PageInfo {
  pageNum: number
  width: number
  height: number
}

let pdfCache: { fileId: string; pdf: PDFDocument } | null = null

export function PdfPreview({ fileId, onClose }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pages, setPages] = useState<PageInfo[]>([])
  const [containerWidth, setContainerWidth] = useState(0)
  const [renderKey] = useState(0)

  const loadPdf = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      if (pdfCache && pdfCache.fileId === fileId) {
        const pageInfos: PageInfo[] = []
        for (let i = 1; i <= pdfCache.pdf.numPages; i++) {
          const page = await pdfCache.pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1 })
          pageInfos.push({
            pageNum: i,
            width: viewport.width,
            height: viewport.height,
          })
        }
        setPages(pageInfos)
        setLoading(false)
        return
      }

      const response = await fetch(`/api/files/getFile?data=["${fileId}.pdf"]`)
      if (!response.ok) {
        throw new Error('文件加载失败, status: ' + response.status)
      }

      const arrayBuffer = await response.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise as unknown as PDFDocument

      pdfCache = { fileId, pdf }

      const pageInfos: PageInfo[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        pageInfos.push({
          pageNum: i,
          width: viewport.width,
          height: viewport.height,
        })
      }

      setPages(pageInfos)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[PDF] 错误:', errMsg)
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    loadPdf()
  }, [loadPdf])

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth)
      const observer = new ResizeObserver((entries) => {
        setContainerWidth(entries[0].contentRect.width)
      })
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }
  }, [])

  const renderPage = useCallback(async (canvas: HTMLCanvasElement, pageNum: number) => {
    if (!pdfCache || pdfCache.fileId !== fileId) return

    try {
      const page = await pdfCache.pdf.getPage(pageNum)
      const baseViewport = page.getViewport({ scale: 1 })
      const calculatedScale = containerWidth / baseViewport.width
      const viewport = page.getViewport({ scale: calculatedScale })

      const context = canvas.getContext('2d')
      if (!context) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = viewport.width * dpr
      canvas.height = viewport.height * dpr
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      context.scale(dpr, dpr)

      await page.render({
        canvasContext: context,
        viewport,
      }).promise
    } catch (err) {
      console.error('[PDF] 渲染页面失败:', pageNum, err)
    }
  }, [fileId, containerWidth])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gray-800 text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{pages.length} 页</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">
            {containerWidth > 0 && pages[0] ? Math.round((containerWidth / pages[0].width) * 100) : 100}%
          </span>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          关闭
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-900 p-4 flex flex-col gap-4 items-center"
      >
        {loading && <div className="text-white">加载中...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && pages.map((page) => (
          <PageCanvas
            key={page.pageNum}
            pageNum={page.pageNum}
            containerWidth={containerWidth}
            renderKey={renderKey}
            onRender={renderPage}
          />
        ))}
      </div>
    </div>
  )
}

interface PageCanvasProps {
  pageNum: number
  containerWidth: number
  renderKey: number
  onRender: (canvas: HTMLCanvasElement, pageNum: number) => void
}

function PageCanvas({ pageNum, containerWidth, renderKey, onRender }: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && containerWidth > 0) {
      onRender(canvasRef.current, pageNum)
    }
  }, [pageNum, containerWidth, renderKey])

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        className="bg-white shadow-lg max-w-full"
      />
      <span className="text-gray-500 text-sm">{pageNum}</span>
    </div>
  )
}