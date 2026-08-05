import { DatabaseSync } from "node:sqlite";
import assert from "node:assert";
import { randomBytes } from "node:crypto";
import { TypedDb, type SchemaFks, type ResolveFks } from "../typed-sql/typed-sql.ts";

const WEIXIN_KF_SQL = `CREATE TABLE IF NOT EXISTS WeixinKf (
id TEXT NOT NULL PRIMARY KEY,
messageCursor TEXT NOT NULL,
kfBaseLink TEXT
)`;

const WEIXIN_KF_USER_SQL = `CREATE TABLE IF NOT EXISTS WeixinKfUser (
externalUserId TEXT NOT NULL PRIMARY KEY,
nickname TEXT,
avatar TEXT,
gender INTEGER CHECK(gender IN (0, 1, 2)),
unionid TEXT
)`;

const COMPUTER_SQL = `CREATE TABLE IF NOT EXISTS Computer (
id TEXT NOT NULL PRIMARY KEY,
name TEXT NOT NULL
)`;

const PRINTER_SQL = `CREATE TABLE IF NOT EXISTS Printer (
id INTEGER NOT NULL PRIMARY KEY,
name TEXT NOT NULL,
computerId TEXT NOT NULL REFERENCES Computer(id),
enabled INTEGER NOT NULL CHECK (enabled IN (1, 0)),
bindKey TEXT,

UNIQUE (name, computerId)
)`;

const PRINT_TASK_SQL = `CREATE TABLE IF NOT EXISTS PrintTask (
id INTEGER NOT NULL PRIMARY KEY,
state TEXT NOT NULL CHECK (state IN ('waiting_confirmation', 'waiting_print', 'completed', 'failed')),
weixinKfId TEXT NOT NULL REFERENCES WeixinKf(id),
externalUserId TEXT NOT NULL REFERENCES WeixinKfUser(externalUserId),
printerId INTEGER NOT NULL REFERENCES Printer(id)
)`;

const PRINT_FILE_SQL = `CREATE TABLE IF NOT EXISTS PrintFile (
id INTEGER NOT NULL PRIMARY KEY,
state TEXT NOT NULL CHECK (state IN ('waiting_print', 'completed', 'failed')),
printTaskId INTEGER NOT NULL REFERENCES PrintTask(id),
fileId TEXT NOT NULL,
filename TEXT NOT NULL,
duplex INTEGER NOT NULL CHECK (duplex IN (0, 1)),
tumble INTEGER NOT NULL CHECK (tumble IN (0, 1))
)`;

const WEIXIN_KF_USER_PRINTER_SQL = `CREATE TABLE IF NOT EXISTS WeixinKfUserPrinter (
weixinKfUserId TEXT NOT NULL REFERENCES WeixinKfUser(externalUserId),
printerId INTEGER NOT NULL REFERENCES Printer(id),
kfid TEXT,

PRIMARY KEY (weixinKfUserId, printerId, kfid)
)`;

const ALL_DDL = [
  WEIXIN_KF_SQL,
  WEIXIN_KF_USER_SQL,
  COMPUTER_SQL,
  PRINTER_SQL,
  PRINT_TASK_SQL,
  PRINT_FILE_SQL,
  WEIXIN_KF_USER_PRINTER_SQL,
];

export type Tables = ResolveFks<
  SchemaFks<typeof WEIXIN_KF_SQL> &
    SchemaFks<typeof WEIXIN_KF_USER_SQL> &
    SchemaFks<typeof COMPUTER_SQL> &
    SchemaFks<typeof PRINTER_SQL> &
    SchemaFks<typeof PRINT_TASK_SQL> &
    SchemaFks<typeof PRINT_FILE_SQL> &
    SchemaFks<typeof WEIXIN_KF_USER_PRINTER_SQL>
>;

export type WeixinKfRow = Tables["WeixinKf"];
export type WeixinKfUserRow = Tables["WeixinKfUser"];
export type ComputerRow = Tables["Computer"];
export type PrinterRow = Tables["Printer"];
export type PrintTaskRow = Tables["PrintTask"];
export type PrintFileRow = Tables["PrintFile"];
export type WeixinKfUserPrinterRow = Tables["WeixinKfUserPrinter"];

