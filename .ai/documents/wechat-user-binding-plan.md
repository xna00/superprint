# 微信客服用户关联登录功能实施计划

## 任务目标
当收到客服消息时，检测当前 `external_userid` 是否已关联到用户，如果没有关联，则发送一个登录 URL（查询参数带 `external_userid`），用户登录时带上这个参数，服务端将 `external_userid` 关联到用户。

## 实施步骤

### 1. 修改消息处理逻辑（后端）
**文件**: `server/api/weixin/message.ts`

- 修改 `handleTextMessage` 函数
- 添加检测逻辑：查询 User 表中是否存在该 `external_userid`
- 如果未关联，调用发送消息接口，返回登录链接
- 登录链接格式：`http://superprint.xna00.top/?external_userid=xxx`

### 2. 添加用户查询功能（后端）
**文件**: `server/api/user.ts` 或 `server/api/weixin/message.ts`

- 添加根据 `weixinKfExternalUserId` 查询用户的函数
- 在 `message.ts` 中导入 User 模型

### 3. 修改前端登录页面
**文件**: `web/src/pages/Login.tsx`

- 从 URL 查询参数中读取 `external_userid`
- 登录时将 `external_userid` 作为参数传递给后端 API

### 4. 修改登录 API（后端）
**文件**: `server/api/auth.ts`

- `login` 函数已经支持 `weixinKfExternalUserId` 参数
- 确保登录成功后更新用户的 `weixinKfExternalUserId` 字段

### 5. 测试流程
- 模拟收到客服消息（未关联用户）
- 验证是否发送登录链接
- 点击链接登录
- 验证用户是否正确关联

## 技术细节

### 消息处理流程
```
收到客服消息
  ↓
提取 external_userid
  ↓
查询 User 表: User.findOne({ weixinKfExternalUserId: external_userid })
  ↓
如果未找到用户
  ↓- 发送消息: "请先登录: http://superprint.xna00.top/?external_userid=xxx"
  ↓
用户点击链接，登录
  ↓
后端更新用户: User.update({ weixinKfExternalUserId: xxx }, { id: userId })
```

### 登录链接格式
```
http://superprint.xna00.top/?external_userid=wmABC123456
```

### API 调用
```typescript
// 前端登录
api.auth.login({
  username: "user",
  password: "pass",
  weixinKfExternalUserId: "wmABC123456"  // 从 URL 参数获取
})
```

## 文件修改清单

1. **server/api/weixin/message.ts**
   - 导入 User 模型
   - 修改 `handleTextMessage` 函数，添加用户关联检测逻辑
   - 未关联时发送登录链接

2. **web/src/pages/Login.tsx**
   - 添加 URL 参数读取逻辑
   - 登录时传递 `external_userid` 参数

## 注意事项
- 登录链接需要使用完整的服务器地址
- 需要确保 `external_userid` 参数正确传递
- 已关联用户不应重复发送登录链接
