import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { decryptString } from "../api/utils.ts";
import { PrintJob } from "../models/index.ts";

declare module "ws" {
  interface WebSocket {
    isAlive?: boolean;
  }
}

const wsMap: Record<number, Record<string, WebSocket | undefined> | undefined> = {};

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

const findWsInfo = (ws: WebSocket): { userId: number; computerId: string } | null => {
  for (const [userId, computers] of Object.entries(wsMap)) {
    if (!computers) continue;
    for (const [computerId, socket] of Object.entries(computers)) {
      if (socket === ws) {
        return { userId: Number(userId), computerId };
      }
    }
  }
  return null;
};

export const createWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server });

  const interval = setInterval(() => {
    const versionInfo = getVersionInfo();
    
    wss.clients.forEach((ws) => {
      const info = findWsInfo(ws);
      
      if (ws.isAlive === false) {
        console.log(`WebSocket 连接超时，用户ID: ${info?.userId}, 设备ID: ${info?.computerId}`);
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
      
      console.log(`WebSocket ping 已发送，用户ID: ${info?.userId}, 设备ID: ${info?.computerId}`);
    });
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", async (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
      const info = findWsInfo(ws);
      console.log(`WebSocket pong 已收到，用户ID: ${info?.userId}, 设备ID: ${info?.computerId}`);
    });

    const cookie = req.headers.cookie || "";
    const tokenMatch = cookie.match(/token=([^;]+)/);

    if (!tokenMatch) {
      console.log("WebSocket 连接未携带 token，关闭连接");
      ws.close();
      return;
    }

    const token = tokenMatch[1];
    const computerId = req.headers["x-computer-id"] as string | undefined;

    if (!computerId) {
      console.log("WebSocket 连接未携带 X-Computer-ID，关闭连接");
      ws.close();
      return;
    }

    try {
      const userId = await decryptString(token);
      const id = parseInt(userId);

      wsMap[id] ??= {};
      wsMap[id][computerId] = ws;
      console.log(`WebSocket 已连接，用户ID: ${id}, 设备ID: ${computerId}`);

      const waitingJobs = PrintJob.findBy({
        userId: id,
        state: "waiting_print",
      });
      if (waitingJobs.length > 0) {
        ws.send(JSON.stringify({ type: "check_jobs" }));
      }

      ws.on("close", () => {
        if (wsMap[id]) {
          delete wsMap[id]![computerId];
          if (Object.keys(wsMap[id]!).length === 0) {
            delete wsMap[id];
          }
        }
        console.log(`WebSocket 已断开，用户ID: ${id}, 设备ID: ${computerId}`);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket 错误，用户ID: ${id}, 设备ID: ${computerId}`, error);
        if (wsMap[id]) {
          delete wsMap[id]![computerId];
          if (Object.keys(wsMap[id]!).length === 0) {
            delete wsMap[id];
          }
        }
      });
    } catch (error) {
      console.error("WebSocket token 解析失败:", error);
      ws.close();
    }
  });
};

export const notifyCheckJobs = (userId: number, computerId?: string) => {
  const userSockets = wsMap[userId];
  if (!userSockets) return;

  if (computerId) {
    const ws = userSockets[computerId];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "check_jobs" }));
      console.log(`已向用户 ${userId} 设备 ${computerId} 发送 check_jobs 通知`);
    }
  } else {
    for (const ws of Object.values(userSockets)) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "check_jobs" }));
      }
    }
    console.log(`已向用户 ${userId} 的所有设备发送 check_jobs 通知`);
  }
};
