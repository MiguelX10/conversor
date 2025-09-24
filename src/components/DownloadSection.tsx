import React from 'react'
import { motion } from 'framer-motion'
import { Download, CheckCircle, RotateCcw } from 'lucide-react'

interface DownloadSectionProps {
  downloadUrl: string
  fileName: string
  onNewConversion: () => void
}

const DownloadSection: React.FC<DownloadSectionProps> = ({
  downloadUrl,
  fileName,
  onNewConversion
}) => {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <motion.div
      className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex justify-center mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-green-100 p-3 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          ¡Conversión completada!
        </h3>
        <p className="text-green-700 mb-6">
          Tu archivo ha sido convertido exitosamente a formato Word
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            onClick={handleDownload}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="h-5 w-5" />
            <span>Descargar {fileName}</span>
          </motion.button>

          <motion.button
            onClick={onNewConversion}
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="h-5 w-5" />
            <span>Convertir otro archivo</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DownloadSection