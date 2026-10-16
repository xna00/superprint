#!/usr/bin/env bash
# 服务器端部署脚本 —— 由 POST /api/deployHint/_outDeployHint 后台触发。
# 流程：拉代码 -> 装依赖 -> build + 把产物拷进 server/static -> 重启服务
#
# 日志：$REPO/deploy.log（追加）；状态：$REPO/deploy.status.json
set -uo pipefail

NVM_BIN=/root/.local/share/nvm/v26.10.0/bin
export PATH="$NVM_BIN:$PATH"

REPO="${SUPERPRINT_REPO:-/root/superprint}"
LOCK=/tmp/superprint-deploy.lock
LOG="$REPO/deploy.log"
STATUS="$REPO/deploy.status.json"

exec >>"$LOG" 2>&1
say() { echo "[$(date '+%F %T')] $*"; }

say "==================== deploy start ===================="

exec 9>"$LOCK"
if ! flock -n 9; then
  say "已有部署在跑，本次跳过"
  exit 0
fi

cd "$REPO" || { say "✗ 进不去 $REPO"; exit 1; }

status() {
  printf '{"state":"%s","at":"%s","commit":"%s"}\n' \
    "$1" "$(date '+%F %T')" "$(git rev-parse --short HEAD 2>/dev/null || echo unknown)" >"$STATUS"
}

status running

if ! git pull --ff-only; then
  say "✗ git pull 失败"
  status failed
  exit 1
fi
say "代码: $(git log -1 --oneline)"

# 父仓库 bump 了子模块指针时要跟着更新，否则 build 会用到旧的 typed-sql
if ! git submodule update --init --recursive; then
  say "✗ git submodule update 失败"
  status failed
  exit 1
fi

if ! npm ci; then
  say "✗ npm ci 失败（服务未受影响，仍在跑旧代码）"
  status failed
  exit 1
fi

if ! npm run deploy; then
  say "✗ npm run deploy 失败（server/static 大部分保持原样）"
  status failed
  exit 1
fi

status success
say "✓ 静态产物已更新: $(git log -1 --oneline)"

if pm2 restart superprint; then
  say "✓ pm2 restart superprint 完成"
else
  say "⚠ pm2 restart 失败（静态文件已生效，但服务端代码可能还是旧的）"
fi

say "==================== deploy end ======================"