export type PrintTaskState = PrintTaskRow["state"];
export type PrintFileState = PrintFileRow["state"];

export type ComputerBase = ComputerRow;
export type PrinterBase = Omit<PrinterRow, "enabled" | "bindKey"> & { enabled: boolean };
export type PrinterListItem = Omit<PrinterBase, "computerId">;
export type PrinterWithComputerName = PrinterListItem & { computerName: string };
export type PrintFileBase = Omit<PrintFileRow, "duplex" | "tumble"> & {
  duplex: boolean;
  tumble: boolean;
};
export type PrintTaskBase = PrintTaskRow;

const raw = new DatabaseSync("file:./dev.db");

export const db = new TypedDb<Tables>(raw);

export const exec = (sql: string) => {
  raw.exec(sql);
};

export const all = <T>(sql: string, params: unknown[] = []): T[] =>
  raw.prepare(sql).all(...(params as any)) as T[];

export const run = (sql: string, params: unknown[] = []) => {
  raw.prepare(sql).run(...(params as any));
};

export const init = () => {
  for (const sql of ALL_DDL) {
    raw.exec(sql);
  }
};

// ── WeixinKf ──

export const findWeixinKfById = (id: string): WeixinKfRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM WeixinKf WHERE WeixinKf.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });

export const insertWeixinKf = (
  id: string,
  messageCursor: string,
  kfBaseLink?: string,
) => {
  db.prepare(
    `INSERT OR ABORT INTO WeixinKf (id, messageCursor, kfBaseLink) VALUES (@id, @messageCursor, @kfBaseLink)`,
  ).run({ id, messageCursor, kfBaseLink: kfBaseLink ?? null });
};

export const updateWeixinKfBaseLink = (id: string, kfBaseLink: string) => {
  db.prepare(
    `UPDATE OR ABORT WeixinKf SET kfBaseLink = @kfBaseLink WHERE WeixinKf.id = @id`,
  ).run({ id, kfBaseLink });
};

export const updateWeixinKfMessageCursor = (
  id: string,
  messageCursor: string,
) => {
  db.prepare(
    `UPDATE OR ABORT WeixinKf SET messageCursor = @messageCursor WHERE WeixinKf.id = @id`,
  ).run({ id, messageCursor });
};

// ── WeixinKfUser ──

export const findWeixinKfUserByExternalUserId = (
  externalUserId: string,
): WeixinKfUserRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM WeixinKfUser WHERE WeixinKfUser.externalUserId = @externalUserId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ externalUserId });

export const insertWeixinKfUser = (externalUserId: string) => {
  db.prepare(
    `INSERT OR ABORT INTO WeixinKfUser (externalUserId) VALUES (@externalUserId)`,
  ).run({ externalUserId });
};

export const updateWeixinKfUserInfo = (
  externalUserId: string,
  nickname: string | null,
  avatar: string | null,
  gender: 0 | 1 | 2 | null,
  unionid: string | null,
) => {
  db.prepare(
    `UPDATE OR ABORT WeixinKfUser SET nickname = @nickname, avatar = @avatar, gender = @gender, unionid = @unionid WHERE WeixinKfUser.externalUserId = @externalUserId`,
  ).run({ externalUserId, nickname, avatar, gender, unionid });
};

// ── Computer ──

export const insertComputer = (id: string, name: string) => {
  db.prepare(
    `INSERT OR ABORT INTO Computer (id, name) VALUES (@id, @name)`,
  ).run({ id, name });
};

export const findComputerById = (id: string): ComputerRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM Computer WHERE Computer.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });

export const removeComputerById = (id: string) => {
  db.prepare(`DELETE FROM Computer WHERE Computer.id = @id`).run({ id });
};

export const updateComputerName = (id: string, name: string) => {
  db.prepare(
    `UPDATE OR ABORT Computer SET name = @name WHERE Computer.id = @id`,
  ).run({ id, name });
};

