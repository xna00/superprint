import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('file:./dev.db')

console.log('开始数据库迁移...')

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {name: string}[]
  const tableNames = tables.map(t => t.name)
  
  // 1. 重命名 PrintJob -> PrintTask
  if (tableNames.includes('PrintJob') && !tableNames.includes('PrintTask')) {
    console.log('重命名表: PrintJob -> PrintTask')
    db.exec(`ALTER TABLE PrintJob RENAME TO PrintTask`)
  }
  
  // 2. 重命名 PrintTask -> PrintFile (如果 PrintTask 还存在且没有 fileId 字段)
  if (tableNames.includes('PrintTask')) {
    const columns = db.prepare("PRAGMA table_info(PrintTask)").all() as {name: string}[]
    const hasFileId = columns.some(c => c.name === 'fileId')
    
    if (hasFileId && !tableNames.includes('PrintFile')) {
      console.log('重命名表: PrintTask -> PrintFile')
      db.exec(`ALTER TABLE PrintTask RENAME TO PrintFile`)
      
      // 添加 printTaskId 列
      const fileColumns = db.prepare("PRAGMA table_info(PrintFile)").all() as {name: string}[]
      if (!fileColumns.some(c => c.name === 'printTaskId') && fileColumns.some(c => c.name === 'id')) {
        console.log('添加列: printTaskId')
        db.exec(`ALTER TABLE PrintFile ADD COLUMN printTaskId INTEGER`)
        db.exec(`UPDATE PrintFile SET printTaskId = id`)
      }
    }
  }
  
  // 3. 如果有 Printer 引用旧 printJobs，改为 printTasks
  if (tableNames.includes('Printer')) {
    console.log('Printer 表结构检查...')
  }
  
  console.log('迁移完成!')
} catch (e) {
  console.error('迁移失败:', e)
  process.exit(1)
}
