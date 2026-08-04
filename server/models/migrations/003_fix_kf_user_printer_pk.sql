CREATE TABLE WeixinKfUserPrinter_new (
  weixinKfUserId TEXT NOT NULL REFERENCES WeixinKfUser(externalUserId),
  printerId INTEGER NOT NULL REFERENCES Printer(id),
  kfid TEXT,
  PRIMARY KEY (weixinKfUserId, printerId, kfid)
);
INSERT OR ABORT INTO WeixinKfUserPrinter_new SELECT * FROM WeixinKfUserPrinter;
DROP TABLE WeixinKfUserPrinter;
ALTER TABLE WeixinKfUserPrinter_new RENAME TO WeixinKfUserPrinter;