// ── Printer ──

export const insertPrinter = (name: string, computerId: string) => {
  db.prepare(
    `INSERT OR ABORT INTO Printer (name, computerId, enabled) VALUES (@name, @computerId, @enabled)`,
  ).run({ name, computerId, enabled: 1 });
};

export const findPrinterByComputerIdAndName = (
  computerId: string,
  name: string,
): PrinterRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM Printer WHERE Printer.computerId = @computerId AND Printer.name = @name ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ computerId, name });

export const setPrinterEnabled = (
  computerId: string,
  name: string,
  enabled: boolean,
) => {
  db.prepare(
    `UPDATE OR ABORT Printer SET enabled = @enabled WHERE Printer.computerId = @computerId AND Printer.name = @name`,
  ).run({ computerId, name, enabled: enabled ? 1 : 0 });
};

export const findPrinterById = (id: number): PrinterBase | undefined => {
  const row = db
    .prepare(
      `SELECT ALL Printer.id AS id, Printer.name AS name, Printer.computerId AS computerId, Printer.enabled AS enabled FROM Printer WHERE Printer.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });
  return row && { ...row, enabled: Boolean(row.enabled) };
};

export const getPrinterBindKey = (id: number): string | undefined =>
  db
    .prepare(
      `SELECT ALL Printer.bindKey AS bindKey FROM Printer WHERE Printer.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id })?.bindKey ?? undefined;

export const updatePrinterBindKey = (id: number, bindKey: string) => {
  db.prepare(
    `UPDATE OR ABORT Printer SET bindKey = @bindKey WHERE Printer.id = @id`,
  ).run({ id, bindKey });
};

export const ensurePrinterBindKey = (id: number): string => {
  const existing = getPrinterBindKey(id);
  if (existing) return existing;
  const bindKey = randomBytes(16).toString("hex");
  updatePrinterBindKey(id, bindKey);
  return bindKey;
};

export const findPrinterIdByBindKey = (bindKey: string): number | undefined =>
  db
    .prepare(
      `SELECT ALL Printer.id AS id FROM Printer WHERE Printer.bindKey = @bindKey ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ bindKey })?.id;

export const findPrinterWithComputer = (
  id: number,
): (PrinterBase & { computer: ComputerBase }) | undefined => {
  const printer = findPrinterById(id);
  if (!printer) return undefined;
  const computer = findComputerById(printer.computerId);
  assert(computer);
  return { ...printer, computer };
};

export const listPrintersByComputerId = (computerId: string): PrinterListItem[] =>
  db
    .prepare(
      `SELECT ALL Printer.id AS id, Printer.name AS name, Printer.enabled AS enabled FROM Printer WHERE Printer.computerId = @computerId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ computerId })
    .map((p) => ({ ...p, enabled: Boolean(p.enabled) }));

export const removePrinterById = (id: number) => {
  db.prepare(`DELETE FROM Printer WHERE Printer.id = @id`).run({ id });
};

// ── WeixinKfUserPrinter ──

export const listPrintersByWeixinKfUser = (
  externalUserId: string,
  kfid: string,
): PrinterWithComputerName[] => {
  const rows = db
    .prepare(
      `SELECT DISTINCT Printer.id AS id, Printer.name AS name, Printer.enabled AS enabled, Computer.name AS computerName FROM Printer INNER JOIN WeixinKfUserPrinter ON WeixinKfUserPrinter.printerId = Printer.id AND WeixinKfUserPrinter.kfid = @kfid INNER JOIN Computer ON Computer.id = Printer.computerId WHERE WeixinKfUserPrinter.weixinKfUserId = @externalUserId ORDER BY Printer.id LIMIT -1 OFFSET 0`,
    )
    .all({ externalUserId, kfid } as any);
  return rows.map(p => ({ ...p, enabled: Boolean(p.enabled) }));
};

