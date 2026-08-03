-- 删除 User 表
DROP TABLE IF EXISTS User;

-- Computer 去掉 userId 列（实际不存在则 no-op）
ALTER TABLE Computer DROP COLUMN userId;

-- WeixinKfUser 重建：去掉 userId 列和旧 FK
CREATE TABLE IF NOT EXISTS WeixinKfUser_new (
  externalUserId TEXT NOT NULL PRIMARY KEY
);
INSERT INTO WeixinKfUser_new (externalUserId) SELECT externalUserId FROM WeixinKfUser;
DROP TABLE WeixinKfUser;
ALTER TABLE WeixinKfUser_new RENAME TO WeixinKfUser;

-- PrintTask 重建：去掉 userId 列和旧 FK，改用新 schema
CREATE TABLE IF NOT EXISTS PrintTask_new (
  id INTEGER NOT NULL PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('waiting_confirmation', 'waiting_print', 'completed', 'failed')),
  weixinKfId TEXT NOT NULL REFERENCES WeixinKf(id),
  externalUserId TEXT NOT NULL REFERENCES WeixinKfUser(externalUserId),
  printerId INTEGER NOT NULL REFERENCES Printer(id)
);
INSERT INTO PrintTask_new (id, state, weixinKfId, externalUserId, printerId)
  SELECT id, state, weixinKfId, externalUserId, printerId FROM PrintTask;
DROP TABLE PrintTask;
ALTER TABLE PrintTask_new RENAME TO PrintTask;

-- 新建 User-Printer 多对多关联表
CREATE TABLE IF NOT EXISTS WeixinKfUserPrinter (
  weixinKfUserId TEXT NOT NULL REFERENCES WeixinKfUser(externalUserId),
  printerId INTEGER NOT NULL REFERENCES Printer(id),

  PRIMARY KEY (weixinKfUserId, printerId)
);