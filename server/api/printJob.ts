import { PrintJob, PrintTask, type PrintJobBase } from "../models/index.ts"
import { _currentUser } from "./user.ts"
import { ApiError } from "./utils.ts"

export const listPrintJobsWithTasks = async (query?: Partial<Pick<PrintJobBase, 'state' | 'computerId' | 'printerName'>>) => {
    const user = await _currentUser()
    const criteria: any = { userId: user.id }
    if (query?.state) criteria.state = query.state
    if (query?.computerId) criteria.computerId = query.computerId
    if (query?.printerName) criteria.printerName = query.printerName
    
    const printJobs = PrintJob.findBy(criteria, { printTasks: true })
    return printJobs
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
