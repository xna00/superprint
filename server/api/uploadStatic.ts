import { WECOM_TOKEN } from "./constants.ts";
import { join } from "node:path";
import { rename, rm, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import UZIP from "uzip";
import { logger } from "../logger.ts";

const staticDir = join(import.meta.dirname, "..", "static");

export const _outUploadStatic = async (req: Request): Promise<Response> => {
  const token = req.headers.get("token");
  if (token !== WECOM_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backupDir = `${staticDir}.backup`;

  try {
    const arrayBuffer = await req.arrayBuffer();
    const unzipped = UZIP.parse(arrayBuffer);

    if (existsSync(backupDir)) {
      await rm(backupDir, { recursive: true, force: true });
    }

    if (existsSync(staticDir)) {
      await rename(staticDir, backupDir);
    }

    await mkdir(staticDir, { recursive: true });

    for (const [filename, data] of Object.entries(unzipped)) {
      if (filename.endsWith("/") || filename.endsWith("\\")) continue;

      const normalizedFilename = filename.replace(/\\/g, "/");
      const filePath = join(staticDir, normalizedFilename);
      const dir = join(filePath, "..");

      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(filePath, data);
    }

    return Response.json({ success: true, message: "Static files updated" });
  } catch (error) {
    logger.error("Upload static error:", error);

    if (!existsSync(staticDir) && existsSync(backupDir)) {
      try {
        await rename(backupDir, staticDir);
      } catch (e) {
        logger.error("Failed to restore backup:", e);
      }
    }

    return Response.json(
      {
        error: "Failed to process zip",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
