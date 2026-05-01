import { DatabaseSync, type StatementResultingChanges } from 'node:sqlite'
import assert from "node:assert";

type CreateModel<T, KEYS extends string> = Omit<T, KEYS> & {
  [K in KEYS & keyof T]?: T[K];
};
 type Criteria<T> = {
[K in keyof T]:
 | T[K]
| (null extends T[K] ? Exclude<T[K], null>[] : T[K][])
 | { __raw: true; condition: string };
};

type Normal = Record<string, string | number | boolean | null>

export const makeRawCond = (cond: string) => ({ __raw: true, condition: cond} as const);

const normalizeValue = (
value: string | number | boolean
) => typeof value === "string" ? `'${value}'` : `${value}`;

const makeWhere = (
criteria: Partial<Criteria<Normal>>
) => {
const kvs = Object.entries(criteria).filter(
([_, value]) => value !== undefined
);

const where = kvs
.map(([key, value]) => {
assert(value !== undefined);
if (value === null) {
return `${key} IS NULL`;
} else if (typeof value === "boolean") {
return `${key} = ${Number(value)}`;
} else if (typeof value === "number" || typeof value === "string") {
return `${key} = ${normalizeValue(value)}`;
} else if (Array.isArray(value)) {
return `${key} IN (${value
.map((v) => normalizeValue(v)

)
.join(", ")})`;
} else {
return `(${value.condition})`;
}
})
.join(" AND ");

return where === "" ? "" : " WHERE " + where;
};

const makeSet = (patch: Normal) => Object.entries(patch) .filter(([_, v]) => v !== undefined) .map(([k, v]) => [k, "=", v === null ? "NULL" : normalizeValue(v)].join(" "));

type N<T extends string> = T extends `${infer U}[]` ? U : T;
type Rel<T extends string> = TypeMap[`${T}Rel` & keyof TypeMap];
type Cas<T extends string> = Rel<T> extends infer R extends Record<string, string>
? {
[K in keyof R]?: boolean | Cas<N<R[K]>>;
}
: never;

type Index<T, K> = T[K & keyof T];
type OmitNever<T> = {
[K in keyof T as T[K] extends never ? never : K]: T[K]
};

type DeepPick<NN extends string, C> = OmitNever<{
[P in keyof C]: C[P] extends false | undefined
? never
: Index<Index<TypeMap, NN>, P> extends infer FieldType extends string
? N<FieldType> extends infer ModelName extends string
? Index<
TypeMap,
`${ModelName}Base` & keyof TypeMap
> extends infer BaseType
? C[P] extends true
? FieldType extends `${string}[]`
? BaseType[]
: BaseType
: BaseType &
DeepPick<
`${N<Index<Index<TypeMap, NN>, P> & string>}Rel`,
C[P]
> extends infer R
? FieldType extends `${string}[]`
? R[]
: R
: never
: never
: never
: never;
}>;

const filterKeys = (fields: string[], obj: any) => Object.fromEntries(fields.map(f => [f, obj[f]]).filter(([_, v]) => v !== undefined))
const remove = (modelName: string, fields: string[], criteria: Partial<Criteria<Normal>>) => db.prepare("DELETE FROM " + modelName + " " + makeWhere(filterKeys(fields, criteria))).run()

const update = (modelName: string, fields: string[], criteria: Partial<Criteria<Normal>>, patch: Normal) => db .prepare( "UPDATE " + modelName + " SET " + makeSet(filterKeys(fields, patch)) + makeWhere(filterKeys(fields, criteria))).run();
export type UserBase = {
id: number,
username: string,
password: string,
email: string | null
}
export type UserRel = {
weixinKfUsers: "WeixinKfUser[]",
computers: "Computer[]"
}
export type User = UserBase & UserRel

export type WeixinKfBase = {
id: string,
messageCursor: string
}
export type WeixinKfRel = {
printTasks: "PrintTask[]"
}
export type WeixinKf = WeixinKfBase & WeixinKfRel

export type WeixinKfUserBase = {
externalUserId: string,
userId: number
}
export type WeixinKfUserRel = {
user: "User"
}
export type WeixinKfUser = WeixinKfUserBase & WeixinKfUserRel

export type ComputerBase = {
id: string,
name: string,
userId: number
}
export type ComputerRel = {
user: "User",
printers: "Printer[]"
}
export type Computer = ComputerBase & ComputerRel

