# Rules

## ⚠️ 最重要的规则（违反会导致严重后果）

只有用户明确要求时才 commit 和 push。**绝对不能自动 commit**。每次 commit/push 都必须先问用户或等用户明确指示。

## 提交前校验（pre-commit hook）

- 仓库自带 `.githooks/pre-commit`，每次 commit 前跑**根目录的 `npm run build`**；不通过就阻止提交。
- hook 由 `scripts/install-hooks.mjs` 在 `npm install` / `npm ci` 时通过根 `package.json` 的 `prepare` 自动挂上（设 `core.hooksPath=.githooks`），**不要改成 husky / lefthook**，也不要手动 `git config` 之外另建一套。
- 逃生舱只有 `SKIP_PRECOMMIT=1 git commit ...`（HTTPS 紧急提交用）。用完之后必须补跑一次 `npm run build`。
- 根 `npm run build` = `npm run typecheck --workspaces` + `npm run build --workspaces`，**顺序不能反**：`server` 的 typecheck 就是它的 d.ts emit + `strip-types.ts`，`api`/`printdriver-quickwin` 的类型解析要靠这份产物；反过来跑，干净克隆上 printdriver 会去解析 server 源码并撞 `allowImportingTsExtensions`。

### 各 workspace 的 build 约定（避免 tsc 跑两遍）

- `server`：**没有 `build` 脚本**。唯一一遍 `tsc --emitDeclarationOnly` 在 `typecheck` 里，顺带产出 `dist/**/*.d.ts` 并原地 strip 掉 node/undici 类型，供 `api`、`printdriver-quickwin` 消费。别再加回 `build`，也别给它加 `--noCheck`（那样 `server` 就完全失去类型检查）。
- `api`：`build` = `tsc --noCheck`（只 emit，不重复检查），`typecheck` = `tsc --noEmit`。
- `web`：`build` = `vite build`（`tsconfig.*.json` 都是 `noEmit`，原来的 `tsc -b` 一个字节都不产出，纯属重复检查，已删），`typecheck` = `tsc -b --noEmit`。
- `printdriver-quickwin`：`build` 全是 vite + 产物断言 + 塞图标，不含 tsc；`typecheck` = `tsc --noEmit`。

## 类型安全

- 保证类型安全。**非万不得已不要用 `as`、`any`、`@ts-ignore`、`@ts-expect-error`、`!` 非空断言之类破坏或绕过类型检查的手段。**
- 真绕不开时（例如第三方 `.d.ts` 声明冲突），把 `as` 压到最小范围并写明原因；不要用它掩盖类型设计问题，更不要把整个文件/函数放宽成 `any`。
- 每次改完先跑根 `npm run build`（含全仓 typecheck），别只跑单个 workspace。

## Icon (ICO) 生成

- 源文件：`printdriver-quickwin/assets/icon.svg`（带渐变：打印机蓝色渐变 + 闪电黄橙渐变）
- 生成脚本：`printdriver-quickwin/scripts/generate-icon.js`
- 使用 `sharp`（基于 librsvg）渲染 SVG 为 16/32/48/64 PNG，再用 `png-to-ico` 合成 ICO
- 手动运行：`npm run generate-icon`（在 `printdriver-quickwin` 目录）
- 产物 `icon.ico` 提交到仓库，`postbuild.js` 用 `resedit`（纯 JS）把它写进 exe 的 `RT_ICON`/`RT_GROUP_ICON`（图标组 ID 0 / lang 1033，与旧 rcedit 行为一致）
- 注意：ImageMagick 的 SVG 渲染器不支持 `<linearGradient>`，导致渐变丢失，所以不能用 `convert` 生成 ICO
- 注意：不要改回 `rcedit`（Windows 原生没事，但 Linux/服务器上要借 wine，没 wine 就没图标，且 CI 与服务器产物 sha1 不一致）；`SKIP_ICON=1` 可以临时跳过塞图标
