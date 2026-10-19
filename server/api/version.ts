import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const staticDir = join(import.meta.dirname, "..", "static");

function sha1(buf: Buffer): string {
  return createHash("sha1").update(buf).digest("hex");
}

function readOrNull(p: string): Buffer | null {
  try { return readFileSync(p) } catch { return null }
}

const cdnBases = [
  "https://superprint.112287.xyz",
  "https://superprint.xna00.top",
];

export const checkDriverUpdate = (body: {
  exeHash: string;
  entryJsHash: string;
  updateExeHash: string;
}) => {
  const dir = join(staticDir, "printdriver");

  const exeBuf = readOrNull(join(dir, "QuickSuperPrint.exe"));
  const entryJsBuf = readOrNull(join(dir, "entry.js"));
  const updateExeBuf = readOrNull(join(dir, "QuickSuperPrint_Setup.exe"));

  const t = Date.now();
  return {
    exeDownloadUrls: exeBuf && body.exeHash !== sha1(exeBuf)
      ? cdnBases.map((b) => `${b}/printdriver/QuickSuperPrint.exe?t=${t}`)
      : [],
    entryJsChanged: !!(entryJsBuf && body.entryJsHash !== sha1(entryJsBuf)),
    updateExeDownloadUrls: updateExeBuf && body.updateExeHash !== sha1(updateExeBuf)
      ? cdnBases.map((b) => `${b}/printdriver/QuickSuperPrint_Setup.exe?t=${t}`)
      : [],
  };
};
