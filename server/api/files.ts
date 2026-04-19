import { createReadStream, accessSync, constants, readdirSync } from "node:fs"
import { Readable } from "node:stream"
import { join, extname } from "node:path"
import { ApiError } from "./utils.ts"
import { _currentUser } from "./user.ts"

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
}

export const getFile = async (fileName: string) => {
    const user = await _currentUser()
    
    const filePath = join(UPLOADS_DIR, fileName)
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

export const getPsFile = async (fileId: string) => {
    const user = await _currentUser()
    
    const filePath = join(UPLOADS_DIR, fileId + '.ps')
    try {
        accessSync(filePath, constants.R_OK)
    } catch {
        throw new ApiError(404, {}, '文件不存在', 'FILE_NOT_FOUND')
    }
    
    const stream = Readable.toWeb(createReadStream(filePath))
    
    return new Response(stream, {
        headers: {
            'Content-Type': 'application/postscript',
            'Content-Disposition': `inline; filename="${fileId}.ps"`,
        },
    })
}
