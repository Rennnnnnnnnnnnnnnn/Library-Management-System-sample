import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context.js/AuthContext.jsx'
import { ThemeProvider } from './context.js/ThemeContext.jsx'


createRoot(document.getElementById('root')).render(

  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>

)
