-- Printer 表去重并加唯一索引 (name, computerId)
-- 保留策略：每组 (name, computerId) 优先保留 enabled=1 的行，否则保留 id 最大的行
-- 被删除行的 PrintTask.printerId 引用重指向保留行

-- 1. 计算每组保留的 id
WITH kept AS (
  SELECT name, computerId,
         (SELECT p2.id FROM Printer p2
          WHERE p2.name = p.name AND p2.computerId = p.computerId
          ORDER BY p2.enabled DESC, p2.id DESC LIMIT 1) AS keepId
  FROM Printer p
  GROUP BY name, computerId
)
-- 2. 重指向保留行
UPDATE PrintTask
SET printerId = (SELECT k.keepId FROM kept k WHERE k.name = (SELECT name FROM Printer WHERE id = PrintTask.printerId) AND k.computerId = (SELECT computerId FROM Printer WHERE id = PrintTask.printerId))
WHERE printerId IN (
  SELECT p.id FROM Printer p
  LEFT JOIN kept k ON k.keepId = p.id
  WHERE k.keepId IS NULL
);

-- 3. 删除重复行
DELETE FROM Printer
WHERE id NOT IN (
  SELECT keepId FROM (
    SELECT name, computerId,
           (SELECT p2.id FROM Printer p2
            WHERE p2.name = p.name AND p2.computerId = p.computerId
            ORDER BY p2.enabled DESC, p2.id DESC LIMIT 1) AS keepId
    FROM Printer p
    GROUP BY name, computerId
  )
);

-- 4. 建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_printer_name_computer ON Printer(name, computerId);