export type PrinterBase = {
id: number,
name: string,
computerId: string,
disabled: boolean
}
export type PrinterRel = {
computer: "Computer",
printTasks: "PrintTask[]"
}
export type Printer = PrinterBase & PrinterRel

export type PrintTaskBase = {
id: number,
state: string,
weixinKfId: string,
userId: number,
printerId: number
}
export type PrintTaskRel = {
weixinKf: "WeixinKf",
printFiles: "PrintFile[]",
user: "User",
printer: "Printer"
}
export type PrintTask = PrintTaskBase & PrintTaskRel

export type PrintFileBase = {
id: number,
state: string,
printTaskId: number,
fileId: string,
filename: string,
duplex: boolean,
tumble: boolean
}
export type PrintFileRel = {
printTask: "PrintTask"
}
export type PrintFile = PrintFileBase & PrintFileRel

type TypeMap = {
UserBase: UserBase;
UserRel: UserRel;
User: User;
WeixinKfBase: WeixinKfBase;
WeixinKfRel: WeixinKfRel;
WeixinKf: WeixinKf;
WeixinKfUserBase: WeixinKfUserBase;
WeixinKfUserRel: WeixinKfUserRel;
WeixinKfUser: WeixinKfUser;
ComputerBase: ComputerBase;
ComputerRel: ComputerRel;
Computer: Computer;
PrinterBase: PrinterBase;
PrinterRel: PrinterRel;
Printer: Printer;
PrintTaskBase: PrintTaskBase;
PrintTaskRel: PrintTaskRel;
PrintTask: PrintTask;
PrintFileBase: PrintFileBase;
PrintFileRel: PrintFileRel;
PrintFile: PrintFile;
}
const db = new DatabaseSync('file:./dev.db');

