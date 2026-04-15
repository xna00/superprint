import { useState, useEffect } from 'react'
import { Login } from './pages/Login'
import { PrintTaskDetail } from './pages/PrintTaskDetail'

function App() {
  const [page, setPage] = useState<'login' | 'printTaskDetail'>('login')

  useEffect(() => {
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
