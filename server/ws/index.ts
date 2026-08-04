import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../logger.ts";
import { findComputerById } from "../models/db.ts";

declare module "ws" {
  interface WebSocket {
    isAlive?: boolean;
  }
}

type WsEntry = {
  ws: WebSocket;
  name: string;
};

const wsMap: Record<string, WsEntry | undefined> = {};

const HEARTBEAT_INTERVAL = 30000;

const staticDir = join(import.meta.dirname, "..", "static");

const getVersionInfo = (): { version: string; setupexe: string } | null => {
  const jsonPath = join(staticDir, "printdriver.json");
  if (!existsSync(jsonPath)) return null;
  try {
    const content = readFileSync(jsonPath, "utf-8");
    const info = JSON.parse(content);
    if (info.version && info.setupexe) return info;
    return null;
  } catch {
    return null;
  }
};

const findWsInfo = (ws: WebSocket): { id: string; name: string } | null => {
  for (const [computerId, entry] of Object.entries(wsMap)) {
    if (entry?.ws === ws) {
      return { id: computerId, name: entry.name };
    }
  }
  return null;
};

const logPrefix = (info: { id: string; name: string } | null): string => {
  if (!info) return '设备ID: null';
  return `计算机: ${info.name} (${info.id.slice(0, 6)}...)`;
};

export const createWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server });

  const interval = setInterval(() => {
    const versionInfo = getVersionInfo();
    
    wss.clients.forEach((ws) => {
      const wsInfo = findWsInfo(ws);
      
      if (ws.isAlive === false) {
        logger.log(`WebSocket 连接超时，${logPrefix(wsInfo)}`);
        ws.terminate();
        return;
      }

      ws.isAlive = false;
      ws.ping();
      
      const heartbeatMsg: { type: string; version?: string } = { type: "heartbeat" };
      if (versionInfo) {
        heartbeatMsg.version = versionInfo.version;
      }
      ws.send(JSON.stringify(heartbeatMsg));
      
      logger.log(`WebSocket ping 已发送，${logPrefix(wsInfo)}`);
    });
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", async (ws, req) => {
    ws.isAlive = true;

    const computerId = req.headers["x-computer-id"] as string | undefined;

    if (!computerId) {
      logger.log("WebSocket 连接未携带 X-Computer-ID，关闭连接");
      ws.close();
      return;
    }

    const computer = findComputerById(computerId)
    const computerName = computer?.name ?? '未知'
    wsMap[computerId] = { ws, name: computerName };
    logger.log(`WebSocket 已连接，${logPrefix({ id: computerId, name: computerName })}`);

    ws.on("pong", () => {
      ws.isAlive = true;
      const wsInfo = findWsInfo(ws);
      logger.log(`WebSocket pong 已收到，${logPrefix(wsInfo)}`);
    });

    ws.on("close", () => {
      const entry = wsMap[computerId];
      if (entry?.ws === ws) {
        delete wsMap[computerId];
      }
      logger.log(`WebSocket 已断开，${logPrefix({ id: computerId, name: computerName })}`);
    });

    ws.on("error", (error) => {
      const wsInfo = findWsInfo(ws);
      logger.error(`WebSocket 错误，${logPrefix(wsInfo)}`, error);
      if (wsMap[computerId]?.ws === ws) {
        delete wsMap[computerId];
      }
    });
  });
};

export const notifyCheckJobs = (computerId: string) => {
  const entry = wsMap[computerId];
  if (entry && entry.ws.readyState === WebSocket.OPEN) {
    entry.ws.send(JSON.stringify({ type: "check_jobs" }));
    logger.log(`已向设备 ${computerId} 发送 check_jobs 通知`);
  }
};