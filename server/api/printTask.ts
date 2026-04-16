import { Computer, Printer, PrintTask, PrintFile, type PrintTaskBase, type PrinterRel } from "../models/index.ts"
import { _currentUser } from "./user.ts"
import { ApiError } from "./utils.ts"
import { notifyCheckJobs } from "../ws/index.ts"

export const listPrintTasks = async (query?: { computerId?: string; state?: string }) => {
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
    
    const printTasks = PrintTask.findBy(criteria, { printFiles: true, printer: true })
    return printTasks
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

export const getPrintTaskDetail = async (printTaskId: number) => {
    const user = await _currentUser()
    const printTask = PrintTask.findOne({ id: printTaskId }, { printFiles: true, printer: true })

    if (!printTask || printTask.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    return printTask
}

export const updatePrintTask = async (printTaskId: number, printerId: number) => {
    const user = await _currentUser()
    const printTask = PrintTask.findOne({ id: printTaskId }, { printer: true })

    if (!printTask || printTask.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    if (printTask.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能修改待确认状态的任务', 'INVALID_STATE')
    }

    const printer = Printer.findOne({ id: printerId })
    if (!printer) {
        throw new ApiError(404, {}, '打印机不存在', 'ENTITY_NOT_FOUND')
    }

    PrintTask.update({ id: printTaskId }, { printerId })
    return { success: true }
}

export const updatePrintFile = async (fileId: number, duplex: boolean, tumble: boolean) => {
    const user = await _currentUser()
    const file = PrintFile.findOne({ id: fileId })

    if (!file) {
        throw new ApiError(404, {}, '文件不存在', 'ENTITY_NOT_FOUND')
    }

    const task = PrintTask.findOne({ id: file.printTaskId })

    if (!task || task.userId !== user.id) {
        throw new ApiError(403, {}, '无权操作', 'FORBIDDEN')
    }

    if (task.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能修改待确认状态的任务', 'INVALID_STATE')
    }

    PrintFile.update({ id: fileId }, { duplex, tumble })
    return { success: true }
}

export const confirmPrintTask = async (printTaskId: number) => {
    const user = await _currentUser()
    const printTask = PrintTask.findOne({ id: printTaskId }, { printer: true })

    if (!printTask || printTask.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    if (printTask.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能确认待确认状态的任务', 'INVALID_STATE')
    }

    PrintTask.update({ id: printTaskId }, { state: 'waiting_print' })
    
    if (printTask.printer) {
        notifyCheckJobs(user.id, printTask.printer.computerId)
    }
    
    return { success: true }
}

export const fileSucceed = async (id: number) => {
    const user = await _currentUser()
    const file = PrintFile.findOne({ id: id })

    if (!file) {
        throw new ApiError(404, {}, '文件不存在', 'ENTITY_NOT_FOUND')
    }

    const task = PrintTask.findOne({ id: file.printTaskId })

    if (!task || task.userId !== user.id) {
        throw new ApiError(403, {}, '无权操作', 'FORBIDDEN')
    }

    PrintFile.update({ id: id }, { state: 'completed' })

    const allFiles = PrintFile.findBy({ printTaskId: task.id })
    const allCompleted = allFiles.every(f => f.state === 'completed')

    if (allCompleted) {
        PrintTask.update({ id: task.id }, { state: 'completed' })
    }

    return { success: true }
}

export const deletePrintTask = async (printTaskId: number) => {
    const user = await _currentUser()
    const printTask = PrintTask.findOne({ id: printTaskId })

    if (!printTask || printTask.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    PrintFile.remove({ printTaskId: printTaskId })
    PrintTask.remove({ id: printTaskId })

    return { success: true }
}
