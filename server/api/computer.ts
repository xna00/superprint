import {
  insertComputer,
  findComputerById,
  removeComputerById,
  updateComputerName,
  findPrinterByComputerIdAndName,
  findPrinterById,
  setPrinterEnabled,
  insertPrinter,
  removePrinterById,
  listPrintersByComputerId,
  listPrintTasksByPrinterId,
  ensurePrinterBindKey,
  regeneratePrinterBindKey as dbRegeneratePrinterBindKey,
  listWeixinKfUsersByPrinterId,
  unlinkPrinterFromWeixinKfUser,
} from "../models/db.ts";
import { ApiError } from "./utils.ts";
import { getInfo } from "./global.ts";
import { getKfBaseLink, PRINT_MAN_KF_OPEN_ID } from "./weixin/link.ts";

const VIRTUAL_PORTS = new Set([
  'PORTPROMPT:',
  'XPSPort:',
  'SHRFAX:',
  'nul:',
  'FILE:',
]);

const getComputerId = () => {
  const info = getInfo();
  const computerId = info.request.headers.get("x-computer-id");
  if (!computerId) {
    throw new ApiError(401, {}, "未授权设备");
  }
  return computerId;
};

const getExistingComputerId = () => {
  const computerId = getComputerId();
  if (!findComputerById(computerId)) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  return computerId;
};

export const addComputer = async (id: string, name: string) => {
  getComputerId();
  insertComputer(id, name);
  return { success: true };
};

export const removeComputer = async (id: string) => {
  getExistingComputerId();
  removeComputerById(id);
  return { success: true };
};

export const setComputerName = async (id: string, name: string) => {
  getExistingComputerId();
  updateComputerName(id, name);
  return { success: true };
};

export const addComputerPrinter = async (computerId: string, printerName: string) => {
  getExistingComputerId();
  const existingPrinter = findPrinterByComputerIdAndName(computerId, printerName);
  if (existingPrinter) {
    setPrinterEnabled(computerId, printerName, true);
    return { success: true, restored: true };
  }
  insertPrinter(printerName, computerId);
  return { success: true, restored: false };
};

export const removeComputerPrinter = async (computerId: string, printerName: string) => {
  getExistingComputerId();
  setPrinterEnabled(computerId, printerName, false);
  return { success: true };
};

export const computerInfo = async (computerId: string) => {
  getExistingComputerId();
  const printers = listPrintersByComputerId(computerId);
  const computer = findComputerById(computerId)!;
  return { ...computer, printers };
};

export const getPrinterKfLink = async (printerName: string) => {
  const computerId = getExistingComputerId();
  const printer = findPrinterByComputerIdAndName(computerId, printerName);
  if (!printer) {
    throw new ApiError(404, {}, "打印机不存在", "ENTITY_NOT_FOUND");
  }
  const bindKey = ensurePrinterBindKey(printer.id);
  const baseLink = await getKfBaseLink(PRINT_MAN_KF_OPEN_ID);
  return { link: `${baseLink}&scene_param=${encodeURIComponent(bindKey)}` };
};

export const regeneratePrinterBindKey = async (printerId: number) => {
  const computerId = getExistingComputerId();
  const printer = findPrinterById(printerId);
  if (!printer || printer.computerId !== computerId) {
    throw new ApiError(404, {}, "打印机不存在", "ENTITY_NOT_FOUND");
  }
  const bindKey = dbRegeneratePrinterBindKey(printer.id);
  const baseLink = await getKfBaseLink(PRINT_MAN_KF_OPEN_ID);
  return { link: `${baseLink}&scene_param=${encodeURIComponent(bindKey)}` };
};

export const listPrinterUsers = async (printerId: number) => {
  const computerId = getExistingComputerId();
  const printer = findPrinterById(printerId);
  if (!printer || printer.computerId !== computerId) {
    throw new ApiError(404, {}, "打印机不存在", "ENTITY_NOT_FOUND");
  }
  const users = listWeixinKfUsersByPrinterId(printerId);
  return { users };
};

export const removePrinterUser = async (printerId: number, externalUserId: string) => {
  const computerId = getExistingComputerId();
  const printer = findPrinterById(printerId);
  if (!printer || printer.computerId !== computerId) {
    throw new ApiError(404, {}, "打印机不存在", "ENTITY_NOT_FOUND");
  }
  unlinkPrinterFromWeixinKfUser(externalUserId, printerId);
  return { success: true };
};

export const syncPrinters = async (computerId: string, localPrinters: { name: string; port: string; driver: string }[]) => {
  getExistingComputerId();
  const serverPrinters = listPrintersByComputerId(computerId);
  const serverNames = new Set(serverPrinters.map(p => p.name));
  const localNames = new Set(localPrinters.map(p => p.name));

  for (const lp of localPrinters) {
    if (serverNames.has(lp.name)) continue;
    if (VIRTUAL_PORTS.has(lp.port)) continue;
    insertPrinter(lp.name, computerId);
  }

  for (const sp of serverPrinters) {
    if (localNames.has(sp.name)) continue;
    const refCount = listPrintTasksByPrinterId(sp.id).length;
    if (refCount > 0) {
      setPrinterEnabled(computerId, sp.name, false);
    } else {
      removePrinterById(sp.id);
    }
  }

  return { success: true };
};