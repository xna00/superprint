import { existsSync, statSync, unlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { logger } from "../logger.ts"
import { convertWithWpsApi } from "./weixin/download.ts"

// 每 5 分钟真实转换一次一份小 docx，用来保活 WPS 后端并探活整条转换链路。
// 只看 /health 是发现不了问题的：转发层活着但 wps_backend 不可达时它照样返回 HTTP 200。

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROBE_DOCX = join(__dirname, "../scripts/wps-probe.docx")
const PROBE_OUT = join(tmpdir(), "wps2pdf-probe.pdf")
const INTERVAL = 5 * 60 * 1000

// 冷启动的转换可能很慢，一轮没跑完就跳过本次，避免堆积
let inFlight = false

const probeOnce = async (): Promise<void> => {
  if (inFlight) {
    logger.log("[wps2pdf-probe] 上一轮还没结束，跳过本次")
    return
  }
  if (!existsSync(PROBE_DOCX)) {
    logger.error(`[wps2pdf-probe] 探测文件不存在: ${PROBE_DOCX}`)
    return
  }

  inFlight = true
  const start = Date.now()
  try {
    const ok = await convertWithWpsApi(PROBE_DOCX, PROBE_OUT)
    const ms = Date.now() - start
    if (ok) {
      let size = 0
      try { size = statSync(PROBE_OUT).size } catch { /* 忽略 */ }
      logger.log(`[wps2pdf-probe] OK ${ms}ms ${size}B`)
    } else {
      logger.error(`[wps2pdf-probe] FAIL ${ms}ms (所有地址/重试都失败)`)
    }
  } catch (e) {
    logger.error(`[wps2pdf-probe] FAIL ${Date.now() - start}ms`, e)
  } finally {
    try { unlinkSync(PROBE_OUT) } catch { /* 忽略 */ }
    inFlight = false
  }
}

export const startWps2PdfProbe = (): void => {
  logger.log(`[wps2pdf-probe] 已启动, 每 ${INTERVAL / 60000} 分钟转换一次`)
  void probeOnce()
  setInterval(() => { void probeOnce() }, INTERVAL)
}
