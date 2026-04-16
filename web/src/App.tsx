import { useState, useEffect } from 'react'
import { Login } from './pages/Login'
import { PrintTaskDetail } from './pages/PrintTaskDetail'

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

  if (page === 'printTaskDetail') {
    return <PrintTaskDetail />
  }

  return <Login />
}

export default App
