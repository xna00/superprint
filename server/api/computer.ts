import { Computer, Printer } from "../models/index.ts";
import { _currentUser } from "./user.ts";
import { ApiError } from "./utils.ts";

export const addComputer = async (id: string, name: string) => {
  const user = await _currentUser();
  Computer.insert([{ id, name, userId: user.id }]);
  return { success: true };
};

export const removeComputer = async (id: string) => {
  const user = await _currentUser();
  const computer = Computer.findOne({ id });
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  Computer.remove({ id });
  return { success: true };
};

export const setComputerName = async (id: string, name: string) => {
  const user = await _currentUser();
  const computer = Computer.findOne({ id });
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  Computer.update({ id }, { name });
  return { success: true };
};

export const addComputerPrinter = async (computerId: string, printerName: string) => {
  const user = await _currentUser();
  const computer = Computer.findOne({ id: computerId });
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  
  const existingPrinter = Printer.findOne({ computerId, name: printerName });
  if (existingPrinter) {
    Printer.update({ computerId, name: printerName }, { disabled: false });
    return { success: true, restored: true };
  }
  
  Printer.insert([{ name: printerName, computerId, disabled: false }]);
  return { success: true, restored: false };
};

export const removeComputerPrinter = async (computerId: string, printerName: string) => {
  const user = await _currentUser();
  const computer = Computer.findOne({ id: computerId });
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  Printer.update({ computerId, name: printerName }, { disabled: true });
  return { success: true };
};

export const computerInfo = async (computerId: string) => {
  const user = await _currentUser();
  const computer = Computer.findOne({ id: computerId }, { printers: true });
  if (!computer || computer.userId !== user.id) {
    throw new ApiError(404, {}, "计算机不存在", "ENTITY_NOT_FOUND");
  }
  return computer;
};
