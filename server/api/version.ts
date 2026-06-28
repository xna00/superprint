import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const staticDir = join(import.meta.dirname, "..", "static");

function sha1(buf: Buffer): string {
  return createHash("sha1").update(buf).digest("hex");
}

function readOrNull(p: string): Buffer | null {
  try { return readFileSync(p) } catch { return null }
}

interface VersionInfo {
  version: string;
  exe: string;
  setupexe: string;
}

export const check = (currentVersion: string): { version?: string; downloadUrls?: string[]; message?: string } => {
  const jsonPath = join(staticDir, "printdriver.json");

  if (!existsSync(jsonPath)) {
    return {};
  }

  try {
    const content = readFileSync(jsonPath, "utf-8");
    const info: VersionInfo = JSON.parse(content);

    if (!info.version || !info.setupexe) {
      return {};
    }

    if (info.version !== currentVersion) {
      const versionedSetup = `Setup-${info.version}.exe`;
      return {
        version: info.version,
        downloadUrls: [`https://superprint.xna00.top/${versionedSetup}`],
        message: `发现新版本 ${info.version}`,
      };
    }

    return {
      version: info.version,
      message: '已是最新版本'
    };
  } catch {
    return {};
  }
};

const cdnBases = [
  "https://superprint6.xna00.top",
  "https://superprint.xna00.top",
];

export const checkDriverUpdate = (body: {
  exeHash: string;
  mainJsHash: string;
  entryJsHash: string;
}) => {
  const dir = join(staticDir, "printdriver");

  const exeBuf = readOrNull(join(dir, "QuickSuperPrint.exe"));
  const mainJsBuf = readOrNull(join(dir, "main.js"));
  const entryJsBuf = readOrNull(join(dir, "entry.js"));

  const t = Date.now();
  return {
    exeDownloadUrls: exeBuf && body.exeHash !== sha1(exeBuf)
      ? cdnBases.map((b) => `${b}/printdriver/QuickSuperPrint.exe?t=${t}`)
      : [],
    mainJsDownloadUrls: mainJsBuf && body.mainJsHash !== sha1(mainJsBuf)
      ? cdnBases.map((b) => `${b}/printdriver/main.js?t=${t}`)
      : [],
    entryJsChanged: !!(entryJsBuf && body.entryJsHash !== sha1(entryJsBuf)),
  };
};
