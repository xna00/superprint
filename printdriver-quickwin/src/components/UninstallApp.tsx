import { useState, useEffect } from 'react'
import * as os from 'os'
import * as gui from 'gui'

import { UNINSTALL_STEPS, runUninstallStep } from '../install.js'

const VISIBLE = gui.WindowStyle.VISIBLE

interface Props {
    cw: number
    ch: number
    onComplete: () => void
}

export function UninstallApp({ cw, ch, onComplete }: Props) {
    const [states, setStates] = useState<string[]>(UNINSTALL_STEPS.map(() => 'pending'))
    const [msg, setMsg] = useState('准备卸载...')
    const [done, setDone] = useState(false)

    useEffect(() => {
        let cancelled = false
        async function run() {
            for (let i = 0; i < UNINSTALL_STEPS.length; i++) {
                if (cancelled) return
                setStates(s => s.map((_, j) => j === i ? 'doing' : j < i ? 'done' : 'pending'))
                setMsg(UNINSTALL_STEPS[i].label + '...')
                await new Promise<void>(r => os.setTimeout(() => r(), 0))
                let ok: boolean
                try {
                    ok = runUninstallStep(UNINSTALL_STEPS[i].key)
                } catch (e) {
                    setStates(s => s.map((st, j) => j === i ? 'fail' : st))
                    setMsg(UNINSTALL_STEPS[i].label + ' 失败: ' + String(e))
                    setDone(true)
                    os.setTimeout(() => onComplete(), 3000)
                    return
                }
                if (cancelled) return
                if (ok) {
                    setStates(s => s.map((st, j) => j === i ? 'done' : st))
                } else {
                    setStates(s => s.map((st, j) => j === i ? 'fail' : st))
                    setMsg(UNINSTALL_STEPS[i].label + ' 失败')
                    setDone(true)
                    os.setTimeout(() => onComplete(), 3000)
                    return
                }
            }
            setMsg('卸载完成！')
            setDone(true)
            os.setTimeout(() => onComplete(), 3000)
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
        <w type="STATIC" ws={VISIBLE} style={{ flexDirection: 'column', gap: 2, x: 0, y: 0, width: cw, height: ch }}>
            <w type="STATIC" ws={VISIBLE} text="超人打印 - 卸载" style={{ height: 24 }} />
            {UNINSTALL_STEPS.map((step, i) => (
                <w key={step.key} type="STATIC" ws={VISIBLE}
                    text={`${prefix(states[i])} ${step.label}`}
                    style={{ height: 20 }} />
            ))}
            <w type="STATIC" ws={VISIBLE} text={msg} style={{ height: 20 }} />
        </w>
    )
}
