import { useState, useEffect } from 'react'
import { api } from '../api'

interface Printer {
  printerName: string
  computerId: string
  computerName: string
}

interface PrintTask {
  id: number
  state: string
  printJobId: number
  fileId: string
  filename: string
  duplex: boolean
  tumple: boolean
}

interface PrintJobDetailData {
  id: number
  state: string
  computerId: string
  printerName: string
  printTasks: PrintTask[]
  computer?: { name: string }
}

export function PrintJobDetail() {
  const [data, setData] = useState<PrintJobDetailData | null>(null)
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingPrinter, setPendingPrinter] = useState<{ computerId: string; printerName: string } | null>(null)
  const [pendingTasks, setPendingTasks] = useState<Map<number, { duplex: boolean; tumple: boolean }>>(new Map())

  const params = new URLSearchParams(window.location.search)
  const printJobId = params.get('id')
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!printJobId) {
      setError('缺少打印任务ID')
      setLoading(false)
      return
    }
    if (!token) {
      window.location.href = `/?external_userid=&open_kfid=&redirect=print-job&id=${printJobId}`
      return
    }
    loadData()
  }, [printJobId, token])

  const loadData = async () => {
    try {
      const [detail, printerList] = await Promise.all([
        api.printJob.getPrintJobDetail(parseInt(printJobId!)),
        api.printJob.getAllPrinters()
      ])
      setData(detail)
      setPrinters(printerList)
      setPendingPrinter({ computerId: detail.computerId, printerName: detail.printerName })
      const taskMap = new Map<number, { duplex: boolean; tumple: boolean }>()
      detail.printTasks.forEach(t => taskMap.set(t.id, { duplex: t.duplex, tumple: t.tumple }))
      setPendingTasks(taskMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePrinterChange = (computerId: string, printerName: string) => {
    setPendingPrinter({ computerId, printerName })
  }

  const handleTaskChange = (taskId: number, duplex: boolean, tumple: boolean) => {
    setPendingTasks(prev => new Map(prev).set(taskId, { duplex, tumple }))
  }

  const handleConfirm = async () => {
    if (!data || data.state !== 'waiting_confirmation') return
    setSaving(true)
    setError('')
    try {
      console.log('=== handleConfirm ===')
      console.log('data.id:', data.id, typeof data.id)
      console.log('pendingPrinter:', pendingPrinter)
      console.log('API call args:', [data.id, pendingPrinter?.computerId, pendingPrinter?.printerName])
      if (pendingPrinter && (pendingPrinter.computerId !== data.computerId || pendingPrinter.printerName !== data.printerName)) {
        console.log('Calling updatePrintJob with:', data.id, pendingPrinter.computerId, pendingPrinter.printerName)
        const result = await api.printJob.updatePrintJob(data.id, pendingPrinter.computerId, pendingPrinter.printerName)
        console.log('updatePrintJob result:', result)
      }
      for (const [taskId, options] of pendingTasks) {
        const original = data.printTasks.find(t => t.id === taskId)
        if (original && (original.duplex !== options.duplex || original.tumple !== options.tumple)) {
          await api.printJob.updatePrintTask(taskId, options.duplex, options.tumple)
        }
      }
      await api.printJob.confirmPrintJob(data.id)
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
                value={pendingPrinter ? `${pendingPrinter.computerId}|${pendingPrinter.printerName}` : ''}
                onChange={(e) => {
                  const [computerId, printerName] = e.target.value.split('|')
                  handlePrinterChange(computerId, printerName)
                }}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {printers.map(p => (
                  <option key={`${p.computerId}|${p.printerName}`} value={`${p.computerId}|${p.printerName}`}>
                    {p.computerName} - {p.printerName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                {data?.computer?.name} - {data?.printerName}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 mb-4">
            任务ID: {data?.id}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">打印任务</h2>
          
          {data?.printTasks.map(task => {
            const pending = pendingTasks.get(task.id)
            return (
            <div key={task.id} className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900">{task.filename}</div>
                <span className={`text-sm ${task.state === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                  {task.state === 'completed' ? '已完成' : '等待打印'}
                </span>
              </div>
              
              {isEditable && pending && (
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pending.duplex}
                      onChange={(e) => handleTaskChange(task.id, e.target.checked, pending.tumple)}
                      disabled={saving}
                      className="mr-2"
                    />
                    双面打印
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pending.tumple}
                      onChange={(e) => handleTaskChange(task.id, pending.duplex, e.target.checked)}
                      disabled={saving}
                      className="mr-2"
                    />
                    短边翻转
                  </label>
                </div>
              )}
              
              {!isEditable && (
                <div className="text-sm text-gray-500 mt-1">
                  {task.duplex ? '双面' : '单面'} / {task.tumple ? '短边' : '长边'}
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