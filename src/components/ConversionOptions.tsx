import React from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import type { ConversionOptions as ConversionOptionsType } from '../types'

interface ConversionOptionsProps {
  options: ConversionOptionsType
  onChange: (options: ConversionOptionsType) => void
}

const ConversionOptions: React.FC<ConversionOptionsProps> = ({ options, onChange }) => {
  const handleOptionChange = (key: keyof ConversionOptionsType) => {
    onChange({
      ...options,
      [key]: !options[key]
    })
  }

  const optionsList = [
    {
      key: 'preserveFormatting' as keyof ConversionOptionsType,
      label: 'Preservar formato original',
      description: 'Mantiene el estilo y formato del documento'
    },
    {
      key: 'extractImages' as keyof ConversionOptionsType,
      label: 'Extraer imágenes',
      description: 'Incluye todas las imágenes del PDF'
    },
    {
      key: 'maintainLayout' as keyof ConversionOptionsType,
      label: 'Mantener diseño',
      description: 'Conserva la estructura visual original'
    },
    {
      key: 'ocrText' as keyof ConversionOptionsType,
      label: 'OCR para texto escaneado',
      description: 'Reconoce texto en imágenes escaneadas'
    }
  ]

  return (
    <motion.div
      className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center mb-6">
        <Settings className="h-5 w-5 text-gray-600 mr-2" />
        <h4 className="text-lg font-semibold text-gray-800">Opciones de conversión</h4>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {optionsList.map((option, index) => (
          <motion.label
            key={option.key}
            className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white transition-colors duration-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={Boolean(options[option.key])}
                onChange={() => handleOptionChange(option.key)}
                className="sr-only"
              />
              <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                ${options[option.key]
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 hover:border-blue-400'
                }
              `}>
                {options[option.key] && (
                  <motion.svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800">{option.label}</div>
              <div className="text-sm text-gray-500">{option.description}</div>
            </div>
          </motion.label>
        ))}
      </div>
    </motion.div>
  )
}

export default ConversionOptions