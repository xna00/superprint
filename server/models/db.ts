import { DatabaseSync } from "node:sqlite";
import assert from "node:assert";
import { TypedDb, type SchemaFks, type ResolveFks } from "../typed-sql/typed-sql.ts";

const USER_SQL = `CREATE TABLE IF NOT EXISTS User (
id INTEGER NOT NULL PRIMARY KEY,
username TEXT NOT NULL UNIQUE,
password TEXT NOT NULL,
email TEXT UNIQUE
)`;

const WEIXIN_KF_SQL = `CREATE TABLE IF NOT EXISTS WeixinKf (
id TEXT NOT NULL PRIMARY KEY,
messageCursor TEXT NOT NULL
)`;

const WEIXIN_KF_USER_SQL = `CREATE TABLE IF NOT EXISTS WeixinKfUser (
externalUserId TEXT NOT NULL PRIMARY KEY,
userId INTEGER NOT NULL,

FOREIGN KEY (userId) REFERENCES User (id)
)`;

const COMPUTER_SQL = `CREATE TABLE IF NOT EXISTS Computer (
id TEXT NOT NULL PRIMARY KEY,
name TEXT NOT NULL,
userId INTEGER NOT NULL,

FOREIGN KEY (userId) REFERENCES User (id)
)`;

const PRINTER_SQL = `CREATE TABLE IF NOT EXISTS Printer (
id INTEGER NOT NULL PRIMARY KEY,
name TEXT NOT NULL,
computerId TEXT NOT NULL,
disabled INTEGER NOT NULL CHECK (disabled IN (0, 1)),

FOREIGN KEY (computerId) REFERENCES Computer (id)
)`;

const PRINT_TASK_SQL = `CREATE TABLE IF NOT EXISTS PrintTask (
id INTEGER NOT NULL PRIMARY KEY,
state TEXT NOT NULL CHECK (state IN ('waiting_confirmation', 'waiting_print', 'completed', 'failed')),
weixinKfId TEXT NOT NULL,
externalUserId TEXT NOT NULL,
userId INTEGER NOT NULL,
printerId INTEGER NOT NULL,

FOREIGN KEY (weixinKfId) REFERENCES WeixinKf (id),
FOREIGN KEY (userId) REFERENCES User (id),
FOREIGN KEY (printerId) REFERENCES Printer (id)
)`;

const PRINT_FILE_SQL = `CREATE TABLE IF NOT EXISTS PrintFile (
id INTEGER NOT NULL PRIMARY KEY,
state TEXT NOT NULL CHECK (state IN ('waiting_print', 'completed', 'failed')),
printTaskId INTEGER NOT NULL,
fileId TEXT NOT NULL,
filename TEXT NOT NULL,
duplex INTEGER NOT NULL CHECK (duplex IN (0, 1)),
tumble INTEGER NOT NULL CHECK (tumble IN (0, 1)),

FOREIGN KEY (printTaskId) REFERENCES PrintTask (id)
)`;

const ALL_DDL = [
  USER_SQL,
  WEIXIN_KF_SQL,
  WEIXIN_KF_USER_SQL,
  COMPUTER_SQL,
  PRINTER_SQL,
  PRINT_TASK_SQL,
  PRINT_FILE_SQL,
];

export type Tables = ResolveFks<
  SchemaFks<typeof USER_SQL> &
    SchemaFks<typeof WEIXIN_KF_SQL> &
    SchemaFks<typeof WEIXIN_KF_USER_SQL> &
    SchemaFks<typeof COMPUTER_SQL> &
    SchemaFks<typeof PRINTER_SQL> &
    SchemaFks<typeof PRINT_TASK_SQL> &
    SchemaFks<typeof PRINT_FILE_SQL>
>;

export type UserRow = Tables["User"];
export type WeixinKfRow = Tables["WeixinKf"];
export type WeixinKfUserRow = Tables["WeixinKfUser"];
export type ComputerRow = Tables["Computer"];
export type PrinterRow = Tables["Printer"];
export type PrintTaskRow = Tables["PrintTask"];
export type PrintFileRow = Tables["PrintFile"];

export type PrintTaskState = PrintTaskRow["state"];
export type PrintFileState = PrintFileRow["state"];

