// Contenido principal de la app - extraído para usar hooks de auth
import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import DarkModeToggle from './DarkModeToggle'
import { useDarkMode } from '../contexts/DarkModeContext'
import { MonetizationService } from '../services/monetizationService'
import RewardedVideoModal from './RewardedVideoModal'
import UsageBanner from './UsageBanner'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from './LoginModal'
import UserProfile from './UserProfile'

interface AppContentProps {
  // Props si necesitas pasar datos desde el componente padre
}

export default function AppContent({}: AppContentProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { isRegistered, isAnonymous } = useAuth()

  // Estados para monetización
  const [showRewardedVideoModal, setShowRewardedVideoModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Actualizar MonetizationService cuando cambie el estado del usuario
  useEffect(() => {
    MonetizationService.setUserRegistered(isRegistered)
  }, [isRegistered])

  const convertFile = async () => {
    // Verificar límites de conversión antes de proceder
    if (!MonetizationService.canConvert(isRegistered)) {
      const state = MonetizationService.getMonetizationState(isRegistered)

      if (state.showLoginPrompt && isAnonymous) {
        // Usuario anónimo debe registrarse
        setShowLoginModal(true)
        return
      } else if (state.canWatchAd) {
        // Puede ver anuncio para conseguir conversión extra
        setShowRewardedVideoModal(true)
        return
      } else {
        // Sin más opciones por hoy
        alert('Has agotado todas tus conversiones gratuitas por hoy. Las conversiones se reinician cada 24 horas.')
        return
      }
    }

    // Incrementar contador de conversiones
    MonetizationService.incrementConversion(isRegistered)

    // Resto de la lógica de conversión...
    console.log('Iniciando conversión...')
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: isDarkMode ? 'linear-gradient(to bottom right, #0f172a, #1e293b, #334155)' : 'linear-gradient(to bottom right, #dbeafe, #ffffff, #faf5ff)' }}>
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', backdropFilter: 'blur(8px)' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ConvertPro
              </h1>
            </div>

            {/* User Profile / Login Button */}
            <div className="flex items-center gap-3">
              {isRegistered ? (
                <UserProfile />
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Registrarse
                </button>
              )}

              <DarkModeToggle isDark={isDarkMode} onToggle={toggleDarkMode} />
            </div>
          </div>

          {/* Usage Banner */}
          <div className="px-4 pb-4">
            <UsageBanner
              onShowRewardedVideo={() => setShowRewardedVideoModal(true)}
              onShowPremium={() => alert('Premium modal')}
              onShowLogin={() => setShowLoginModal(true)}
              isRegistered={isRegistered}
              isAnonymous={isAnonymous}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Conversion Button */}
          <div className="text-center mb-12">
            <button
              onClick={convertFile}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Convertir Archivo
            </button>
          </div>

          {/* Welcome Message for New Users */}
          {isAnonymous && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Bienvenido a ConvertPro!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Usuarios anónimos: 1 conversión + anuncios extras
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Registrarme para 3 conversiones diarias
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RewardedVideoModal
        isOpen={showRewardedVideoModal}
        onClose={() => setShowRewardedVideoModal(false)}
        onVideoWatched={() => {
          MonetizationService.rewardAdWatch()
          setShowRewardedVideoModal(false)
          convertFile()
        }}
        remainingAdWatches={MonetizationService.getMonetizationState(isRegistered).remainingAdWatches}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(user) => {
          console.log('Usuario registrado:', user)
          setShowLoginModal(false)
        }}
        trigger="conversion_limit"
      />
    </div>
  )
}