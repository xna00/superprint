import { useState, useEffect } from 'react'
import * as os from 'os'
import * as gui from 'gui'
import { Button } from 'quickwin/lib/react-qw/index.js'
import { INSTALL_STEPS, runInstallStep } from '../install.js'

const VISIBLE = gui.WindowStyle.VISIBLE

interface Props {
    onComplete: () => void
}

export function InstallApp({ onComplete }: Props) {
    const [states, setStates] = useState<string[]>(INSTALL_STEPS.map(() => 'pending'))
    const [msg, setMsg] = useState('准备安装...')
    const [done, setDone] = useState(false)

    useEffect(() => {
        let cancelled = false
        async function run() {
            for (let i = 0; i < INSTALL_STEPS.length; i++) {
                if (cancelled) return
                setStates(s => s.map((_, j) => j === i ? 'doing' : j < i ? 'done' : 'pending'))
                setMsg(INSTALL_STEPS[i].label + '...')
                await new Promise<void>(r => os.setTimeout(() => r(), 0))
                let ok: boolean
                try {
                    ok = runInstallStep(INSTALL_STEPS[i].key)
                } catch (e) {
                    setStates(s => s.map((st, j) => j === i ? 'fail' : st))
                    setMsg(INSTALL_STEPS[i].label + ' 失败: ' + String(e))
                    setDone(true)
                    return
                }
                if (cancelled) return
                if (ok) {
                    setStates(s => s.map((st, j) => j === i ? 'done' : st))
                } else {
                    setStates(s => s.map((st, j) => j === i ? 'fail' : st))
                    setMsg(INSTALL_STEPS[i].label + ' 失败')
                    setDone(true)
                    return
                }
            }
            setMsg('安装完成！')
            setDone(true)
        }
        run().catch(() => {})
        return () => { cancelled = true }
    }, [])

    function prefix(s: string): string {
        if (s === 'done') return '成功'
        if (s === 'fail') return '失败'
        if (s === 'doing') return '进行中'
        return '待处理'
    }

    return (
        <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'column', gap: 2, flexGrow: 1 }}>
            <w type="STATIC" ws={VISIBLE} text="超人打印 - 安装" style={{ height: 24 }} />
            {INSTALL_STEPS.map((step, i) => (
                <w key={step.key} type="STATIC" ws={VISIBLE}
                    text={`${prefix(states[i])} ${step.label}`}
                    style={{ height: 20 }} />
            ))}
            <w type="STATIC" ws={VISIBLE} text={msg} style={{ height: 20 }} />
            {done && <Button onClick={() => onComplete()} style={{ height: 30 }}>关闭</Button>}
        </w>
    )
}
