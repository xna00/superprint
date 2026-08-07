import {
  findComputerById,
  listPrintersByWeixinKfUser,
  listPrintersByComputerId,
  findPrintTaskById,
  findPrintTaskWithPrinter,
  findPrintTaskWithDetails,
  findPrinterById,
  findPrintFileById,
  updatePrintTaskPrinterId,
  updatePrintTaskState,
  updatePrintFileOptions,
  updatePrintFileState,
  listPrintFilesByPrintTaskId,
  listPrintFilesByPrintTaskIdAndState,
  listPrintTasksByState,
  insertPrintFile,
  removePrintFilesByPrintTaskId,
  removePrintTaskById,
  type PrintTaskBase,
  type PrintFileBase,
} from "../models/db.ts"
import { ApiError, addTokenToUrl, decryptString } from "./utils.ts"
import { notifyCheckJobs } from "../ws/index.ts"
import { sendMsgMenuMessage } from "./weixin/send.ts"
import { getInfo } from "./global.ts"
import { logger } from "../logger.ts";

const WEIXIN_KF_ID = 'wkHnU4FQAAnkssZ2Y0t7gAKpQxcw7gjQ'

const getExternalUserId = async () => {
  const info = getInfo();
  const cookie = info.request.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  if (!tokenMatch) throw new ApiError(401, {}, "未登录！");
  return await decryptString(tokenMatch[1]);
};

const getComputerId = () => {
  const info = getInfo();
  const computerId = info.request.headers.get("x-computer-id");
  if (!computerId || !findComputerById(computerId)) {
    throw new ApiError(401, {}, "未授权设备");
  }
  return computerId;
};

const verifyComputerForTask = (computerId: string, task: { printerId: number }) => {
  const printer = findPrinterById(task.printerId);
  if (!printer || printer.computerId !== computerId) {
    throw new ApiError(403, {}, "无权操作此打印任务");
  }
};

export const getAllPrinters = async (printTaskId: number) => {
  const externalUserId = await getExternalUserId();
  const task = findPrintTaskById(printTaskId);
  if (!task) throw new ApiError(404, {}, '打印任务不存在');
  if (task.externalUserId !== externalUserId) throw new ApiError(403, {}, '无权操作');
  const printers = listPrintersByWeixinKfUser(externalUserId, task.weixinKfId);
  return printers.map(p => ({
    printerId: p.id,
    printerName: p.name,
    computerName: p.computerName,
    enabled: p.enabled,
  }));
}

export const getPrintTaskDetail = async (printTaskId: number) => {
  const externalUserId = await getExternalUserId();
  const printTask = findPrintTaskWithDetails(printTaskId);
  if (!printTask) {
    throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
  }
  if (printTask.externalUserId !== externalUserId) {
    throw new ApiError(403, {}, '无权操作');
  }
  return printTask
}

export const updatePrintTask = async (printTaskId: number, printerId: number) => {
  const externalUserId = await getExternalUserId();
  const printTask = findPrintTaskWithPrinter(printTaskId);
  if (!printTask) {
    throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
  }
  if (printTask.externalUserId !== externalUserId) {
    throw new ApiError(403, {}, '无权操作');
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
  const externalUserId = await getExternalUserId();
  const file = findPrintFileById(fileId)
  if (!file) {
    throw new ApiError(404, {}, '文件不存在', 'ENTITY_NOT_FOUND')
  }
  const task = findPrintTaskById(file.printTaskId)
  if (!task || task.state !== 'waiting_confirmation') {
    throw new ApiError(400, {}, '只能修改待确认状态的任务', 'INVALID_STATE')
  }
  if (task.externalUserId !== externalUserId) {
    throw new ApiError(403, {}, '无权操作');
  }
  updatePrintFileOptions(fileId, duplex, tumble)
  return { success: true }
}

export const confirmPrintTask = async (printTaskId: number) => {
  const externalUserId = await getExternalUserId();
  const printTask = findPrintTaskWithPrinter(printTaskId)
  if (!printTask) {
    throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
  }
  if (printTask.externalUserId !== externalUserId) {
    throw new ApiError(403, {}, '无权操作');
  }
  if (printTask.state !== 'waiting_confirmation') {
    throw new ApiError(400, {}, '只能确认待确认状态的任务', 'INVALID_STATE')
  }
  updatePrintTaskState(printTaskId, 'waiting_print')
  if (printTask.printer) {
    notifyCheckJobs(printTask.printer.computerId)
  }
  return { success: true }
}

export const fileSucceed = async (id: number) => {
  const computerId = getComputerId();
  const file = findPrintFileById(id)
  if (!file) {
    throw new ApiError(404, {}, '文件不存在', 'ENTITY_NOT_FOUND')
  }
  const task = findPrintTaskById(file.printTaskId)
  if (!task) {
    throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
  }
  verifyComputerForTask(computerId, task);
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
  const computerId = getComputerId();
  const file = findPrintFileById(id)
  if (!file) {
    throw new ApiError(404, {}, '文件不存在', 'ENTITY_NOT_FOUND')
  }
  const task = findPrintTaskById(file.printTaskId)
  if (!task) {
    throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
  }
  verifyComputerForTask(computerId, task);
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
  const computerId = getComputerId();
  const task = findPrintTaskById(printTaskId)
  if (!task) {
    throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
  }
  verifyComputerForTask(computerId, task);
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
      notifyCheckJobs(computer.id)
    }
  }
  return { success: true, retriedCount: failedFiles.length }
}

export const getPrintJobs = async () => {
  const computerId = getComputerId();
  const printers = listPrintersByComputerId(computerId);
  const printerIds = printers.map(p => p.id);
  const allTasks = listPrintTasksByState('waiting_print');
  const tasks = allTasks.filter((t) => printerIds.includes(t.printerId));
  return tasks.map((t) => ({
    ...t,
    printer: findPrinterById(t.printerId),
    printFiles: listPrintFilesByPrintTaskIdAndState(t.id, 'waiting_print'),
  }));
};

export const deletePrintTask = async (printTaskId: number) => {
  const externalUserId = await getExternalUserId();
  const printTask = findPrintTaskById(printTaskId)
  if (!printTask) {
    throw new ApiError(404, {}, '打印任务不存在', 'ENTITY_NOT_FOUND')
  }
  if (printTask.externalUserId !== externalUserId) {
    throw new ApiError(403, {}, '无权操作');
  }
  removePrintFilesByPrintTaskId(printTaskId)
  removePrintTaskById(printTaskId)
  return { success: true }
}