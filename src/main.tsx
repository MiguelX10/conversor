import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DarkModeProvider } from './contexts/DarkModeContext'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import LoadingSpinner from './components/LoadingSpinner'

function AppWrapper() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" text="Verificando sesión..." />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DarkModeProvider>
        <AppWrapper />
      </DarkModeProvider>
    </AuthProvider>
  </StrictMode>,
)