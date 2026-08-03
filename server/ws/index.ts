import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../logger.ts";

declare module "ws" {
  interface WebSocket {
    isAlive?: boolean;
  }
}

const wsMap: Record<string, WebSocket | undefined> = {};

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

const findWsComputerId = (ws: WebSocket): string | null => {
  for (const [computerId, socket] of Object.entries(wsMap)) {
    if (socket === ws) {
      return computerId;
    }
  }
  return null;
};

export const createWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server });

  const interval = setInterval(() => {
    const versionInfo = getVersionInfo();
    
    wss.clients.forEach((ws) => {
      const computerId = findWsComputerId(ws);
      
      if (ws.isAlive === false) {
        logger.log(`WebSocket 连接超时，设备ID: ${computerId}`);
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
      
      logger.log(`WebSocket ping 已发送，设备ID: ${computerId}`);
    });
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", async (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
      const computerId = findWsComputerId(ws);
      logger.log(`WebSocket pong 已收到，设备ID: ${computerId}`);
    });

    const computerId = req.headers["x-computer-id"] as string | undefined;

    if (!computerId) {
      logger.log("WebSocket 连接未携带 X-Computer-ID，关闭连接");
      ws.close();
      return;
    }

    wsMap[computerId] = ws;
    logger.log(`WebSocket 已连接，设备ID: ${computerId}`);

    ws.on("close", () => {
      if (wsMap[computerId] === ws) {
        delete wsMap[computerId];
      }
      logger.log(`WebSocket 已断开，设备ID: ${computerId}`);
    });

    ws.on("error", (error) => {
      logger.error(`WebSocket 错误，设备ID: ${computerId}`, error);
      if (wsMap[computerId] === ws) {
        delete wsMap[computerId];
      }
    });
  });
};

export const notifyCheckJobs = (computerId: string) => {
  const ws = wsMap[computerId];
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "check_jobs" }));
    logger.log(`已向设备 ${computerId} 发送 check_jobs 通知`);
  }
};