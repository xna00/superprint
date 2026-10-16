import { spawn } from "node:child_process";
import { closeSync, copyFileSync, existsSync, openSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WECOM_TOKEN } from "./constants.ts";
import { logger } from "../logger.ts";

const repoDir = join(import.meta.dirname, "..", "..");
const deployScript = join(repoDir, "scripts", "server-deploy.sh");
const deployLog = join(repoDir, "deploy.log");
const deployStatus = join(repoDir, "deploy.status.json");

const readStatus = (): unknown => {
  try {
    return JSON.parse(readFileSync(deployStatus, "utf-8"));
  } catch {
    return null;
  }
};

const readTail = (lines: number): string => {
  try {
    return readFileSync(deployLog, "utf-8").split("\n").slice(-lines).join("\n");
  } catch {
    return "";
  }
};

/**
 * CI 构建通过后打过来的「部署通知」。
 *   POST -> 立刻 202，后台 detached 跑 scripts/server-deploy.sh（flock 防重入）
 *   GET  -> 上次部署的状态和日志尾巴，方便人工确认
 */
export const _outDeployHint = async (req: Request): Promise<Response> => {
  const token = req.headers.get("token");
  if (token !== WECOM_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (req.method === "GET") {
    return Response.json({ status: readStatus(), tail: readTail(50) });
  }

  if (!existsSync(deployScript)) {
    return Response.json({ error: `deploy script not found: ${deployScript}` }, { status: 500 });
  }

  // 先复制到 /tmp 再执行：脚本自己会 git pull，直接跑仓库里那份有「边拉边跑」的风险
  const scriptCopy = join(tmpdir(), `superprint-deploy-${Date.now()}.sh`);
  copyFileSync(deployScript, scriptCopy);

  const fd = openSync(deployLog, "a");
  const child = spawn("bash", [scriptCopy], {
    cwd: repoDir,
    detached: true,
    stdio: ["ignore", fd, fd],
    env: { ...process.env, SUPERPRINT_REPO: repoDir },
  });
  child.unref();
  closeSync(fd);

  logger.log(`deploy hint received, spawned pid=${child.pid}`);
  return Response.json({ started: true, pid: child.pid }, { status: 202 });
};
