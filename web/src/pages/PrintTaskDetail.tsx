import { useState, useEffect } from 'react'
import { api } from '../api'

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

  const handleConfirm = async () => {
    if (!data || data.state !== 'waiting_confirmation') return
    setSaving(true)
    setError('')
    try {
      console.log('=== handleConfirm ===')
      console.log('data.id:', data.id, typeof data.id)
      console.log('pendingPrinterId:', pendingPrinterId)
      console.log('API call args:', [data.id, pendingPrinterId])
      if (pendingPrinterId !== null && pendingPrinterId !== data.printerId) {
        console.log('Calling updatePrintTask with:', data.id, pendingPrinterId)
        const result = await api.printTask.updatePrintTask(data.id, pendingPrinterId)
        console.log('updatePrintTask result:', result)
      }
      for (const [fileId, options] of pendingFiles) {
        const original = data.printFiles.find(f => f.id === fileId)
        if (original && (original.duplex !== options.duplex || original.tumble !== options.tumble)) {
          await api.printTask.updatePrintFile(fileId, options.duplex, options.tumble)
        }
      }
      await api.printTask.confirmPrintTask(data.id)
      await loadData()
    } catch (err) {
      console.error('Confirm error:', err)
      setError(err instanceof Error ? err.message : '确认失败')
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">打印任务详情</h1>
            <div className="flex items-center gap-3">
              {isEditable && (
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认打印
                </button>
              )}
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">打印机</label>
            {isEditable ? (
              <select
                value={pendingPrinterId ?? ''}
                onChange={(e) => handlePrinterChange(parseInt(e.target.value))}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {printers.filter(p => !p.disabled).map(p => (
                  <option key={p.printerId} value={p.printerId}>
                    {p.computerName} - {p.printerName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                {currentPrinter?.computerName} - {currentPrinter?.printerName}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 mb-4">
            任务ID: {data?.id}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">打印任务</h2>
          
          {data?.printFiles.map(file => {
            const pending = pendingFiles.get(file.id)
            return (
            <div key={file.id} className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900">{file.filename}</div>
                <span className={`text-sm ${file.state === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                  {file.state === 'completed' ? '已完成' : '等待打印'}
                </span>
              </div>
              
              {isEditable && pending && (
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pending.duplex}
                      onChange={(e) => handleFileChange(file.id, e.target.checked, pending.tumble)}
                      disabled={saving}
                      className="mr-2"
                    />
                    双面打印
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pending.tumble}
                      onChange={(e) => handleFileChange(file.id, pending.duplex, e.target.checked)}
                      disabled={saving}
                      className="mr-2"
                    />
                    短边翻转
                  </label>
                </div>
              )}
              
              {!isEditable && (
                <div className="text-sm text-gray-500 mt-1">
                  {file.duplex ? '双面' : '单面'} / {file.tumble ? '短边' : '长边'}
                </div>
              )}
            </div>
          )})}
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-center">{error}</div>
        )}
      </div>
    </div>
  )
}
