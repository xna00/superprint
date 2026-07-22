# printdriver-quickwin 代码优化清单

## P1 — 正确性 / 竞态

- [ ] `print-worker.ts:462` — `var isLandscape` 用在 try 块内，hoisting 导致可能复用上一轮的值，改为 `let`
- [ ] `update.ts:33-42` — `hashWorker` 被覆盖，旧 worker 结果丢失，需加锁或复用
- [ ] `ws.ts:66` — WS 连接超时 timer 没有在成功时 clear，泄漏
- [ ] `ws.ts:87-88` — cleanupWs 没有取消重连 timer

## P2 — 热路径性能

- [ ] `print-worker.ts:105-115` — MuPDF 像素 RGB→BGR 逐字节循环 ~9M 次，改 Uint32Array 批量 swap
- [ ] `utils.ts:9` — `strToWideBuf` 每次 new TextEncoder，缓存到模块级
- [ ] `storage.ts:7-11` — `storagePath()` 每次读写重新计算，缓存结果
- [ ] `device.ts:27` — `getDeviceId()` 每次读注册表，首次成功后缓存

## P3 — 重复代码 / 死代码

- [ ] `print-worker.ts:53,177` — `makeBitmapInfo` / `makeBitmapInfo32` 几乎相同，合并为 `makeBitmapInfo(w, h, bpp)`
- [ ] `print-worker.ts:401,448` — PDFium/MuPDF 页面循环脚手架重复，提取公共函数
- [ ] `install.ts:44,60,73,86,98` — 每个 helper 都重新 LoadLibrary kernel32，模块级加载一次
- [ ] `config.ts:11` — `API_BASE_URL` 未使用，删除
- [ ] `config.ts:14` — `DOWNLOAD_FOLDER` 未使用，删除
- [ ] `config.ts:16-18` — WS 常量未使用，删除或统一引用
- [ ] `config.ts:20` — `RENDER_DPI` 未使用，storage.ts 默认值引用它
- [ ] `App.tsx:130-132` — syncPrinters N+1 串行 API 调用，改 Promise.all

## P4 — 内存泄漏

- [ ] `update.ts:35-38` — hashWorker 没有 terminate，只置 null
- [ ] `main.tsx:63-64` — destroyPrintWorker 先 null onmessage 再 postMessage，顺序反了

## P5 — 代码质量

- [ ] `App.tsx:21,204-207` — QRTestTab import 但注释掉了，删掉
- [ ] `App.tsx:23` — 空接口 AppProps，删除
- [ ] `device.ts:86` — `charCount` 计算了但没用，删除
- [ ] `logger.ts:2` / `App.tsx:40` — UTC+8 硬编码重复，提取共享常量
- [ ] `update.ts:143-145` — 多余的大括号块，删除
- [ ] `install.ts:363-365` — 手动逐字节字符串编码，改 TextEncoder
- [ ] `storage.ts:31` — `?? null` 冗余，删除

---

## P6 — 类型安全

- [ ] `App.tsx:134` — `api.computer.computerInfo(devId) as any`，定义 `ComputerInfoResponse` 接口
- [ ] `main.tsx:187` — `new os.Worker() as any as PrintWorker` 双重断言，封装 Worker 适配器
- [ ] `entry.ts:10` — `info as any`，定义 Vite manifest entry 接口
- [ ] `logger.ts:7,10` — `any[]` 改 `unknown[]`
- [ ] `device.ts:74` — HKEY 用 `FFI_TYPE_UINT32` 传递，64 位下应为 `FFI_TYPE_POINTER`
- [ ] `install.ts:132-134` — `gui.HKey.CURRENT_USER` 用 `FFI_TYPE_UINT32` 传递，同上

## P7 — 代码复用

- [ ] `install.ts:44,60,73,86,98` — kernel32.dll 5 次 LoadLibrary，模块级加载一次
- [ ] `install.ts:53-56,66-68,79-81` — `GetLastError` 重复解析，提取共享 `gle()` 函数
- [ ] `components/InstallApp.tsx:52-57` / `UninstallApp.tsx:55-60` — `prefix()` 重复，提取到共享工具
- [ ] `components/InstallApp.tsx:18-50` / `UninstallApp.tsx:18-53` — 步骤执行 React 模式重复，提取 `StepRunner` hook
- [ ] `install.ts:296,303,309,321,339` — 安装目录路径重复计算 5 次，模块级常量
- [ ] `logger.ts:2` / `App.tsx:40` — UTC+8 时区转换重复，提取 `toCST()` 工具函数
- [ ] `config.ts:18` / `ws.ts:12` — `WS_TIMEOUT` 重复定义，统一引用

## P8 — 错误处理

- [ ] `hash-worker.ts:18` — 文件读取错误静默返回空 hash，应标记失败
- [ ] `storage.ts:19` — JSON 解析错误静默重置为空对象，应恢复备份或提示
- [ ] `api.ts:33` — 请求失败只打 URL 不打错误对象，丢失调试信息
- [ ] `api.ts:36` — `throw lastErr`，如果 `API_BASE_URLS` 为空则 `throw undefined`
- [ ] `install.ts:317` — `installStepStartMenu` 无条件返回 true，mkdirW 失败时不报告
- [ ] `device.ts:80` / `install.ts:145` — `RegCloseKey` 返回值丢弃，key 可能泄漏

## P9 — React 模式

- [ ] `App.tsx:47-49` — `useEffect(() => { setLogger(addLog) }, [])` 依赖数组缺 `addLog`
- [ ] `App.tsx:163` — `os.setTimeout(checkUser, 500)` 未在 unmount 时 clear
- [ ] `App.tsx:71,96` — `os.setTimeout(() => connectWs(...), 500)` 未清理
- [ ] `update.ts:38` — hashWorker 无 `onerror` handler，worker 崩溃则 Promise 永远 hang

## P10 — 死代码

- [ ] `config.ts:11` — `API_BASE_URL` 未使用
- [ ] `config.ts:14` — `DOWNLOAD_FOLDER` 未使用
- [ ] `config.ts:22` — `PROJECT_VERSION` 未使用
- [ ] `main.tsx:11` — `WorkerInMsg` type import 未使用