export const isPrinterLinkedToWeixinKfUser = (
  externalUserId: string,
  printerId: number,
  kfid: string,
): boolean => {
  return db.prepare(
    `SELECT ALL weixinKfUserId FROM WeixinKfUserPrinter WHERE weixinKfUserId = @weixinKfUserId AND printerId = @printerId AND kfid = @kfid ORDER BY 1 LIMIT -1 OFFSET 0`,
  ).all({ weixinKfUserId: externalUserId, printerId, kfid }).length > 0;
};

export const linkPrinterToWeixinKfUser = (
  externalUserId: string,
  printerId: number,
  kfid: string,
) => {
  return db.prepare(
    `INSERT OR ABORT INTO WeixinKfUserPrinter (weixinKfUserId, printerId, kfid) VALUES (@weixinKfUserId, @printerId, @kfid)`,
  ).run({ weixinKfUserId: externalUserId, printerId, kfid });
};

export const unlinkPrinterFromWeixinKfUser = (
  externalUserId: string,
  printerId: number,
) => {
  db.prepare(
    `DELETE FROM WeixinKfUserPrinter WHERE WeixinKfUserPrinter.weixinKfUserId = @weixinKfUserId AND WeixinKfUserPrinter.printerId = @printerId`,
  ).run({ weixinKfUserId: externalUserId, printerId });
};

export const listWeixinKfUsersByPrinterId = (
  printerId: number,
): { externalUserId: string; nickname: string | null; avatar: string | null }[] => {
  const rows = db
    .prepare(
      `SELECT DISTINCT WeixinKfUser.externalUserId AS externalUserId, WeixinKfUser.nickname AS nickname, WeixinKfUser.avatar AS avatar FROM WeixinKfUser INNER JOIN WeixinKfUserPrinter ON WeixinKfUserPrinter.weixinKfUserId = WeixinKfUser.externalUserId WHERE WeixinKfUserPrinter.printerId = @printerId ORDER BY WeixinKfUser.externalUserId LIMIT -1 OFFSET 0`,
    )
    .all({ printerId });
  return rows;
};

// ── PrintTask ──

const withTaskDetails = (
  task: PrintTaskRow,
): PrintTaskBase & { printFiles: PrintFileBase[]; printer: PrinterBase } => {
  const printFiles = listPrintFilesByPrintTaskId(task.id);
  const printer = findPrinterById(task.printerId);
  assert(printer);
  return { ...task, printFiles, printer };
};

export const findPrintTaskById = (id: number): PrintTaskRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });

export const findPrintTaskWithPrinter = (
  id: number,
): (PrintTaskRow & { printer: PrinterBase }) | undefined => {
  const task = findPrintTaskById(id);
  if (!task) return undefined;
  const printer = db
    .prepare(
      `SELECT ALL Printer.id AS id, Printer.name AS name, Printer.computerId AS computerId, Printer.enabled AS enabled FROM Printer WHERE Printer.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id: task.printerId });
  assert(printer);
  return { ...task, printer: { ...printer, enabled: Boolean(printer.enabled) } };
};

export const findPrintTaskWithDetails = (
  id: number,
): (PrintTaskBase & { printFiles: PrintFileBase[]; printer: PrinterBase }) | undefined => {
  const task = findPrintTaskById(id);
  return task && withTaskDetails(task);
};

export const listWaitingConfirmationTasks = (
  externalUserId: string,
  weixinKfId: string,
): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.externalUserId = @externalUserId AND PrintTask.weixinKfId = @weixinKfId AND PrintTask.state = @state ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({
      externalUserId,
      weixinKfId,
      state: "waiting_confirmation",
    });

export const listPrintTasksByExternalUserIdAndState = (
  externalUserId: string,
  state: PrintTaskState,
): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.externalUserId = @externalUserId AND PrintTask.state = @state ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ externalUserId, state });

export const listPrintTasksByExternalUserId = (externalUserId: string): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.externalUserId = @externalUserId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ externalUserId });

export const listPrintTasksByExternalUserIdAndKfid = (externalUserId: string, kfid: string): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.externalUserId = @externalUserId AND PrintTask.weixinKfId = @kfid ORDER BY 1 DESC LIMIT -1 OFFSET 0`,
    )
    .all({ externalUserId, kfid });

export const listPrintTasksByPrinterId = (printerId: number): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.printerId = @printerId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ printerId });

