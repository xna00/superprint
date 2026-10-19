import { getInfo } from "./request-context.ts";

const ts = () => new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

export const logger = {
  log: (...args: unknown[]) => console.log(`[${ts()}]`, ...args),
  warn: (...args: unknown[]) => console.warn(`[${ts()}]`, ...args),
  error: (...args: unknown[]) => console.error(`[${ts()}]`, ...args),
  logWithId: (...args: unknown[]) => {
    const info = getInfo();
    console.log(`[${ts()}] [${info.id}]`, ...args);
  },
};
