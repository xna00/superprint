import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const staticDir = join(import.meta.dirname, "..", "static");
const DOMAIN = "https://superprint.xna00.top";

interface VersionInfo {
  version: string;
  exe: string;
  setupexe: string;
}

interface HashResult {
  version?: string;
  exeDownloadUrls?: string[];
  setupDownloadUrls?: string[];
}

const calculateHash = (filePath: string): string | null => {
  if (!existsSync(filePath)) {
    return null;
  }
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
};

const findMatchingFiles = (baseName: string, version: string): string[] => {
  const files: string[] = [];
  const dir = staticDir;

  if (!existsSync(dir)) {
    return files;
  }

  const versionedName = baseName.replace(".exe", `-${version}.exe`);

  const allFiles = readdirSync(dir);

  for (const file of allFiles) {
    if (file === versionedName || file === baseName) {
      files.push(file);
    }
  }

  files.sort((a, b) => {
    if (a.includes(version) && !b.includes(version)) return -1;
    if (!a.includes(version) && b.includes(version)) return 1;
    return 0;
  });

  return files;
};

const toUrl = (filename: string): string => `${DOMAIN}/${filename}`;

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
      const versionedSetup = info.setupexe.replace(".exe", `-${info.version}.exe`);
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

export const checkByHash = (
  localHashes: { exe?: string; setup?: string }
): HashResult => {
  const jsonPath = join(staticDir, "printdriver.json");

  if (!existsSync(jsonPath)) {
    return {};
  }

  try {
    const content = readFileSync(jsonPath, "utf-8");
    const info: VersionInfo = JSON.parse(content);

    if (!info.version) {
      return {};
    }

    const result: HashResult = {
      version: info.version,
    };

    if (localHashes.exe) {
      const exeFiles = findMatchingFiles(info.exe, info.version);
      for (const file of exeFiles) {
        const fileHash = calculateHash(join(staticDir, file));
        if (fileHash && fileHash !== localHashes.exe) {
          result.exeDownloadUrls = result.exeDownloadUrls || [];
          result.exeDownloadUrls.push(toUrl(file));
        }
      }
    }

    if (localHashes.setup) {
      const setupFiles = findMatchingFiles(info.setupexe, info.version);
      for (const file of setupFiles) {
        const fileHash = calculateHash(join(staticDir, file));
        if (fileHash && fileHash !== localHashes.setup) {
          result.setupDownloadUrls = result.setupDownloadUrls || [];
          result.setupDownloadUrls.push(toUrl(file));
        }
      }
    }

    if (
      (!result.exeDownloadUrls || result.exeDownloadUrls.length === 0) &&
      (!result.setupDownloadUrls || result.setupDownloadUrls.length === 0)
    ) {
      return { version: info.version };
    }

    return result;
  } catch {
    return {};
  }
};
