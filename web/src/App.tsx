import { useState, useEffect, useRef } from 'react'
import { Login } from './pages/Login'
import { PrintTaskDetail } from './pages/PrintTaskDetail'

function HiddenDebugTrigger() {
  const hintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const DEBUG_KEY = 'superprint_debug_mode'
    const CLICK_COUNT = 7
    const TIMEOUT_MS = 500

    let clickCount = 0
    let lastClickTime = 0

    const showHint = (remaining: number) => {
      if (hintRef.current) {
        hintRef.current.textContent = `再点${remaining}次开启调试`
        hintRef.current.style.opacity = '1'
        setTimeout(() => {
          if (hintRef.current) {
            hintRef.current.style.opacity = '0'
          }
        }, 400)
      }
    }

    const handleClick = () => {
      const now = Date.now()

      if (now - lastClickTime > TIMEOUT_MS) {
        clickCount = 0
      }

      clickCount++
      lastClickTime = now

      const remaining = CLICK_COUNT - clickCount
      if (remaining > 0) {
        showHint(remaining)
      }

      if (clickCount >= CLICK_COUNT) {
        clickCount = 0
        const current = localStorage.getItem(DEBUG_KEY) === 'true'
        localStorage.setItem(DEBUG_KEY, String(!current))
        alert(`调试模式已${!current ? '开启' : '关闭'}，请刷新页面`)
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <div
      ref={hintRef}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        borderRadius: '4px',
        fontSize: '12px',
        opacity: 0,
        transition: 'opacity 0.2s',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}

const handleTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  
  if (token) {
    document.cookie = `token=${token}; Path=/; SameSite=Strict`
    params.delete('token')
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    window.history.replaceState({}, '', newUrl)
  }
}

function App() {
  const [page, setPage] = useState<'login' | 'printTaskDetail'>('login')

  useEffect(() => {
    handleTokenFromUrl()

    const path = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    const printTaskId = params.get('id')

    if (path === '/printTask' && printTaskId) {
      setPage('printTaskDetail')
    } else {
      setPage('login')
    }
  }, [])

  return (
    <>
      {page === 'printTaskDetail' ? <PrintTaskDetail /> : <Login />}
      <HiddenDebugTrigger />
    </>
  )
}

export default App
