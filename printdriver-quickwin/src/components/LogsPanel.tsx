import { useState, useEffect, useRef } from 'react'
import * as gui from 'gui'
import { ListBox } from 'quickwin/lib/react-qw/index.js'
import { setLogger } from '../print-queue.js'
import { pushLog, subscribeLogs, getLogs } from '../log-store.js'

export function LogsPanel() {
    const [logs, setLogs] = useState<string[]>(() => getLogs())
    const logListRef = useRef<gui.HWND>(null)

    useEffect(() => {
        const unsub = subscribeLogs(setLogs)
        return unsub
    }, [])

    useEffect(() => {
        setLogger(pushLog)
    }, [])

    useEffect(() => {
        if (!logListRef.current) return
        const lbHwnd = gui.GetWindow(logListRef.current, gui.GetWindowCmd.CHILD)
        if (lbHwnd) {
            const count = gui.SendMessage(lbHwnd, gui.LbMsg.GETCOUNT, 0, 0)
            gui.SendMessage(lbHwnd, gui.LbMsg.SETTOPINDEX, Math.max(0, count - 1), 0)
        }
    }, [logs])

    return <ListBox ref={logListRef} items={logs} scrollToBottom={true} style={{ flexGrow: 1 }} />
}