export const updatePrintTaskPrinterId = (id: number, printerId: number) => {
  db.prepare(
    `UPDATE OR ABORT PrintTask SET printerId = @printerId WHERE PrintTask.id = @id`,
  ).run({ id, printerId });
};

export const updatePrintTaskState = (
  id: number,
  state: PrintTaskState,
) => {
  db.prepare(
    `UPDATE OR ABORT PrintTask SET state = @state WHERE PrintTask.id = @id`,
  ).run({ id, state });
};

export const insertPrintTask = (task: {
  id: number;
  state: PrintTaskState;
  weixinKfId: string;
  externalUserId: string;
  printerId: number;
}) => {
  db.prepare(
    `INSERT OR ABORT INTO PrintTask (id, state, weixinKfId, externalUserId, printerId) VALUES (@id, @state, @weixinKfId, @externalUserId, @printerId)`,
  ).run(task);
};

export const removePrintTaskById = (id: number) => {
  db.prepare(`DELETE FROM PrintTask WHERE PrintTask.id = @id`).run({ id });
};

export const listPrintTasksByState = (
  state: PrintTaskState,
): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.state = @state ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ state });

// ── PrintFile ──

export const findPrintFileById = (id: number): PrintFileBase | undefined => {
  const row = db
    .prepare(
      `SELECT ALL * FROM PrintFile WHERE PrintFile.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });
  return row && { ...row, duplex: Boolean(row.duplex), tumble: Boolean(row.tumble) };
};

export const updatePrintFileOptions = (
  id: number,
  duplex: boolean,
  tumble: boolean,
) => {
  db.prepare(
    `UPDATE OR ABORT PrintFile SET duplex = @duplex, tumble = @tumble WHERE PrintFile.id = @id`,
  ).run({ id, duplex: duplex ? 1 : 0, tumble: tumble ? 1 : 0 });
};

export const updatePrintFileState = (
  id: number,
  state: PrintFileState,
) => {
  db.prepare(
    `UPDATE OR ABORT PrintFile SET state = @state WHERE PrintFile.id = @id`,
  ).run({ id, state });
};

export const listPrintFilesByPrintTaskId = (
  printTaskId: number,
): PrintFileBase[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintFile WHERE PrintFile.printTaskId = @printTaskId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ printTaskId })
    .map((f) => ({ ...f, duplex: Boolean(f.duplex), tumble: Boolean(f.tumble) }));

export const listPrintFilesByPrintTaskIdAndState = (
  printTaskId: number,
  state: PrintFileState,
): PrintFileBase[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintFile WHERE PrintFile.printTaskId = @printTaskId AND PrintFile.state = @state ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ printTaskId, state })
    .map((f) => ({ ...f, duplex: Boolean(f.duplex), tumble: Boolean(f.tumble) }));

export const insertPrintFile = (file: {
  state: PrintFileState;
  printTaskId: number;
  fileId: string;
  filename: string;
  duplex: boolean;
  tumble: boolean;
}): number => {
  const result = db
    .prepare(
      `INSERT OR ABORT INTO PrintFile (state, printTaskId, fileId, filename, duplex, tumble) VALUES (@state, @printTaskId, @fileId, @filename, @duplex, @tumble)`,
    )
    .run({
      state: file.state,
      printTaskId: file.printTaskId,
      fileId: file.fileId,
      filename: file.filename,
      duplex: file.duplex ? 1 : 0,
      tumble: file.tumble ? 1 : 0,
    });
  return result.lastInsertRowid;
};

export const removePrintFilesByPrintTaskId = (printTaskId: number) => {
  db.prepare(
    `DELETE FROM PrintFile WHERE PrintFile.printTaskId = @printTaskId`,
  ).run({ printTaskId });
};