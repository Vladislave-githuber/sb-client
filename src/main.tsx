import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css';
import './styles/components.css';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="top-right" />
    <App />
  </StrictMode>,
)
