-- Printer 表 disabled 列改名为 enabled，值翻转（0→1, 1→0）
ALTER TABLE Printer RENAME COLUMN disabled TO enabled;
UPDATE Printer SET enabled = 1 - enabled;