export type UserBase = UserRow;
export type ComputerBase = ComputerRow;
export type PrinterBase = Omit<PrinterRow, "disabled"> & { disabled: boolean };
export type PrintFileBase = Omit<PrintFileRow, "duplex" | "tumble"> & {
  duplex: boolean;
  tumble: boolean;
};
export type PrintTaskBase = PrintTaskRow;
export type UserInsert = Omit<UserRow, "id" | "email"> & {
  id?: number;
  email?: string | null;
};

const raw = new DatabaseSync("file:./dev.db");

export const db = new TypedDb<Tables>(raw);

export const init = () => {
  for (const sql of ALL_DDL) {
    raw.exec(sql);
  }
};

// ── User ──

export const findUserById = (id: number): UserRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM User WHERE User.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });

export const findUserByUsernamePassword = (
  username: string,
  password: string,
): UserRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM User WHERE User.username = @username AND User.password = @password ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ username, password });

export const insertUser = (
  username: string,
  password: string,
  email: string | null,
) => {
  db.prepare(
    `INSERT OR ABORT INTO User (username, password, email) VALUES (@username, @password, @email)`,
  ).run({ username, password, email });
};

// ── WeixinKf ──

export const findWeixinKfById = (id: string): WeixinKfRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM WeixinKf WHERE WeixinKf.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });

export const insertWeixinKf = (id: string, messageCursor: string) => {
  db.prepare(
    `INSERT OR ABORT INTO WeixinKf (id, messageCursor) VALUES (@id, @messageCursor)`,
  ).run({ id, messageCursor });
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

export const findWeixinKfUserWithUser = (
  externalUserId: string,
): (WeixinKfUserRow & { user: UserRow }) | undefined => {
  const row = findWeixinKfUserByExternalUserId(externalUserId);
  if (!row) return undefined;
  const user = findUserById(row.userId);
  assert(user);
  return { ...row, user };
};

export const insertWeixinKfUser = (
  externalUserId: string,
  userId: number,
) => {
  db.prepare(
    `INSERT OR ABORT INTO WeixinKfUser (externalUserId, userId) VALUES (@externalUserId, @userId)`,
  ).run({ externalUserId, userId });
};

export const updateWeixinKfUserUserId = (
  externalUserId: string,
  userId: number,
) => {
  db.prepare(
    `UPDATE OR ABORT WeixinKfUser SET userId = @userId WHERE WeixinKfUser.externalUserId = @externalUserId`,
  ).run({ externalUserId, userId });
};

export const removeWeixinKfUserByExternalUserId = (externalUserId: string) => {
  db.prepare(
    `DELETE FROM WeixinKfUser WHERE WeixinKfUser.externalUserId = @externalUserId`,
  ).run({ externalUserId });
};

export const findWeixinKfUserByUserId = (
  userId: number,
): WeixinKfUserRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM WeixinKfUser WHERE WeixinKfUser.userId = @userId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ userId });

// ── Computer ──

export const insertComputer = (id: string, name: string, userId: number) => {
  db.prepare(
    `INSERT OR ABORT INTO Computer (id, name, userId) VALUES (@id, @name, @userId)`,
  ).run({ id, name, userId });
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

export const listComputersByUserId = (userId: number): ComputerRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM Computer WHERE Computer.userId = @userId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ userId });

export const listComputersWithPrinters = (
  userId: number,
): (ComputerRow & { printers: PrinterBase[] })[] =>
  listComputersByUserId(userId).map((c) => ({
    ...c,
    printers: listPrintersByComputerId(c.id),
  }));

// ── Printer ──

