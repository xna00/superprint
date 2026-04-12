# 项目代码规范

## Node.js / TypeScript

### 文件读取
- 静态文件服务使用 `createReadStream().pipe(res)` 流式传输
- 避免使用 `readFileSync` 将整个文件加载到内存

### Shell 命令
- npm scripts 中尽量使用简洁命令
- 避免在命令行中嵌入冗长的 node 脚本

## 版本控制
- 不要自动 commit，需要手动确认后再提交

## PrintDriver 构建
- 使用 Inno Setup 5 构建 installer（支持 MinVersion 6.0）
- Inno Setup 6 要求 MinVersion >= 6.1
