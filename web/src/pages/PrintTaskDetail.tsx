import { useState, useEffect } from 'react'
import { api } from '../api'
import { PdfPreview } from '../components/PdfPreview'

interface PrinterOption {
  printerId: number
  printerName: string
  computerId: string
  computerName: string
  disabled: boolean
}

interface PrintFile {
  id: number
  state: string
  printTaskId: number
  fileId: string
  filename: string
  duplex: boolean
  tumble: boolean
}

interface Printer {
  id: number
  name: string
  computerId: string
}

interface PrintTaskDetailData {
  id: number
  state: string
  printerId: number
  printFiles: PrintFile[]
  printer?: Printer
}

export function PrintTaskDetail() {
  const [data, setData] = useState<PrintTaskDetailData | null>(null)
  const [printers, setPrinters] = useState<PrinterOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingPrinterId, setPendingPrinterId] = useState<number | null>(null)
  const [pendingFiles, setPendingFiles] = useState<Map<number, { duplex: boolean; tumble: boolean }>>(new Map())
  const [previewFileId, setPreviewFileId] = useState<string | null>(null)

  const params = new URLSearchParams(window.location.search)
  const printTaskId = params.get('id')

  useEffect(() => {
    if (!printTaskId) {
      setError('缺少打印任务ID')
      setLoading(false)
      return
    }
    loadData()
  }, [printTaskId])

  const loadData = async () => {
    try {
      const [detail, printerList] = await Promise.all([
        api.printTask.getPrintTaskDetail(parseInt(printTaskId!)),
        api.printTask.getAllPrinters()
      ])
      setData(detail)
      setPrinters(printerList)
      setPendingPrinterId(detail.printerId)
      const fileMap = new Map<number, { duplex: boolean; tumble: boolean }>()
      detail.printFiles.forEach(f => fileMap.set(f.id, { duplex: f.duplex, tumble: f.tumble }))
      setPendingFiles(fileMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePrinterChange = (printerId: number) => {
    setPendingPrinterId(printerId)
  }

  const handleFileChange = (fileId: number, duplex: boolean, tumble: boolean) => {
    setPendingFiles(prev => new Map(prev).set(fileId, { duplex, tumble }))
  }

  const saveSettings = async () => {
    if (!data) return
    if (pendingPrinterId !== null && pendingPrinterId !== data.printerId) {
      await api.printTask.updatePrintTask(data.id, pendingPrinterId)
    }
    for (const [fileId, options] of pendingFiles) {
      const original = data.printFiles.find(f => f.id === fileId)
      if (original && (original.duplex !== options.duplex || original.tumble !== options.tumble)) {
        await api.printTask.updatePrintFile(fileId, options.duplex, options.tumble)
      }
    }
  }

  const handleSave = async () => {
    if (!data || data.state !== 'waiting_confirmation') return
    setSaving(true)
    setError('')
    try {
      await saveSettings()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndPrint = async () => {
    if (!data || data.state !== 'waiting_confirmation') return
    setSaving(true)
    setError('')
    try {
      await saveSettings()
      await api.printTask.confirmPrintTask(data.id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存并打印失败')
    } finally {
      setSaving(false)
    }
  }

  const isEditable = data?.state === 'waiting_confirmation'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  const currentPrinter = printers.find(p => p.printerId === (pendingPrinterId ?? data?.printerId))

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-left">打印任务详情</h1>
            <div className="flex items-center gap-3 justify-start">
              <span className="text-sm text-gray-400">ID: {data?.id}</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                data?.state === 'waiting_confirmation' ? 'bg-yellow-100 text-yellow-800' :
                data?.state === 'waiting_print' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {data?.state === 'waiting_confirmation' ? '待确认' :
                 data?.state === 'waiting_print' ? '等待打印' : '已完成'}
              </span>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">打印机</label>
            {isEditable ? (
              <select
                value={pendingPrinterId ?? ''}
                onChange={(e) => handlePrinterChange(parseInt(e.target.value))}
                disabled={saving}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {printers.filter(p => !p.disabled).map(p => (
                  <option key={p.printerId} value={p.printerId}>
                    {p.computerName} - {p.printerName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                {currentPrinter?.computerName} - {currentPrinter?.printerName}
              </div>
            )}
          </div>

          {isEditable && (
            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={handleSaveAndPrint}
                disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                保存并打印
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                保存
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 text-left">打印任务</h2>
          
          {data?.printFiles.map(file => {
            const pending = pendingFiles.get(file.id)
            return (
            <div key={file.id} className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-medium text-gray-900 text-sm sm:text-base break-all flex-1 text-left">{file.filename}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewFileId(file.fileId)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    预览
                  </button>
                  <span className={`text-sm whitespace-nowrap ${file.state === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                    {file.state === 'completed' ? '已完成' : '等待打印'}
                  </span>
                </div>
              </div>
              
              {isEditable && pending && (
                <div className="flex flex-wrap items-center gap-3 pl-1">
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={pending.duplex}
                      onChange={(e) => handleFileChange(file.id, e.target.checked, pending.tumble)}
                      disabled={saving}
                      className="w-4 h-4 mr-2 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    双面打印
                  </label>
                  {pending.duplex && (
                  <div className="flex gap-1 p-1 bg-indigo-50 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleFileChange(file.id, pending.duplex, false)}
                      disabled={saving}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        !pending.tumble ? 'bg-indigo-300 text-white' : 'text-gray-500 hover:bg-indigo-100'
                      }`}
                    >
                      长边翻页
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFileChange(file.id, pending.duplex, true)}
                      disabled={saving}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        pending.tumble ? 'bg-indigo-300 text-white' : 'text-gray-500 hover:bg-indigo-100'
                      }`}
                    >
                      短边翻页
                    </button>
                  </div>
                  )}
                </div>
              )}
              
              {!isEditable && (
                <div className="text-sm text-gray-500 pl-1">
                  {file.duplex ? '双面' : '单面'} / {file.tumble ? '短边' : '长边'}
                </div>
              )}
            </div>
          )})}
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-center">{error}</div>
        )}

        {previewFileId && (
          <PdfPreview fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
        )}
      </div>
    </div>
  )
}
