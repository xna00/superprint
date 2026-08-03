import {
  insertComputer,
  findComputerById,
  removeComputerById,
  updateComputerName,
  findPrinterByComputerIdAndName,
  setPrinterDisabled,
  insertPrinter,
  listPrintersByComputerId,
} from "../models/db.ts";
import { ApiError, decryptString } from "./utils.ts";
import { getInfo } from "./global.ts";

const getExternalUserId = async () => {
  const info = getInfo();
  const cookie = info.request.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  if (!tokenMatch) throw new ApiError(401, {}, "未登录！");
  return await decryptString(tokenMatch[1]);
};

export const addComputer = async (id: string, name: string) => {
  await getExternalUserId();
  insertComputer(id, name);
  return { success: true };
};

export const removeComputer = async (id: string) => {
  await getExternalUserId();
  const computer = findComputerById(id);
  if (!computer) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  removeComputerById(id);
  return { success: true };
};

export const setComputerName = async (id: string, name: string) => {
  await getExternalUserId();
  const computer = findComputerById(id);
  if (!computer) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  updateComputerName(id, name);
  return { success: true };
};

export const addComputerPrinter = async (computerId: string, printerName: string) => {
  await getExternalUserId();
  const computer = findComputerById(computerId);
  if (!computer) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  const existingPrinter = findPrinterByComputerIdAndName(computerId, printerName);
  if (existingPrinter) {
    setPrinterDisabled(computerId, printerName, false);
    return { success: true, restored: true };
  }
  insertPrinter(printerName, computerId);
  return { success: true, restored: false };
};

export const removeComputerPrinter = async (computerId: string, printerName: string) => {
  await getExternalUserId();
  const computer = findComputerById(computerId);
  if (!computer) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  setPrinterDisabled(computerId, printerName, true);
  return { success: true };
};

export const computerInfo = async (computerId: string) => {
  await getExternalUserId();
  const computer = findComputerById(computerId);
  if (!computer) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  const printers = listPrintersByComputerId(computerId).filter((p) => !p.disabled);
  return { ...computer, printers };
};