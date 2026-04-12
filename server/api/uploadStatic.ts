import { WECOM_TOKEN } from "./constants.ts";
import { join } from "node:path";
import { rename, rm, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import UZIP from "uzip";

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
      if (filename.endsWith("/")) continue;

      const filePath = join(staticDir, filename);
      const dir = join(filePath, "..");

      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(filePath, data);
    }

    return Response.json({ success: true, message: "Static files updated" });
  } catch (error) {
    console.error("Upload static error:", error);

    if (!existsSync(staticDir) && existsSync(backupDir)) {
      try {
        await rename(backupDir, staticDir);
      } catch (e) {
        console.error("Failed to restore backup:", e);
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
