import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { decryptString } from "../api/utils.ts";
import { PrintJob } from "../models/index.ts";

const wsMap = new Map<number, WebSocket>();

export const createWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server });
  wss.on("connection", async (ws, req) => {
    const cookie = req.headers.cookie || "";
    const tokenMatch = cookie.match(/token=([^;]+)/);

    if (!tokenMatch) {
      console.log("WebSocket 连接未携带 token，关闭连接");
      ws.close();
      return;
    }

    const token = tokenMatch[1];

    try {
      const userId = await decryptString(token);
      const id = parseInt(userId);

      wsMap.set(id, ws);
      console.log(`WebSocket 已连接，用户ID: ${id}`);

      const waitingJobs = PrintJob.findBy({
        userId: id,
        state: "waiting_print",
      });
      if (waitingJobs.length > 0) {
        ws.send(JSON.stringify({ type: "check_jobs" }));
      }

      ws.on("close", () => {
        wsMap.delete(id);
        console.log(`WebSocket 已断开，用户ID: ${id}`);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket 错误，用户ID: ${id}`, error);
        wsMap.delete(id);
      });
    } catch (error) {
      console.error("WebSocket token 解析失败:", error);
      ws.close();
    }
  });
};

export const notifyCheckJobs = (userId: number) => {
  const ws = wsMap.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "check_jobs" }));
    console.log(`已向用户 ${userId} 发送 check_jobs 通知`);
  }
};