export const insertPrinter = (name: string, computerId: string) => {
  db.prepare(
    `INSERT OR ABORT INTO Printer (name, computerId, disabled) VALUES (@name, @computerId, @disabled)`,
  ).run({ name, computerId, disabled: 0 });
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

export const setPrinterDisabled = (
  computerId: string,
  name: string,
  disabled: boolean,
) => {
  db.prepare(
    `UPDATE OR ABORT Printer SET disabled = @disabled WHERE Printer.computerId = @computerId AND Printer.name = @name`,
  ).run({ computerId, name, disabled: disabled ? 1 : 0 });
};

export const findPrinterById = (id: number): PrinterBase | undefined => {
  const row = db
    .prepare(
      `SELECT ALL * FROM Printer WHERE Printer.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });
  return row && { ...row, disabled: Boolean(row.disabled) };
};

export const findPrinterWithComputer = (
  id: number,
): (PrinterBase & { computer: ComputerBase }) | undefined => {
  const printer = findPrinterById(id);
  if (!printer) return undefined;
  const computer = findComputerById(printer.computerId);
  assert(computer);
  return { ...printer, computer };
};

export const listPrintersByComputerId = (computerId: string): PrinterBase[] =>
  db
    .prepare(
      `SELECT ALL * FROM Printer WHERE Printer.computerId = @computerId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ computerId })
    .map((p) => ({ ...p, disabled: Boolean(p.disabled) }));

// ── PrintTask ──

const withTaskDetails = (
  task: PrintTaskRow,
): PrintTaskBase & { printFiles: PrintFileBase[]; printer: PrinterBase } => {
  const printFiles = listPrintFilesByPrintTaskId(task.id);
  const printer = findPrinterById(task.printerId);
  assert(printer);
  return { ...task, printFiles, printer };
};

export const listPrintTasksWithDetails = (
  userId: number,
  opts?: { state?: PrintTaskState; printerIds?: number[] },
): (PrintTaskBase & { printFiles: PrintFileBase[]; printer: PrinterBase })[] => {
  let tasks: PrintTaskRow[];
  if (opts?.state) {
    tasks = db
      .prepare(
        `SELECT ALL * FROM PrintTask WHERE PrintTask.userId = @userId AND PrintTask.state = @state ORDER BY 1 LIMIT -1 OFFSET 0`,
      )
      .all({ userId, state: opts.state });
  } else {
    tasks = db
      .prepare(
        `SELECT ALL * FROM PrintTask WHERE PrintTask.userId = @userId ORDER BY 1 LIMIT -1 OFFSET 0`,
      )
      .all({ userId });
  }
  if (opts?.printerIds) {
    tasks = tasks.filter((t) => opts.printerIds!.includes(t.printerId));
  }
  return tasks.map(withTaskDetails);
};

export const findPrintTaskById = (id: number): PrintTaskRow | undefined =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id });

export const findPrintTaskWithPrinter = (
  id: number,
): (PrintTaskRow & { printer: PrinterRow }) | undefined => {
  const task = findPrintTaskById(id);
  if (!task) return undefined;
  const printer = db
    .prepare(
      `SELECT ALL * FROM Printer WHERE Printer.id = @id ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .get({ id: task.printerId });
  assert(printer);
  return { ...task, printer };
};

export const findPrintTaskWithDetails = (
  id: number,
): (PrintTaskBase & { printFiles: PrintFileBase[]; printer: PrinterBase }) | undefined => {
  const task = findPrintTaskById(id);
  return task && withTaskDetails(task);
};

export const listWaitingConfirmationTasks = (
  userId: number,
  weixinKfId: string,
  externalUserId: string,
): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.userId = @userId AND PrintTask.weixinKfId = @weixinKfId AND PrintTask.externalUserId = @externalUserId AND PrintTask.state = @state ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({
      userId,
      weixinKfId,
      externalUserId,
      state: "waiting_confirmation",
    });

export const listPrintTasksByUserIdAndState = (
  userId: number,
  state: PrintTaskState,
): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.userId = @userId AND PrintTask.state = @state ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ userId, state });

export const listPrintTasksByUserId = (userId: number): PrintTaskRow[] =>
  db
    .prepare(
      `SELECT ALL * FROM PrintTask WHERE PrintTask.userId = @userId ORDER BY 1 LIMIT -1 OFFSET 0`,
    )
    .all({ userId });

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
  userId: number;
  printerId: number;
}) => {
  db.prepare(
    `INSERT OR ABORT INTO PrintTask (id, state, weixinKfId, externalUserId, userId, printerId) VALUES (@id, @state, @weixinKfId, @externalUserId, @userId, @printerId)`,
  ).run(task);
};

export const removePrintTaskById = (id: number) => {
  db.prepare(`DELETE FROM PrintTask WHERE PrintTask.id = @id`).run({ id });
};

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
