// 由根 package.json 的 prepare 脚本在 npm install / npm ci 时调用。
// 把 git 的 hooks 目录指到仓库内的 .githooks/，这样提交前校验对新克隆的人自动生效，
// 不需要谁再去手动 git config 一遍。
//
// 关键约束：这个脚本任何情况下都不允许失败。它跑在 CI 的 checkout 环境里，
// 那边 git 配置可能写不了（或者根本不在 worktree 内）；一旦这里 exit 1，
// npm ci 就会崩，整条流水线全红，而它自己什么都没干成。
import { spawnSync } from 'node:child_process'
import { existsSync, chmodSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const hookPath = '.githooks'

const inWorktree = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
  cwd: root,
  encoding: 'utf8',
})
if (inWorktree.status !== 0 || inWorktree.stdout.trim() !== 'true') {
  console.log('[install-hooks] 不在 git 仓库内，跳过')
  process.exit(0)
}

const cur = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
  cwd: root,
  encoding: 'utf8',
})
if (cur.status === 0 && cur.stdout.trim() === hookPath) {
  console.log(`[install-hooks] core.hooksPath 已是 ${hookPath}，跳过`)
  process.exit(0)
}

const set = spawnSync('git', ['config', 'core.hooksPath', hookPath], {
  cwd: root,
  encoding: 'utf8',
})
if (set.status !== 0) {
  console.error(
    `[install-hooks] 设置 core.hooksPath 失败，可手动执行：git config core.hooksPath ${hookPath}`,
  )
  process.exit(0)
}

const preCommit = join(root, hookPath, 'pre-commit')
if (existsSync(preCommit)) {
  // Windows 上 chmod 基本是 no-op，但 exec bit 已经存在 git 的 index 里，检出来就是可执行的
  try {
    chmodSync(preCommit, 0o755)
  } catch {
    /* 忽略：上面 git 检出的权限已经够用了 */
  }
}

console.log(`[install-hooks] core.hooksPath = ${hookPath}`)
