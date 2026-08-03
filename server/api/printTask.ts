import {
  findComputerById,
  listComputersWithPrinters,
  listPrintersByComputerId,
  listPrintTasksWithDetails,
  findPrintTaskById,
  findPrintTaskWithPrinter,
  findPrintTaskWithDetails,
  findPrinterById,
  findPrinterWithComputer,
  findPrintFileById,
  updatePrintTaskPrinterId,
  updatePrintTaskState,
  updatePrintFileOptions,
  updatePrintFileState,
  listPrintFilesByPrintTaskId,
  listPrintFilesByPrintTaskIdAndState,
  listWaitingConfirmationTasks,
  insertPrintTask,
  insertPrintFile,
  removePrintFilesByPrintTaskId,
  removePrintTaskById,
  findWeixinKfUserByUserId,
  type PrintTaskBase,
  type PrintFileBase,
  type PrintTaskState,
} from "../models/db.ts"
import { _currentUser } from "./user.ts"
import { ApiError, addTokenToUrl } from "./utils.ts"
import { notifyCheckJobs } from "../ws/index.ts"
import { sendMsgMenuMessage } from "./weixin/send.ts"
import { existsSync, writeFileSync } from "node:fs"
import { join, extname } from "node:path"
import { convertPdfToXps, convertOfficeToPdf, isOfficeFile, isPresentationFile, getUploadsDir } from "./weixin/download.ts"
import { generateTaskId } from "./weixin/message.ts"
import { getInfo } from "./global.ts"
import { createHash } from "node:crypto"
import { logger } from "../logger.ts";

const WEIXIN_KF_ID = 'wkHnU4FQAAnkssZ2Y0t7gAKpQxcw7gjQ'

export const listPrintTasks = async (query?: { computerId?: string; state?: string }) => {
    const user = await _currentUser()
    const opts: { state?: PrintTaskState; printerIds?: number[] } = {}
    if (query?.state) opts.state = query.state as PrintTaskState

    if (query?.computerId) {
        const computer = findComputerById(query.computerId)
        if (computer) {
            const printerIds = listPrintersByComputerId(computer.id).map(p => p.id)
            opts.printerIds = printerIds
        }
    }

    return listPrintTasksWithDetails(user.id, opts)
}

