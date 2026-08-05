# Rules

## ⚠️ 最重要的规则（违反会导致严重后果）

只有用户明确要求时才 commit 和 push。**绝对不能自动 commit**。每次 commit/push 都必须先问用户或等用户明确指示。

## Icon (ICO) 生成

- 源文件：`printdriver-quickwin/assets/icon.svg`（带渐变：打印机蓝色渐变 + 闪电黄橙渐变）
- 生成脚本：`printdriver-quickwin/scripts/generate-icon.js`
- 使用 `sharp`（基于 librsvg）渲染 SVG 为 16/32/48/64 PNG，再用 `png-to-ico` 合成 ICO
- 手动运行：`npm run generate-icon`（在 `printdriver-quickwin` 目录）
- 产物 `icon.ico` 提交到仓库，`postbuild.js` 中的 `rcedit` 直接使用它
- 注意：ImageMagick 的 SVG 渲染器不支持 `<linearGradient>`，导致渐变丢失，所以不能用 `convert` 生成 ICO
