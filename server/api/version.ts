import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const staticDir = join(import.meta.dirname, "..", "static");

interface VersionInfo {
  version: string;
  exe: string;
  setupexe: string;
}

export const check = (currentVersion: string): { downloadUrl?: string; message?: string } => {
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
      const versionedSetup = `PrintDriver-Setup-${info.version}.exe`;
      return {
        downloadUrl: `https://superprint.xna00.top/${versionedSetup}`,
        message: `发现新版本 ${info.version}`,
      };
    }
    
    return {};
  } catch {
    return {};
  }
};
