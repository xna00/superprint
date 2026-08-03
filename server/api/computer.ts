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
import { _currentUser } from "./user.ts";
import { ApiError } from "./utils.ts";

export const addComputer = async (id: string, name: string) => {
  const user = await _currentUser();
  insertComputer(id, name, user.id);
  return { success: true };
};

export const removeComputer = async (id: string) => {
  const user = await _currentUser();
  const computer = findComputerById(id);
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  removeComputerById(id);
  return { success: true };
};

export const setComputerName = async (id: string, name: string) => {
  const user = await _currentUser();
  const computer = findComputerById(id);
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  updateComputerName(id, name);
  return { success: true };
};

export const addComputerPrinter = async (computerId: string, printerName: string) => {
  const user = await _currentUser();
  const computer = findComputerById(computerId);
  if (!computer || computer.userId !== user.id) {
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
  const user = await _currentUser();
  const computer = findComputerById(computerId);
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  setPrinterDisabled(computerId, printerName, true);
  return { success: true };
};

export const computerInfo = async (computerId: string) => {
  const user = await _currentUser();
  const computer = findComputerById(computerId);
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  const printers = listPrintersByComputerId(computerId).filter((p) => !p.disabled);
  return { ...computer, printers };
};
