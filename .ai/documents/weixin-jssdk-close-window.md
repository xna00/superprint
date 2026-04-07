# 企业微信 JS-SDK 关闭页面计划

## 背景
登录成功后需要关闭页面，但在微信浏览器中 `window.close()` 无法工作。

## 解决方案
使用 `WeixinJSBridge.call('closeWindow')` 方法，这是微信内置的方法，无需引入 SDK 或进行签名配置。

## 实现步骤

### 1. 修改 Login.tsx
在登录成功后，尝试使用 `WeixinJSBridge` 关闭页面：

```typescript
const closeWindow = () => {
  if (typeof WeixinJSBridge !== 'undefined') {
    WeixinJSBridge.call('closeWindow')
  } else {
    // 非微信环境，尝试 window.close
    window.close()
  }
}
```

### 2. 处理 WeixinJSBridge 未定义的情况
由于 `WeixinJSBridge` 是微信注入的全局对象，需要添加类型声明：

```typescript
declare const WeixinJSBridge: {
  call: (method: string) => void
} | undefined
```

### 3. 监听 WeixinJSBridgeReady 事件
如果页面加载时 `WeixinJSBridge` 还未注入，需要监听 `WeixinJSBridgeReady` 事件：

```typescript
const closeWindow = () => {
  if (typeof WeixinJSBridge !== 'undefined') {
    WeixinJSBridge.call('closeWindow')
  } else if (document.addEventListener) {
    document.addEventListener('WeixinJSBridgeReady', () => {
      WeixinJSBridge.call('closeWindow')
    }, false)
  } else {
    window.close()
  }
}
```

## 文件修改
- `/home/xna/repos/superprint/web/src/pages/Login.tsx` - 添加关闭窗口逻辑
