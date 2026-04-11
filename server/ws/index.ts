import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { decryptString } from "../api/utils.ts";
import { PrintJob } from "../models/index.ts";

declare module "ws" {
  interface WebSocket {
    isAlive?: boolean;
  }
}

const wsMap: Record<number, Record<string, WebSocket | undefined> | undefined> = {};

const HEARTBEAT_INTERVAL = 30000;

export const createWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log("WebSocket 连接超时");
        ws.terminate();
        return;
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", async (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
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

export const notifyCheckJobs = (userId: number) => {
  const userSockets = wsMap[userId];
  if (userSockets) {
    for (const ws of Object.values(userSockets)) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "check_jobs" }));
      }
    }
    console.log(`已向用户 ${userId} 的所有设备发送 check_jobs 通知`);
  }
};
