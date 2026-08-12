const steps = [
  {
    n: '1',
    title: '安装',
    desc: '在连接打印机的电脑上安装客户端',
  },
  {
    n: '2',
    title: '绑定',
    desc: '家人用微信扫描打印机二维码',
  },
  {
    n: '3',
    title: '打印',
    desc: '在微信里发送文件，打印机会自动打印',
  },
]

const abilities = [
  {
    n: '01',
    title: '格式',
    desc: '支持 PDF、Word、Excel、PPT、图片',
  },
  {
    n: '02',
    title: '打印设置',
    desc: '支持双面/单面、长边/短边翻页',
  },
  {
    n: '03',
    title: '结果通知',
    desc: '打印完成或失败会收到通知',
  },
  {
    n: '04',
    title: '多人使用',
    desc: '支持多个家人绑定同一台打印机',
  },
]

const noNeeds = ['U 盘', '登录电脑', '装小程序', '跑打印店']

function ChatMock() {
  return (
    <div className="w-full max-w-sm rounded-3xl bg-[#ededed] p-5 text-left shadow-xl ring-1 ring-black/5">
      <div className="flex items-center justify-between pb-4 text-[13px] text-black/60">
        <span>微信</span>
        <span className="tracking-widest">•••</span>
      </div>

      <div className="flex items-start gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#10aeff] text-xs text-white">
          师
        </div>
        <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[13px] leading-snug text-black/90 shadow-sm">
          明天要用的作业，麻烦打印一下
          <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-black/10 bg-[#f6f6f6] px-2.5 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded bg-red-50 text-[10px] font-semibold text-red-500">
              PDF
            </div>
            <div className="text-[12px] leading-tight">
              <div className="text-black/85">数学作业.pdf</div>
              <div className="mt-0.5 text-black/40">2.3 MB</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-10 mt-3 w-44 rounded-xl bg-white py-1 text-[13px] shadow-lg ring-1 ring-black/5">
        <div className="px-3.5 py-2 text-black/60">复制</div>
        <div className="px-3.5 py-2 text-black/60">收藏</div>
        <div className="px-3.5 py-2 font-medium text-emerald-600">转发…</div>
        <div className="px-3.5 py-2 text-red-500">删除</div>
      </div>
      <div className="ml-2 mt-1.5 text-[11px] text-black/40">长按文件 → 转发</div>

      <div className="mt-5 flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[#95ec69] px-3.5 py-2.5 text-[13px] leading-snug text-black/90 shadow-sm">
          转发给 超人打印机
        </div>
      </div>

      <div className="mt-5 text-center text-[11px] text-black/40">已发送到打印机 · 已打印</div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="landing-root min-h-screen bg-white text-left text-slate-700">
      <header className="relative overflow-hidden">
        <div className="mx-auto grid max-w-5xl items-center gap-14 px-6 pb-20 pt-16 sm:pt-20 lg:grid-cols-2 lg:pb-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-[13px] font-medium text-emerald-600 ring-1 ring-emerald-100">
              超人打印 SuperPrint
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-[44px] sm:leading-[1.15]">
              微信发送文件，即可打印
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-500">
              在连接打印机的电脑上安装客户端，用微信发送文件即可打印。
            </p>
            <div className="mt-7 flex flex-wrap gap-x-3 gap-y-2 text-[13px] text-slate-400">
              <span>不装 App</span>
              <span>·</span>
              <span>不用开电脑</span>
              <span>·</span>
              <span>家人扫码即可使用</span>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ChatMock />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">怎么用</h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {steps.map((s) => (
            <div key={s.n} className="border-t border-slate-200 pt-6">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">功能</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {abilities.map((a) => (
              <div key={a.n} className="flex gap-5">
                <span className="shrink-0 pt-0.5 font-mono text-sm text-emerald-600">{a.n}</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900">
          不需要
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-lg text-slate-400">
          {noNeeds.map((t) => (
            <span key={t} className="line-through decoration-slate-300">
              {t}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10 text-center">
        <p className="text-xs text-slate-400">超人打印 SuperPrint · 安装即用 · 自动更新</p>
      </footer>
    </div>
  )
}
