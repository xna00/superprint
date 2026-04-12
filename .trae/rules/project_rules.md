# 项目代码规范

## Node.js / TypeScript

### 文件读取
- 静态文件服务使用 `createReadStream().pipe(res)` 流式传输
- 避免使用 `readFileSync` 将整个文件加载到内存

### Shell 命令
- npm scripts 中尽量使用简洁命令
- 避免在命令行中嵌入冗长的 node 脚本
