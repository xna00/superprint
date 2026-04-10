import { useState, useEffect } from 'react'
import { Login } from './pages/Login'
import { PrintJobDetail } from './pages/PrintJobDetail'

function App() {
  const [page, setPage] = useState<'login' | 'printJobDetail'>('login')

  useEffect(() => {
    const path = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    const printJobId = params.get('id')

    if (path === '/print-job' && printJobId) {
      setPage('printJobDetail')
    } else {
      setPage('login')
    }
  }, [])

  if (page === 'printJobDetail') {
    return <PrintJobDetail />
  }

  return <Login />
}

export default App
