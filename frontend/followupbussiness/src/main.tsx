import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { initializeTheme } from './shared/theme/theme'
import './styles/global.css'
import './styles/theme.css'

initializeTheme()

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('No se encontró el elemento raíz de la aplicación.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
