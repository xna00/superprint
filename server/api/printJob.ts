import { Computer, Printer, PrintJob, PrintTask, type PrintJobBase, type PrinterRel } from "../models/index.ts"
import { _currentUser } from "./user.ts"
import { ApiError } from "./utils.ts"
import { notifyCheckJobs } from "../ws/index.ts"

export const listPrintJobsWithTasks = async (query?: { computerId?: string; state?: string }) => {
    const user = await _currentUser()
    const criteria: { userId: number; state?: string; printerId?: number[] } = { userId: user.id }
    if (query?.state) criteria.state = query.state

    if (query?.computerId) {
        const computer = Computer.findOne({ id: query.computerId }, { printers: true })
        if (computer) {
            const printerIds = computer.printers.map(p => p.id)
            criteria.printerId = printerIds
        }
    }
    
    const printJobs = PrintJob.findBy(criteria, { printTasks: true, printer: true })
    return printJobs
}

export const getAllPrinters = async () => {
    const user = await _currentUser()
    const computers = Computer.findBy({ userId: user.id }, { printers: true })
    const allPrinters = computers.flatMap(c => c.printers.map(p => ({
        printerId: p.id,
        printerName: p.name,
        computerId: c.id,
        computerName: c.name,
        disabled: p.disabled
    })))
    return allPrinters
}

export const getPrintJobDetail = async (printJobId: number) => {
    const user = await _currentUser()
    const printJob = PrintJob.findOne({ id: printJobId }, { printTasks: true, printer: true })

    if (!printJob || printJob.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    return printJob
}

export const updatePrintJob = async (printJobId: number, printerId: number) => {
    const user = await _currentUser()
    const printJob = PrintJob.findOne({ id: printJobId }, { printer: true })

    if (!printJob || printJob.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    if (printJob.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能修改待确认状态的任务', 'INVALID_STATE')
    }

    const printer = Printer.findOne({ id: printerId })
    if (!printer) {
        throw new ApiError(404, {}, '打印机不存在', 'ENTITY_NOT_FOUND')
    }

    PrintJob.update({ id: printJobId }, { printerId })
    return { success: true }
}

export const updatePrintTask = async (taskId: number, duplex: boolean, tumple: boolean) => {
    const user = await _currentUser()
    const task = PrintTask.findOne({ id: taskId })

    if (!task) {
        throw new ApiError(404, {}, '任务不存在', 'ENTITY_NOT_FOUND')
    }

    const job = PrintJob.findOne({ id: task.printJobId })

    if (!job || job.userId !== user.id) {
        throw new ApiError(403, {}, '无权操作', 'FORBIDDEN')
    }

    if (job.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能修改待确认状态的任务', 'INVALID_STATE')
    }

    PrintTask.update({ id: taskId }, { duplex, tumple })
    return { success: true }
}

export const confirmPrintJob = async (printJobId: number) => {
    const user = await _currentUser()
    const printJob = PrintJob.findOne({ id: printJobId }, { printer: true })

    if (!printJob || printJob.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    if (printJob.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能确认待确认状态的任务', 'INVALID_STATE')
    }

    PrintJob.update({ id: printJobId }, { state: 'waiting_print' })
    
    if (printJob.printer) {
        notifyCheckJobs(user.id, printJob.printer.computerId)
    }
    
    return { success: true }
}

export const taskSucced = async (taskId: number) => {
    const user = await _currentUser()
    const task = PrintTask.findOne({ id: taskId })

    if (!task) {
        throw new ApiError(404, {}, '任务不存在', 'ENTITY_NOT_FOUND')
    }

    const job = PrintJob.findOne({ id: task.printJobId })

    if (!job || job.userId !== user.id) {
        throw new ApiError(403, {}, '无权操作', 'FORBIDDEN')
    }

    PrintTask.update({ id: taskId }, { state: 'completed' })

    const allTasks = PrintTask.findBy({ printJobId: job.id })
    const allCompleted = allTasks.every(t => t.state === 'completed')

    if (allCompleted) {
        PrintJob.update({ id: job.id }, { state: 'completed' })
    }

    return { success: true }
}
