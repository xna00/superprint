import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const initDebugMode = async () => {
  const DEBUG_KEY = 'superprint_debug_mode'
  if (localStorage.getItem(DEBUG_KEY) !== 'true') return

  try {
    // @ts-expect-error - dynamic import from CDN
    const VC = await import('https://esm.sh/vconsole@latest')
    new VC.default()
  } catch (e) {
    console.error('Failed to load vConsole:', e)
  }
}

initDebugMode().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
