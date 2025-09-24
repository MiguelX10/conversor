import React from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, FileText, X } from 'lucide-react'

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onRemoveFile: () => void
  disabled?: boolean
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  selectedFile,
  onRemoveFile,
  disabled = false
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    }
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (selectedFile) {
    return (
      <motion.div
        className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{selectedFile.name}</h3>
              <p className="text-gray-500 text-sm">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={onRemoveFile}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
        ${isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />

      <motion.div
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`
          p-4 rounded-full transition-colors duration-300
          ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          <Upload className={`
            h-12 w-12 transition-colors duration-300
            ${isDragActive ? 'text-blue-600' : 'text-gray-400'}
          `} />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {isDragActive ? '¡Suelta tu archivo aquí!' : 'Arrastra tu archivo PDF aquí'}
          </h3>
          <p className="text-gray-500">
            o{' '}
            <span className="text-blue-600 font-medium">
              haz clic para seleccionar
            </span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Solo archivos PDF • Máximo 10MB
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default FileDropzone