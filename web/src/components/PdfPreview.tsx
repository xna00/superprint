import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

interface PdfPreviewProps {
  fileId: string
  onClose: () => void
}

export function PdfPreview({ fileId, onClose }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)

  useEffect(() => {
    loadPdf()
  }, [fileId, currentPage, scale])

  const loadPdf = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/files/getFile?data=["${fileId}.pdf"]`)
      if (!response.ok) {
        throw new Error('文件加载失败')
      }

      const arrayBuffer = await response.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      if (!canvasRef.current) return

      const page = await pdf.getPage(currentPage)
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise

      setNumPages(pdf.numPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < numPages) setCurrentPage(currentPage + 1)
  }

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.2, 3))
  }

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage >= numPages}
              className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              下一页
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="px-3 py-1 bg-gray-100 rounded"
            >
              缩小
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="px-3 py-1 bg-gray-100 rounded"
            >
              放大
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            关闭
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
          {loading && (
            <div className="text-gray-500">加载中...</div>
          )}
          {error && (
            <div className="text-red-500">{error}</div>
          )}
          <canvas ref={canvasRef} className="shadow-lg bg-white" />
        </div>
      </div>
    </div>
  )
}