export const init = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS User
(id INTEGER NOT NULL  PRIMARY KEY,
username TEXT NOT NULL UNIQUE ,
password TEXT NOT NULL  ,
email TEXT  UNIQUE )`)
db.exec(`CREATE TABLE IF NOT EXISTS WeixinKf
(id TEXT NOT NULL  PRIMARY KEY,
messageCursor TEXT NOT NULL  )`)
db.exec(`CREATE TABLE IF NOT EXISTS WeixinKfUser
(externalUserId TEXT NOT NULL  PRIMARY KEY,
userId INTEGER NOT NULL  ,
FOREIGN KEY (userId) REFERENCES User (id))`)
db.exec(`CREATE TABLE IF NOT EXISTS Computer
(id TEXT NOT NULL  PRIMARY KEY,
name TEXT NOT NULL  ,
userId INTEGER NOT NULL  ,
FOREIGN KEY (userId) REFERENCES User (id))`)
db.exec(`CREATE TABLE IF NOT EXISTS Printer
(id INTEGER NOT NULL  PRIMARY KEY,
name TEXT NOT NULL  ,
computerId TEXT NOT NULL  ,
disabled BOOLEAN NOT NULL  ,
FOREIGN KEY (computerId) REFERENCES Computer (id))`)
db.exec(`CREATE TABLE IF NOT EXISTS PrintTask
(id INTEGER NOT NULL  PRIMARY KEY,
state TEXT NOT NULL  ,
weixinKfId TEXT NOT NULL  ,
userId INTEGER NOT NULL  ,
printerId INTEGER NOT NULL  ,
FOREIGN KEY (weixinKfId) REFERENCES WeixinKf (id),
FOREIGN KEY (userId) REFERENCES User (id),
FOREIGN KEY (printerId) REFERENCES Printer (id))`)
db.exec(`CREATE TABLE IF NOT EXISTS PrintFile
(id INTEGER NOT NULL  PRIMARY KEY,
state TEXT NOT NULL  ,
printTaskId INTEGER NOT NULL  ,
fileId TEXT NOT NULL  ,
filename TEXT NOT NULL  ,
duplex BOOLEAN NOT NULL  ,
tumble BOOLEAN NOT NULL  ,
FOREIGN KEY (printTaskId) REFERENCES PrintTask (id))`)

}
export type UserCriteria = Partial<Criteria<UserBase>>
export type UserInsert = CreateModel<UserBase, "id" | "email">
const UserBaseFields = ["id", "username", "password", "email"]
export const User = {
  findBy: <T extends Cas<"User"> = {}>(criteria: UserCriteria, relation?: T extends Cas<"User"> ? T : never) => {
    return [] as unknown as (UserBase & DeepPick<"UserRel", T>)[]
  },
  findOne: <T extends Cas<"User"> = {}>(criteria: UserCriteria, relation?: T extends Cas<"User"> ? T : never) => {
    return User.findBy(criteria, relation).at(0)
  },
  insert: (data: UserInsert[]) => ({} as StatementResultingChanges),
  remove: (criteria: Partial<Criteria<UserBase>>) => remove("User", UserBaseFields, criteria),
  update: <T extends Partial<UserBase>>(criteria: {} extends T ? never : Partial<Criteria<UserBase>>, patch: T) => update("User", UserBaseFields, criteria, patch)
};
export type WeixinKfCriteria = Partial<Criteria<WeixinKfBase>>
export type WeixinKfInsert = CreateModel<WeixinKfBase, never>
const WeixinKfBaseFields = ["id", "messageCursor"]
export const WeixinKf = {
  findBy: <T extends Cas<"WeixinKf"> = {}>(criteria: WeixinKfCriteria, relation?: T extends Cas<"WeixinKf"> ? T : never) => {
    return [] as unknown as (WeixinKfBase & DeepPick<"WeixinKfRel", T>)[]
  },
  findOne: <T extends Cas<"WeixinKf"> = {}>(criteria: WeixinKfCriteria, relation?: T extends Cas<"WeixinKf"> ? T : never) => {
    return WeixinKf.findBy(criteria, relation).at(0)
  },
  insert: (data: WeixinKfInsert[]) => ({} as StatementResultingChanges),
  remove: (criteria: Partial<Criteria<WeixinKfBase>>) => remove("WeixinKf", WeixinKfBaseFields, criteria),
  update: <T extends Partial<WeixinKfBase>>(criteria: {} extends T ? never : Partial<Criteria<WeixinKfBase>>, patch: T) => update("WeixinKf", WeixinKfBaseFields, criteria, patch)
};
export type WeixinKfUserCriteria = Partial<Criteria<WeixinKfUserBase>>
export type WeixinKfUserInsert = CreateModel<WeixinKfUserBase, never>
const WeixinKfUserBaseFields = ["externalUserId", "userId"]
export const WeixinKfUser = {
  findBy: <T extends Cas<"WeixinKfUser"> = {}>(criteria: WeixinKfUserCriteria, relation?: T extends Cas<"WeixinKfUser"> ? T : never) => {
    return [] as unknown as (WeixinKfUserBase & DeepPick<"WeixinKfUserRel", T>)[]
  },
  findOne: <T extends Cas<"WeixinKfUser"> = {}>(criteria: WeixinKfUserCriteria, relation?: T extends Cas<"WeixinKfUser"> ? T : never) => {
    return WeixinKfUser.findBy(criteria, relation).at(0)
  },
  insert: (data: WeixinKfUserInsert[]) => ({} as StatementResultingChanges),
  remove: (criteria: Partial<Criteria<WeixinKfUserBase>>) => remove("WeixinKfUser", WeixinKfUserBaseFields, criteria),
  update: <T extends Partial<WeixinKfUserBase>>(criteria: {} extends T ? never : Partial<Criteria<WeixinKfUserBase>>, patch: T) => update("WeixinKfUser", WeixinKfUserBaseFields, criteria, patch)
};
export type ComputerCriteria = Partial<Criteria<ComputerBase>>
export type ComputerInsert = CreateModel<ComputerBase, never>
const ComputerBaseFields = ["id", "name", "userId"]
export const Computer = {
  findBy: <T extends Cas<"Computer"> = {}>(criteria: ComputerCriteria, relation?: T extends Cas<"Computer"> ? T : never) => {
    return [] as unknown as (ComputerBase & DeepPick<"ComputerRel", T>)[]
  },
  findOne: <T extends Cas<"Computer"> = {}>(criteria: ComputerCriteria, relation?: T extends Cas<"Computer"> ? T : never) => {
    return Computer.findBy(criteria, relation).at(0)
  },
  insert: (data: ComputerInsert[]) => ({} as StatementResultingChanges),
  remove: (criteria: Partial<Criteria<ComputerBase>>) => remove("Computer", ComputerBaseFields, criteria),
  update: <T extends Partial<ComputerBase>>(criteria: {} extends T ? never : Partial<Criteria<ComputerBase>>, patch: T) => update("Computer", ComputerBaseFields, criteria, patch)
};
export type PrinterCriteria = Partial<Criteria<PrinterBase>>
export type PrinterInsert = CreateModel<PrinterBase, "id">
const PrinterBaseFields = ["id", "name", "computerId", "disabled"]
export const Printer = {
  findBy: <T extends Cas<"Printer"> = {}>(criteria: PrinterCriteria, relation?: T extends Cas<"Printer"> ? T : never) => {
    return [] as unknown as (PrinterBase & DeepPick<"PrinterRel", T>)[]
  },
  findOne: <T extends Cas<"Printer"> = {}>(criteria: PrinterCriteria, relation?: T extends Cas<"Printer"> ? T : never) => {
    return Printer.findBy(criteria, relation).at(0)
  },
  insert: (data: PrinterInsert[]) => ({} as StatementResultingChanges),
  remove: (criteria: Partial<Criteria<PrinterBase>>) => remove("Printer", PrinterBaseFields, criteria),
  update: <T extends Partial<PrinterBase>>(criteria: {} extends T ? never : Partial<Criteria<PrinterBase>>, patch: T) => update("Printer", PrinterBaseFields, criteria, patch)
};
export type PrintTaskCriteria = Partial<Criteria<PrintTaskBase>>
export type PrintTaskInsert = CreateModel<PrintTaskBase, "id">
const PrintTaskBaseFields = ["id", "state", "weixinKfId", "userId", "printerId"]
export const PrintTask = {
  findBy: <T extends Cas<"PrintTask"> = {}>(criteria: PrintTaskCriteria, relation?: T extends Cas<"PrintTask"> ? T : never) => {
    return [] as unknown as (PrintTaskBase & DeepPick<"PrintTaskRel", T>)[]
  },
  findOne: <T extends Cas<"PrintTask"> = {}>(criteria: PrintTaskCriteria, relation?: T extends Cas<"PrintTask"> ? T : never) => {
    return PrintTask.findBy(criteria, relation).at(0)
  },
  insert: (data: PrintTaskInsert[]) => ({} as StatementResultingChanges),
  remove: (criteria: Partial<Criteria<PrintTaskBase>>) => remove("PrintTask", PrintTaskBaseFields, criteria),
  update: <T extends Partial<PrintTaskBase>>(criteria: {} extends T ? never : Partial<Criteria<PrintTaskBase>>, patch: T) => update("PrintTask", PrintTaskBaseFields, criteria, patch)
};
export type PrintFileCriteria = Partial<Criteria<PrintFileBase>>
export type PrintFileInsert = CreateModel<PrintFileBase, "id">
const PrintFileBaseFields = ["id", "state", "printTaskId", "fileId", "filename", "duplex", "tumble"]
export const PrintFile = {
  findBy: <T extends Cas<"PrintFile"> = {}>(criteria: PrintFileCriteria, relation?: T extends Cas<"PrintFile"> ? T : never) => {
    return [] as unknown as (PrintFileBase & DeepPick<"PrintFileRel", T>)[]
  },
  findOne: <T extends Cas<"PrintFile"> = {}>(criteria: PrintFileCriteria, relation?: T extends Cas<"PrintFile"> ? T : never) => {
    return PrintFile.findBy(criteria, relation).at(0)
  },
  insert: (data: PrintFileInsert[]) => ({} as StatementResultingChanges),
  remove: (criteria: Partial<Criteria<PrintFileBase>>) => remove("PrintFile", PrintFileBaseFields, criteria),
  update: <T extends Partial<PrintFileBase>>(criteria: {} extends T ? never : Partial<Criteria<PrintFileBase>>, patch: T) => update("PrintFile", PrintFileBaseFields, criteria, patch)
};
  User.findBy = <T extends Cas<"User">>(criteria: UserCriteria, relation?: T extends Cas<"User"> ? T : never) => {
    const rels: Record<string, (row: any) => void> = { weixinKfUsers: (row) => {
row.weixinKfUsers = WeixinKfUser.findBy({userId: row.id}, typeof relation!["weixinKfUsers"] === "object" ? relation!["weixinKfUsers"] : undefined)
},
computers: (row) => {
row.computers = Computer.findBy({userId: row.id}, typeof relation!["computers"] === "object" ? relation!["computers"] : undefined)
} }
    let ret = db.prepare("SELECT * FROM User " + makeWhere(criteria)).all()
    ret = ret.map(row => {
      Object.entries(rels).forEach(([k, v]) => {
        if (relation && Object.keys(relation).includes(k)) {
        v(row)
      }
    })
      const _row = row as any
      
      return row
    })
    return ret as any
  }

  User.insert = (data: CreateModel<UserBase, "id" | "email">[]) => {
    const values_str = ",(?, ?, ?, ?)".repeat(data.length).slice(1)
    const stmt = db.prepare('INSERT INTO User (id, username, password, email) VALUES ' + values_str)
    const values = data.map(row => [row["id"] ?? null, row["username"], row["password"], row["email"] ?? null]).flat()
    return stmt.run(...values)
  }


  WeixinKf.findBy = <T extends Cas<"WeixinKf">>(criteria: WeixinKfCriteria, relation?: T extends Cas<"WeixinKf"> ? T : never) => {
    const rels: Record<string, (row: any) => void> = { printTasks: (row) => {
row.printTasks = PrintTask.findBy({weixinKfId: row.id}, typeof relation!["printTasks"] === "object" ? relation!["printTasks"] : undefined)
} }
    let ret = db.prepare("SELECT * FROM WeixinKf " + makeWhere(criteria)).all()
    ret = ret.map(row => {
      Object.entries(rels).forEach(([k, v]) => {
        if (relation && Object.keys(relation).includes(k)) {
        v(row)
      }
    })
      const _row = row as any
      
      return row
    })
    return ret as any
  }

  WeixinKf.insert = (data: CreateModel<WeixinKfBase, never>[]) => {
    const values_str = ",(?, ?)".repeat(data.length).slice(1)
    const stmt = db.prepare('INSERT INTO WeixinKf (id, messageCursor) VALUES ' + values_str)
    const values = data.map(row => [row["id"], row["messageCursor"]]).flat()
    return stmt.run(...values)
  }


  WeixinKfUser.findBy = <T extends Cas<"WeixinKfUser">>(criteria: WeixinKfUserCriteria, relation?: T extends Cas<"WeixinKfUser"> ? T : never) => {
    const rels: Record<string, (row: any) => void> = { user: (row) => {
const t = User.findBy({id: row.userId}).at(0)
assert(t)
row.user = t
} }
    let ret = db.prepare("SELECT * FROM WeixinKfUser " + makeWhere(criteria)).all()
    ret = ret.map(row => {
      Object.entries(rels).forEach(([k, v]) => {
        if (relation && Object.keys(relation).includes(k)) {
        v(row)
      }
    })
      const _row = row as any
      
      return row
    })
    return ret as any
  }

  WeixinKfUser.insert = (data: CreateModel<WeixinKfUserBase, never>[]) => {
    const values_str = ",(?, ?)".repeat(data.length).slice(1)
    const stmt = db.prepare('INSERT INTO WeixinKfUser (externalUserId, userId) VALUES ' + values_str)
    const values = data.map(row => [row["externalUserId"], row["userId"]]).flat()
    return stmt.run(...values)
  }


  Computer.findBy = <T extends Cas<"Computer">>(criteria: ComputerCriteria, relation?: T extends Cas<"Computer"> ? T : never) => {
    const rels: Record<string, (row: any) => void> = { user: (row) => {
const t = User.findBy({id: row.userId}).at(0)
assert(t)
row.user = t
},
printers: (row) => {
row.printers = Printer.findBy({computerId: row.id}, typeof relation!["printers"] === "object" ? relation!["printers"] : undefined)
} }
    let ret = db.prepare("SELECT * FROM Computer " + makeWhere(criteria)).all()
    ret = ret.map(row => {
      Object.entries(rels).forEach(([k, v]) => {
        if (relation && Object.keys(relation).includes(k)) {
        v(row)
      }
    })
      const _row = row as any
      
      return row
    })
    return ret as any
  }

  Computer.insert = (data: CreateModel<ComputerBase, never>[]) => {
    const values_str = ",(?, ?, ?)".repeat(data.length).slice(1)
    const stmt = db.prepare('INSERT INTO Computer (id, name, userId) VALUES ' + values_str)
    const values = data.map(row => [row["id"], row["name"], row["userId"]]).flat()
    return stmt.run(...values)
  }


  Printer.findBy = <T extends Cas<"Printer">>(criteria: PrinterCriteria, relation?: T extends Cas<"Printer"> ? T : never) => {
    const rels: Record<string, (row: any) => void> = { computer: (row) => {
const t = Computer.findBy({id: row.computerId}).at(0)
assert(t)
row.computer = t
},
printTasks: (row) => {
row.printTasks = PrintTask.findBy({printerId: row.id}, typeof relation!["printTasks"] === "object" ? relation!["printTasks"] : undefined)
} }
    let ret = db.prepare("SELECT * FROM Printer " + makeWhere(criteria)).all()
    ret = ret.map(row => {
      Object.entries(rels).forEach(([k, v]) => {
        if (relation && Object.keys(relation).includes(k)) {
        v(row)
      }
    })
      const _row = row as any
      _row["disabled"] = Boolean(_row["disabled"])
      return row
    })
    return ret as any
  }

  Printer.insert = (data: CreateModel<PrinterBase, "id">[]) => {
    const values_str = ",(?, ?, ?, ?)".repeat(data.length).slice(1)
    const stmt = db.prepare('INSERT INTO Printer (id, name, computerId, disabled) VALUES ' + values_str)
    const values = data.map(row => [row["id"] ?? null, row["name"], row["computerId"], Number(row["disabled"])]).flat()
    return stmt.run(...values)
  }


  PrintTask.findBy = <T extends Cas<"PrintTask">>(criteria: PrintTaskCriteria, relation?: T extends Cas<"PrintTask"> ? T : never) => {
    const rels: Record<string, (row: any) => void> = { weixinKf: (row) => {
const t = WeixinKf.findBy({id: row.weixinKfId}).at(0)
assert(t)
row.weixinKf = t
},
printFiles: (row) => {
row.printFiles = PrintFile.findBy({printTaskId: row.id}, typeof relation!["printFiles"] === "object" ? relation!["printFiles"] : undefined)
},
user: (row) => {
const t = User.findBy({id: row.userId}).at(0)
assert(t)
row.user = t
},
printer: (row) => {
const t = Printer.findBy({id: row.printerId}).at(0)
assert(t)
row.printer = t
} }
    let ret = db.prepare("SELECT * FROM PrintTask " + makeWhere(criteria)).all()
    ret = ret.map(row => {
      Object.entries(rels).forEach(([k, v]) => {
        if (relation && Object.keys(relation).includes(k)) {
        v(row)
      }
    })
      const _row = row as any
      
      return row
    })
    return ret as any
  }

  PrintTask.insert = (data: CreateModel<PrintTaskBase, "id">[]) => {
    const values_str = ",(?, ?, ?, ?, ?)".repeat(data.length).slice(1)
    const stmt = db.prepare('INSERT INTO PrintTask (id, state, weixinKfId, userId, printerId) VALUES ' + values_str)
    const values = data.map(row => [row["id"] ?? null, row["state"], row["weixinKfId"], row["userId"], row["printerId"]]).flat()
    return stmt.run(...values)
  }


  PrintFile.findBy = <T extends Cas<"PrintFile">>(criteria: PrintFileCriteria, relation?: T extends Cas<"PrintFile"> ? T : never) => {
    const rels: Record<string, (row: any) => void> = { printTask: (row) => {
const t = PrintTask.findBy({id: row.printTaskId}).at(0)
assert(t)
row.printTask = t
} }
    let ret = db.prepare("SELECT * FROM PrintFile " + makeWhere(criteria)).all()
    ret = ret.map(row => {
      Object.entries(rels).forEach(([k, v]) => {
        if (relation && Object.keys(relation).includes(k)) {
        v(row)
      }
    })
      const _row = row as any
      _row["duplex"] = Boolean(_row["duplex"])
_row["tumble"] = Boolean(_row["tumble"])
      return row
    })
    return ret as any
  }

  PrintFile.insert = (data: CreateModel<PrintFileBase, "id">[]) => {
    const values_str = ",(?, ?, ?, ?, ?, ?, ?)".repeat(data.length).slice(1)
    const stmt = db.prepare('INSERT INTO PrintFile (id, state, printTaskId, fileId, filename, duplex, tumble) VALUES ' + values_str)
    const values = data.map(row => [row["id"] ?? null, row["state"], row["printTaskId"], row["fileId"], row["filename"], Number(row["duplex"]), Number(row["tumble"])]).flat()
    return stmt.run(...values)
  }


