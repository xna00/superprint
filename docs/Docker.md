# WPS 转 PDF 容器（xna00/wps2pdf）

## 概述

- 镜像：`xna00/wps2pdf:latest`（Docker Hub，作者 xna00）
- 用途：基于 pywpsrpc（WPS Office RPC）的文档转 PDF 服务
- 本地容器名：`wps2pdf`，端口 `8080`
- superprint 通过 `POST http://localhost:8080/convert` 调用，失败时回退 LibreOffice（见 `server/api/weixin/download.ts` 的 `convertOfficeToPdf`）

## 拉取（国内加速）

```bash
# 通过毫秒镜像加速拉取，再打回原标签
docker pull docker.1ms.run/xna00/wps2pdf:latest
docker tag docker.1ms.run/xna00/wps2pdf:latest xna00/wps2pdf:latest
```

## 启动（API 模式，后台常驻）

```bash
docker run -d \
  --name wps2pdf \
  --restart unless-stopped \
  -p 8080:8080 \
  -e MODE=api \
  xna00/wps2pdf
```

## 接口

| 接口 | 说明 |
| --- | --- |
| `GET /health` | 健康检查（含 wps/wpp/et 三组件状态） |
| `POST /convert` | multipart 上传 `file=<文档>`，返回 `application/pdf` |

> `wps`/`wpp`/`et` 状态为 `not_initialized` 属正常：组件懒加载，首次转换时才初始化。

环境变量：`HOST`（默认 0.0.0.0）、`PORT`（默认 8080）、`MAX_FILE_MB`（默认 50）、`MODE`（`cli` 或 `api`）。

CLI 模式：`docker run --rm -v $PWD:/data xna00/wps2pdf [input.docx] [output.pdf]`

## 支持格式（按组件路由）

- WPS Writer：docx doc wps rtf txt xml html htm mht mhtml odt uot uof dot dotx
- WPP 演示：pptx ppt dps pot potx odp uop pps ppsx
- ET 表格：xlsx xls et csv ods uos xlt xltx ett prn dif

## 常见操作

```bash
docker ps                                  # 查看状态
docker logs wps2pdf                         # 查看日志
docker restart wps2pdf                      # 重启
docker stop wps2pdf && docker start wps2pdf # 停止/启动
docker rm -f wps2pdf                        # 删除容器
```

## 升级镜像

```bash
docker pull docker.1ms.run/xna00/wps2pdf:latest
docker tag docker.1ms.run/xna00/wps2pdf:latest xna00/wps2pdf:latest
docker rm -f wps2pdf
docker run -d --name wps2pdf --restart unless-stopped -p 8080:8080 -e MODE=api xna00/wps2pdf
# 验证：curl -m 120 -X POST localhost:8080/convert -F "file=@test.docx" -o out.pdf
```

## 注意事项

- 重启后服务需数秒就绪，立即请求会连接失败，属正常
- **重启 vs 重建**：`docker restart` 保留容器可写层状态（/tmp 等残留）；`docker rm + docker run` 丢弃可写层、回到镜像初始状态。旧版镜像存在"重启后 WPS 引擎初始化失败（`getApplication: 0x80000008`），重建后恢复"的问题，新版本镜像已修复
- 镜像为 Docker Hub 用户镜像，无官方 README，使用说明在容器内 `entrypoint.sh` 头部注释
