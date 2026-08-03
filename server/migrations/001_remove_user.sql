-- 删除 User 表，身份改为 WeixinKfUser 直接作为用户
DROP TABLE IF EXISTS User;

-- WeixinKfUser 去掉 userId 列（externalUserId 直接 PK）
ALTER TABLE WeixinKfUser DROP COLUMN userId;
-- Computer 去掉 userId 列，变为独立设备
ALTER TABLE Computer DROP COLUMN userId;
-- PrintTask 去掉 userId 列，改用 externalUserId 关联 WeixinKfUser
ALTER TABLE PrintTask DROP COLUMN userId;

-- 新建 User-Printer 多对多关联表
CREATE TABLE IF NOT EXISTS WeixinKfUserPrinter (
  weixinKfUserId TEXT NOT NULL REFERENCES WeixinKfUser(externalUserId),
  printerId INTEGER NOT NULL REFERENCES Printer(id),

  PRIMARY KEY (weixinKfUserId, printerId)
);