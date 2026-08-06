import { createReadStream, accessSync, constants } from "node:fs"
import { Readable } from "node:stream"
import { join, extname } from "node:path"
import { ApiError, decryptString } from "./utils.ts"
import { getInfo } from "./global.ts"
import { findComputerById, findPrinterById, findPrintFileByFileId, findPrintTaskById } from "../models/db.ts"

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
}

const getExternalUserId = async () => {
  const info = getInfo();
  const cookie = info.request.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  if (!tokenMatch) throw new ApiError(401, {}, "未登录！");
  return await decryptString(tokenMatch[1]);
};

const getFileAccess = async (fileName: string) => {
    const info = getInfo();
    const cookie = info.request.headers.get("cookie") || "";
    if (cookie.includes("token=")) {
        return await getExternalUserId();
    }
    const computerId = info.request.headers.get("x-computer-id");
    if (!computerId || !findComputerById(computerId)) {
        throw new ApiError(401, {}, "未授权设备");
    }
    const printFile = findPrintFileByFileId(fileName.replace(/\.pdf$/, ''));
    if (printFile) {
        const task = findPrintTaskById(printFile.printTaskId);
        if (task) {
            const printer = findPrinterById(task.printerId);
            if (!printer || printer.computerId !== computerId) {
                throw new ApiError(403, {}, "无权操作此打印任务");
            }
        }
    }
    return computerId;
};

export const getFile = async (fileName: string) => {
    await getFileAccess(fileName)
    const filePath = join(UPLOADS_DIR, fileName)
    try {
        accessSync(filePath, constants.R_OK)
    } catch {
        throw new ApiError(404, {}, '文件不存在', 'FILE_NOT_FOUND')
    }
    const stream = Readable.toWeb(createReadStream(filePath))
    const ext = extname(fileName).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
    return new Response(stream, {
        headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${fileName}"`,
        },
    })
}