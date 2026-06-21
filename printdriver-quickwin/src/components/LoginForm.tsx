import * as gui from 'gui'
import { Button, Input } from 'quickwin/lib/react-qw/index.js'

const VISIBLE = gui.WindowStyle.VISIBLE
const CLIPCHILDREN = gui.WindowStyle.CLIPCHILDREN

interface LoginFormProps {
    cw: number
    ch: number
    loginUser: string
    setLoginUser: (v: string) => void
    loginPass: string
    setLoginPass: (v: string) => void
    handleLogin: () => void
}

export function LoginForm({ cw, ch, loginUser, setLoginUser, loginPass, setLoginPass, handleLogin }: LoginFormProps) {
    return (
        <w type="STATIC" ws={VISIBLE | CLIPCHILDREN} style={{ flexDirection: 'column', gap: 8, padding: 40, justifyContent: 'center', x: 0, y: 0, width: cw, height: ch }}>
            <w type="STATIC" ws={VISIBLE} text="SuperPrint" style={{ height: 28 }} />
            <Input value={loginUser} onChange={setLoginUser} placeholder="用户名" style={{ height: 28 }} />
            <Input value={loginPass} onChange={setLoginPass} password={true} placeholder="密码" style={{ height: 28 }} />
            <Button onClick={handleLogin} style={{ height: 30 }}>登录</Button>
        </w>
    )
}
