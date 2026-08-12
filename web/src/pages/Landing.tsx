import type { ReactNode } from 'react'

const features = [
  {
    title: '微信扫码绑定',
    desc: '扫打印机二维码进入客服会话即完成绑定，支持多用户绑多台打印机',
  },
  {
    title: '聊天内直接打印',
    desc: '在微信/企业微信客服会话中转发文件即可发起打印，无需跳转其他应用',
  },
  {
    title: '多格式支持',
    desc: 'PDF、Word、Excel、PPT、图片，全格式覆盖',
  },
  {
    title: '多文件合并',
    desc: '待确认期间连续转发的文件自动并入同一任务，一单打完',
  },
  {
    title: '打印设置',
    desc: '双面/单面、长边/短边翻页，可在任务详情页修改',
  },
  {
    title: '任务详情',
    desc: 'H5 页面查看文件清单、预览 PDF、切换打印机、保存并打印',
  },
  {
    title: '自动确认',
    desc: '60 秒无操作自动确认，人不在也能按时出纸',
  },
  {
    title: '结果通知',
    desc: '打印完成、失败实时推送，失败文件可一键重试',
  },
]

const scenarios = [
  {
    title: '家庭',
    desc: '孩子作业、老师发在群里的试卷，长按消息转发即打印，老人小孩都会用。',
  },
  {
    title: '移动办公',
    desc: '人在外面、文件在手机里，随时把文件打回办公室或家里的打印机。',
  },
  {
    title: '机构增值',
    desc: '多用户多打印机统一管理、私有部署；附带公文识别、PDF 转换、PDF 转 Word 等文档服务。',
  },
]

const reasons = [
  {
    title: '人人有微信，零学习成本',
    desc: '绑定 + 转发就是全部操作，无需下载、注册或配置',
  },
  {
    title: '信息不换生态',
    desc: '从"群里收到作业"到"打印机出纸"全程留在微信里，省去文件反复存取跳转',
  },
  {
    title: '对比更轻',
    desc: '无需像云打印机那样装各家小程序，无需像 U 盘那样登录电脑，无需像传统网络打印那样配 IP 和驱动',
  },
]

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
      {children}
    </h2>
  )
}

function SectionSub({ children }: { children: ReactNode }) {
  return <p className="mx-auto mt-2 max-w-2xl text-center text-slate-500">{children}</p>
}

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-left text-slate-700">
      <header className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            超人打印 SuperPrint
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            微信里转发文件，打印机直接出纸
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 sm:text-lg">
            不用装 App、不用登录电脑、不换聊天软件。
          </p>
          <div className="mt-8 flex justify-center gap-3 text-sm text-slate-400">
            <span>绑定即用</span>
            <span>·</span>
            <span>转发即打</span>
            <span>·</span>
            <span>全程留在微信里</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionTitle>产品简介</SectionTitle>
        <SectionSub>基于微信生态的云打印服务</SectionSub>
        <p className="mx-auto mt-8 max-w-3xl leading-relaxed text-slate-600">
          部署方只需在一台连接打印机的 Windows 电脑上安装常驻代理，机构成员或家庭成员用微信扫描打印机二维码完成一次绑定，
          之后就能在企业微信客服会话里直接转发文档或图片，远程打印到指定打印机。
        </p>
        <p className="mx-auto mt-4 max-w-3xl leading-relaxed text-slate-600">
          整个过程无需 U 盘、无需登录电脑、无需安装任何打印 App——微信人人都有，绑定即用。
        </p>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <SectionTitle>核心功能</SectionTitle>
          <SectionSub>从扫码绑定到出纸通知，完整的一站式打印链路</SectionSub>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionTitle>适用场景</SectionTitle>
        <SectionSub>一个面向所有人的微信打印入口</SectionSub>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {scenarios.map((s) => (
            <div key={s.title} className="rounded-xl border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <SectionTitle>为什么选它</SectionTitle>
          <div className="mt-10 space-y-6">
            {reasons.map((r) => (
              <div
                key={r.title}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:gap-6"
              >
                <h3 className="shrink-0 text-base font-semibold text-slate-900 sm:w-48">
                  {r.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-12 text-center">
        <p className="text-sm text-slate-500">
          私有部署 · 自动更新 · 交付即可用，持续迭代
        </p>
        <p className="mt-4 text-xs text-slate-400">超人打印 SuperPrint</p>
      </footer>
    </div>
  )
}
