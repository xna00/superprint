import { existsSync, statSync, unlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { logger } from "../logger.ts"
import { convertWithWpsApi } from "./weixin/download.ts"

// 每 1 分钟真实转换一次一份小 docx，用来保活 WPS 后端并探活整条转换链路。
// 只看 /health 没用：转发层活着但 wps_backend 不可达时它照样返回 HTTP 200。
// 一次探测内失败会隔一会儿再试；整轮失败后间隔加倍（最多 5 分钟），成功回到 1 分钟。
// 轮次串行跑（上一轮结束才排下一轮），不会并发打爆后端。

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROBE_DOCX = join(__dirname, "../scripts/wps-probe.docx")
const PROBE_OUT = join(tmpdir(), "wps2pdf-probe.pdf")

const INTERVAL = 60 * 1000            // 正常间隔
const MAX_BACKOFF = 5 * 60 * 1000     // 连续失败时的退避上限
const PROBE_RETRY_DELAYS = [5000, 10000]   // 一次探测内，失败后隔多久再试
const MAX_TRIES = PROBE_RETRY_DELAYS.length + 1

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

let nextDelay = INTERVAL

const probeOnce = async (): Promise<boolean> => {
  if (!existsSync(PROBE_DOCX)) {
    logger.error(`[wps2pdf-probe] 探测文件不存在: ${PROBE_DOCX}`)
    return false
  }

  const start = Date.now()
  let ok = false
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    // 每次只试 1 次，重试节奏由这里控制，不复用 convertWithWpsApi 自带的快速重试
    ok = await convertWithWpsApi(PROBE_DOCX, PROBE_OUT, 1, [])
    if (ok) break
    const delay = PROBE_RETRY_DELAYS[attempt - 1]
    if (delay !== undefined) {
      logger.log(`[wps2pdf-probe] 第 ${attempt}/${MAX_TRIES} 次失败，${delay / 1000}s 后再试`)
      await sleep(delay)
    }
  }

  const ms = Date.now() - start
  let size = 0
  if (ok) {
    try { size = statSync(PROBE_OUT).size } catch { /* 忽略 */ }
  }
  try { unlinkSync(PROBE_OUT) } catch { /* 忽略 */ }

  if (ok) {
    logger.log(`[wps2pdf-probe] OK ${ms}ms ${size}B`)
  } else {
    logger.error(`[wps2pdf-probe] FAIL ${ms}ms (${MAX_TRIES} 次都失败)`)
  }
  return ok
}

const run = async (): Promise<void> => {
  let ok = false
  try {
    ok = await probeOnce()
  } catch (e) {
    logger.error("[wps2pdf-probe] 未预期异常", e)
  }
  nextDelay = ok ? INTERVAL : Math.min(nextDelay * 2, MAX_BACKOFF)
  if (nextDelay !== INTERVAL) {
    logger.log(`[wps2pdf-probe] 下次检查延后到 ${nextDelay / 1000}s`)
  }
  setTimeout(() => { void run() }, nextDelay)
}

export const startWps2PdfProbe = (): void => {
  logger.log(
    `[wps2pdf-probe] 已启动, 每 ${INTERVAL / 1000}s 一次; ` +
    `失败后 ${PROBE_RETRY_DELAYS.map((d) => `${d / 1000}s`).join(" / ")} 间隔重试, ` +
    `整轮失败退避到 ${MAX_BACKOFF / 1000}s 封顶`,
  )
  void run()
}
