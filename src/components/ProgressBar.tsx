import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ProgressBarProps {
  progress: number
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const getProgressText = (progress: number): string => {
    if (progress < 30) return 'Analizando archivo PDF...'
    if (progress < 60) return 'Extrayendo contenido...'
    if (progress < 90) return 'Generando documento Word...'
    return 'Finalizando conversión...'
  }

  return (
    <motion.div
      className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-center mb-4">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-3" />
        <h3 className="text-lg font-semibold text-blue-800">Convirtiendo archivo</h3>
      </div>

      <div className="space-y-4">
        <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <div className="flex justify-between items-center">
          <motion.p
            className="text-blue-700 font-medium"
            key={getProgressText(progress)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {getProgressText(progress)}
          </motion.p>
          <span className="text-blue-600 font-bold text-lg">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default ProgressBar