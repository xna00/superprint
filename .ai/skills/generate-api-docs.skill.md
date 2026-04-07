# 生成 API 文档 Skill

## 概述

本 skill 用于为 superprint 项目生成 API 接口文档，输出到 `web/dist/api.md`。

## 前提

1. 项目使用自定义 API 框架（handler.ts）
2. API 函数在 `server/api/` 目录下
3. 请求参数通过 URL 的 `data` 查询参数或 JSON body 传递

## 生成步骤

### 1. 分析 API 路由规则

查看 `server/api/handler.ts`，关键逻辑：

```typescript
const parseFn = (req: Request): [fn: any, fnName: string] => {
  const pathname = new URL(req.url).pathname;
  const segs = pathname.split("/").slice(2);
  const fnName = segs[segs.length - 1];
  
  // 判断规则：
  // - get 开头函数 + GET 方法
  // - POST 方法
  // - _out 开头函数（内部调用）
  if (
    !(
      (fnName.startsWith("get") && req.method === "GET") ||
      req.method === "POST" || fnName.startsWith("_out")
    )
  ) {
    return [null, fnName] as const;
  }
  const fn = segs.reduce((prev, curr) => (prev as any)?.[curr], api);
  return [fn, fnName] as const;
};
```

**关键规则：**
- 函数名以 `get` 开头 → GET 请求
- 其他函数 → POST 请求

### 2. 参数解析规则

```typescript
if (req.method === "POST") params = await req.json();
else if (req.method === "GET")
  params = JSON.parse(new URL(req.url).searchParams.get("data") ?? "");

// 然后用展开操作符传给函数
const tmp = fn(...params);
```

**关键规则：**
- GET: 参数放在 URL 的 `data` 查询参数中，如 `?data=["param1","param2"]`
- POST: 直接传 JSON 数组，如 `["param1","param2"]`
- 服务端用 `JSON.parse` 解析后用展开操作符 `...` 传给函数

### 3. 查找所有 API 函数

```bash
grep -r "export const" server/api/*.ts
```

或查看 `server/api/index.ts` 导出模块。

### 4. 读取函数签名

读取每个 API 函数的实现，记录：
- 函数名
- 参数列表（用于生成请求参数示例）
- 返回值（用于生成响应示例）

### 5. 写入文档

创建 `web/dist/api.md`，格式：

```markdown
# 超级打印 API 接口文档

## 基础信息
- 基础 URL: `/api/`
- 请求方式: 根据函数名决定（get 开头用 GET，其他用 POST）
- 认证方式: Cookie (token)
- 响应格式: JSON

## 模块接口

### 模块名

#### 接口名
```
METHOD /api/module/functionName
```

**请求参数:**
```json
["param1", "param2"]
```

**响应:**
```json
{ "field": "value" }
```

## 通用响应格式

**请求说明:**
- 函数名以 `get` 开头 → GET 请求，参数放 `?data=[...]`
- 其他函数 → POST 请求，直接传 JSON 数组

**示例:**
- 获取文件: GET `?data=["fileId"]`
- 登录: POST `["admin","123"]`

**状态码:**
- 200: 成功
- 400: 请求参数错误
- 401: 未登录
- 403: 无权操作
- 404: 资源不存在
- 500: 服务器错误
```

### 6. 测试

```bash
pm2 reload superprint
curl "http://localhost:8000/api.md"
```

## 注意事项

1. 微信相关接口不需要文档（内部使用）
2. 请求参数必须是 JSON 数组格式
3. 示例参数使用实际值或通用占位符
4. 文档放在 `web/dist/` 目录下会被静态文件服务自动托管