export const getAllPrinters = async () => {
    const user = await _currentUser()
    const computers = listComputersWithPrinters(user.id)
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
    const printTask = findPrintTaskWithDetails(printTaskId)

    if (!printTask || printTask.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    return printTask
}

export const updatePrintTask = async (printTaskId: number, printerId: number) => {
    const user = await _currentUser()
    const printTask = findPrintTaskWithPrinter(printTaskId)

    if (!printTask || printTask.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    if (printTask.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能修改待确认状态的任务', 'INVALID_STATE')
    }

    const printer = findPrinterById(printerId)
    if (!printer) {
        throw new ApiError(404, {}, '打印机不存在', 'ENTITY_NOT_FOUND')
    }

    updatePrintTaskPrinterId(printTaskId, printerId)
    return { success: true }
}

export const updatePrintFile = async (fileId: number, duplex: boolean, tumble: boolean) => {
    const user = await _currentUser()
    const file = findPrintFileById(fileId)

    if (!file) {
        throw new ApiError(404, {}, '文件不存在', 'ENTITY_NOT_FOUND')
    }

    const task = findPrintTaskById(file.printTaskId)

    if (!task || task.userId !== user.id) {
        throw new ApiError(403, {}, '无权操作', 'FORBIDDEN')
    }

    if (task.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能修改待确认状态的任务', 'INVALID_STATE')
    }

    const pdfPath = join(getUploadsDir(), file.fileId + '.pdf')
    if (existsSync(pdfPath)) {
        convertPdfToXps(pdfPath, duplex, tumble)
    }

    updatePrintFileOptions(fileId, duplex, tumble)
    return { success: true }
}

export const confirmPrintTask = async (printTaskId: number) => {
    const user = await _currentUser()
    const printTask = findPrintTaskWithPrinter(printTaskId)

    if (!printTask || printTask.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    if (printTask.state !== 'waiting_confirmation') {
        throw new ApiError(400, {}, '只能确认待确认状态的任务', 'INVALID_STATE')
    }

    updatePrintTaskState(printTaskId, 'waiting_print')
    
    if (printTask.printer) {
        notifyCheckJobs(user.id, printTask.printer.computerId)
    }
    
    return { success: true }
}

export const fileSucceed = async (id: number) => {
    const user = await _currentUser()
    const file = findPrintFileById(id)

    if (!file) {
        throw new ApiError(404, {}, '文件不存在', 'ENTITY_NOT_FOUND')
    }

    const task = findPrintTaskById(file.printTaskId)

    if (!task || task.userId !== user.id) {
        throw new ApiError(403, {}, '无权操作', 'FORBIDDEN')
    }

    updatePrintFileState(id, 'completed')

    const allFiles = listPrintFilesByPrintTaskId(task.id)
    const allCompleted = allFiles.every(f => f.state === 'completed')

    if (allCompleted) {
        updatePrintTaskState(task.id, 'completed')
    }

    return { success: true }
}

const sendPrintFailureNotification = async (task: PrintTaskBase, failedFiles: PrintFileBase[]) => {
    if (!task.externalUserId) {
        logger.log(`任务 ${task.id} 没有 externalUserId，跳过通知`)
        return
    }

    const failedFileNames = failedFiles.map(f => f.filename).join('\n')
    const message = `打印任务 #${task.id} 部分文件打印失败：\n\n${failedFileNames}\n\n点击下方按钮重试`

    try {
        await sendMsgMenuMessage(
            message,
            [{ id: `retry_${task.id}`, content: '重试失败文件' }],
            task.weixinKfId,
            task.externalUserId
        )
        logger.log(`已向 ${task.externalUserId} 发送打印失败通知`)
    } catch (error) {
        logger.error(`发送打印失败通知失败:`, error)
    }
}

export const fileFailed = async (id: number) => {
    const user = await _currentUser()
    const file = findPrintFileById(id)

    if (!file) {
        throw new ApiError(404, {}, '文件不存在', 'ENTITY_NOT_FOUND')
    }

    const task = findPrintTaskById(file.printTaskId)

    if (!task || task.userId !== user.id) {
        throw new ApiError(403, {}, '无权操作', 'FORBIDDEN')
    }

    updatePrintFileState(id, 'failed')

    const allFiles = listPrintFilesByPrintTaskId(task.id)
    const hasWaiting = allFiles.some(f => f.state === 'waiting_print')
    const allCompleted = allFiles.every(f => f.state === 'completed')
    const hasFailed = allFiles.some(f => f.state === 'failed')

    if (!hasWaiting) {
        if (allCompleted) {
            updatePrintTaskState(task.id, 'completed')
        } else if (hasFailed) {
            updatePrintTaskState(task.id, 'failed')
            const failedFiles = allFiles.filter(f => f.state === 'failed')
            await sendPrintFailureNotification(task, failedFiles)
        }
    }

    return { success: true }
}

export const retryFailedFiles = async (printTaskId: number) => {
    const user = await _currentUser()
    const task = findPrintTaskById(printTaskId)

    if (!task || task.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    const failedFiles = listPrintFilesByPrintTaskIdAndState(printTaskId, 'failed')
    
    if (failedFiles.length === 0) {
        throw new ApiError(400, {}, '没有失败的文件', 'NO_FAILED_FILES')
    }

    for (const file of failedFiles) {
        updatePrintFileState(file.id, 'waiting_print')
    }

    updatePrintTaskState(task.id, 'waiting_print')

    const printer = findPrinterById(task.printerId)
    if (printer) {
        const computer = findComputerById(printer.computerId)
        if (computer) {
            notifyCheckJobs(user.id, computer.id)
        }
    }

    return { success: true, retriedCount: failedFiles.length }
}

export const deletePrintTask = async (printTaskId: number) => {
    const user = await _currentUser()
    const printTask = findPrintTaskById(printTaskId)

    if (!printTask || printTask.userId !== user.id) {
        throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
    }

    removePrintFilesByPrintTaskId(printTaskId)
    removePrintTaskById(printTaskId)

    return { success: true }
}

export const _outUploadPrintFile = async (req: Request): Promise<Response> => {
    const info = getInfo()
    const user = await _currentUser(info)

    const url = new URL(req.url)
    const duplex = url.searchParams.get("duplex") !== "false"
    const tumble = url.searchParams.get("tumble") === "true"

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
        return Response.json({ error: "缺少file字段" }, { status: 400 })
    }

    const ext = extname(file.name).toLowerCase()
    const allowedExts = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"]
    if (!allowedExts.includes(ext)) {
        return Response.json({ error: "不支持的文件类型" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16)
    const fileId = hash
    const filePath = join(getUploadsDir(), fileId + ext)
    writeFileSync(filePath, buffer)

    if (ext === ".pdf") {
        convertPdfToXps(filePath, duplex, tumble)
    } else if (isOfficeFile(ext)) {
        const pdfPath = convertOfficeToPdf(filePath)
        if (pdfPath) {
            const officeTumble = isPresentationFile(ext) ? true : tumble
            convertPdfToXps(pdfPath, duplex, officeTumble)
        }
    }

    const kfUser = findWeixinKfUserByUserId(user.id)
    const externalUserId = kfUser?.externalUserId ?? ""

    const existingTask = listWaitingConfirmationTasks(user.id, WEIXIN_KF_ID, externalUserId)[0]
    let printTaskId: number

    if (existingTask) {
        printTaskId = existingTask.id
    } else {
        printTaskId = generateTaskId()
        const computers = listComputersWithPrinters(user.id)
        const printer = computers[0]?.printers?.find(p => !p.disabled)
        if (!printer) {
            return Response.json({ error: "未绑定打印机" }, { status: 400 })
        }
        insertPrintTask({ id: printTaskId, state: "waiting_confirmation", weixinKfId: WEIXIN_KF_ID, externalUserId: externalUserId, userId: user.id, printerId: printer.id })
    }

    const printFileId = insertPrintFile({
        state: "waiting_print",
        printTaskId,
        fileId,
        filename: file.name,
        duplex,
        tumble: tumble || isPresentationFile(ext)
    })

    if (externalUserId) {
        try {
            const task = findPrintTaskWithPrinter(printTaskId)
            if (task?.printer) {
                const printer = findPrinterWithComputer(task.printer.id)
                const printTaskUrl = await addTokenToUrl(`https://superprint.xna00.top/printTask?id=${printTaskId}`, user.id)
                await sendMsgMenuMessage(
                    `📄 打印任务已创建\n\n计算机: ${printer?.computer.name}\n打印机: ${printer?.name}\n文件: ${file.name}\n\n💡 点击"查看详情"可修改打印设置`,
                    [
                        { id: `confirm_${printTaskId}`, content: "确认打印" },
                        { id: `delete_${printTaskId}`, content: "删除任务" },
                        { content: "查看详情", url: printTaskUrl }
                    ],
                    WEIXIN_KF_ID,
                    externalUserId
                )
            }
        } catch (error) {
            logger.error("发送微信通知失败:", error)
        }
    }

    return Response.json({
        success: true,
        printTaskId,
        printFileId,
        fileId,
        filename: file.name
    })
}
