import { useState, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, Download, Loader2, AlertCircle, CheckCircle, Image, FileSpreadsheet, Presentation, Globe, Grid, Minimize2, Video, Settings, Combine, SplitSquareHorizontal, Music, Film, Archive, FileImage, FileType, Palette, FileAudio, Headphones, Volume2, Camera, Zap, Code, BookOpen, FileCode, Layers, Lock, Unlock, Database, HardDrive, Smartphone, Menu, ChevronDown, Search, Filter, History, Eye, Trash2, Star, FolderOpen, Cloud, Share, X, Plus, Minus, RotateCcw, Maximize2, Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'
import { saveAs } from 'file-saver'
import DarkModeToggle from './components/DarkModeToggle'
import LoadingAnimation from './components/LoadingAnimation'
import { useDarkMode } from './contexts/DarkModeContext'
import { trackConversionStarted, trackConversionCompleted, trackConversionError, trackToolSelection, trackFileUploaded } from './utils/analytics'

interface ConversionState {
  status: 'idle' | 'uploading' | 'converting' | 'downloading' | 'completed' | 'error'
  progress: number
  message: string
  error?: string
}

interface BatchConversionState {
  files: FileWithProgress[]
  overallProgress: number
  completed: number
  failed: number
  status: 'idle' | 'processing' | 'completed' | 'error'
}

interface FileWithProgress {
  file: File
  id: string
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  downloadUrl?: string
}

interface ConversionHistory {
  id: string
  fileName: string
  inputFormat: string
  outputFormat: string
  tool: string
  date: Date
  fileSize: number
  downloadUrl?: string
  isFavorite: boolean
}

interface UserSettings {
  defaultQuality: number
  preferredFormats: { [key: string]: string }
  favoriteTools: string[]
  theme: 'light' | 'dark' | 'auto'
  showPreview: boolean
  batchSize: number
  autoDownload: boolean
}

interface FilePreview {
  url: string
  type: 'image' | 'pdf' | 'text' | 'video' | 'audio'
  thumbnailUrl?: string
}

interface ConversionTool {
  id: string
  name: string
  description: string
  inputFormat: string
  outputFormat: string
  icon: any
  acceptTypes: { [key: string]: string[] }
  category: 'from-pdf' | 'to-pdf' | 'optimize' | 'image-convert' | 'pdf-tools' | 'media-convert' | 'document-convert' | 'ebook-convert' | 'archive-convert' | 'data-convert' | 'design-convert'
  isOptimization?: boolean
  isImageConverter?: boolean
  optimizationSettings?: OptimizationSettings
  imageConversionSettings?: ImageConversionSettings
  isMultiFile?: boolean
  multiFileSettings?: MultiFileSettings
  isSplitTool?: boolean
  splitSettings?: SplitSettings
  maxFileSize?: number // in MB
}

interface MultiFileSettings {
  maxFiles: number
  description: string
}

interface SplitSettings {
  modes: string[]
  description: string
}

interface ImageConversionSettings {
  supportedInputFormats: string[]
  supportedOutputFormats: string[]
  supportsQuality: boolean
  supportsBackground: boolean
  supportsResize: boolean
  defaultQuality: number
}

interface OptimizationSettings {
  type: 'pdf' | 'image' | 'video'
  qualityLevels?: { label: string; value: number; description: string }[]
  defaultQuality?: number
  supportsResize?: boolean
  maxWidth?: number
  videoCodec?: string
  preset?: string
}

const CONVERSION_TOOLS: ConversionTool[] = [
  // Conversiones desde PDF
  {
    id: 'pdf-to-word',
    name: 'PDF a Word',
    description: 'Convierte PDF a documento Word editable',
    inputFormat: 'pdf',
    outputFormat: 'docx',
    icon: FileText,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'from-pdf'
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF a JPG',
    description: 'Extrae páginas del PDF como imágenes JPG',
    inputFormat: 'pdf',
    outputFormat: 'jpg',
    icon: Image,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'from-pdf'
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF a Excel',
    description: 'Convierte PDF a hoja de cálculo Excel',
    inputFormat: 'pdf',
    outputFormat: 'xlsx',
    icon: FileSpreadsheet,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'from-pdf'
  },
  {
    id: 'pdf-to-powerpoint',
    name: 'PDF a PowerPoint',
    description: 'Convierte PDF a presentación PowerPoint',
    inputFormat: 'pdf',
    outputFormat: 'pptx',
    icon: Presentation,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'from-pdf'
  },
  {
    id: 'pdf-to-html',
    name: 'PDF a HTML',
    description: 'Convierte PDF a página web HTML',
    inputFormat: 'pdf',
    outputFormat: 'html',
    icon: Globe,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'from-pdf'
  },
  // Conversiones hacia PDF
  {
    id: 'word-to-pdf',
    name: 'Word a PDF',
    description: 'Convierte documento Word a PDF',
    inputFormat: 'docx',
    outputFormat: 'pdf',
    icon: FileText,
    acceptTypes: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] },
    category: 'to-pdf'
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel a PDF',
    description: 'Convierte hoja de cálculo Excel a PDF',
    inputFormat: 'xlsx',
    outputFormat: 'pdf',
    icon: FileSpreadsheet,
    acceptTypes: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    category: 'to-pdf'
  },
  {
    id: 'powerpoint-to-pdf',
    name: 'PowerPoint a PDF',
    description: 'Convierte presentación PowerPoint a PDF',
    inputFormat: 'pptx',
    outputFormat: 'pdf',
    icon: Presentation,
    acceptTypes: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'], 'application/vnd.ms-powerpoint': ['.ppt'] },
    category: 'to-pdf'
  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG a PDF',
    description: 'Convierte imagen JPG a documento PDF',
    inputFormat: 'jpg',
    outputFormat: 'pdf',
    icon: Image,
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    category: 'to-pdf'
  },
  {
    id: 'html-to-pdf',
    name: 'HTML a PDF',
    description: 'Convierte página web HTML a PDF',
    inputFormat: 'html',
    outputFormat: 'pdf',
    icon: Globe,
    acceptTypes: { 'text/html': ['.html', '.htm'] },
    category: 'to-pdf'
  },
  // Herramientas de optimización
  {
    id: 'optimize-pdf',
    name: 'Optimizar PDF',
    description: 'Reduce el tamaño del PDF comprimiendo imágenes y eliminando objetos no usados',
    inputFormat: 'pdf',
    outputFormat: 'pdf',
    icon: Minimize2,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'optimize',
    isOptimization: true,
    optimizationSettings: {
      type: 'pdf',
      qualityLevels: [
        { label: 'Ligera', value: 90, description: 'Compresión mínima, máxima calidad' },
        { label: 'Media', value: 75, description: 'Balance entre calidad y tamaño' },
        { label: 'Alta', value: 60, description: 'Máxima compresión, menor tamaño' }
      ],
      defaultQuality: 75
    }
  },
  {
    id: 'optimize-image',
    name: 'Optimizar Imagen',
    description: 'Reduce el tamaño de imágenes JPG/PNG manteniendo calidad visual',
    inputFormat: 'image',
    outputFormat: 'jpg',
    icon: Image,
    acceptTypes: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/bmp': ['.bmp']
    },
    category: 'optimize',
    isOptimization: true,
    optimizationSettings: {
      type: 'image',
      qualityLevels: [
        { label: 'Alta calidad', value: 85, description: '85% - Ideal para fotos importantes' },
        { label: 'Media calidad', value: 70, description: '70% - Balance perfecto' },
        { label: 'Baja calidad', value: 50, description: '50% - Máximo ahorro de espacio' }
      ],
      defaultQuality: 70,
      supportsResize: true,
      maxWidth: 1920
    }
  },
  {
    id: 'optimize-video',
    name: 'Optimizar Video',
    description: 'Reduce el tamaño de videos manteniendo calidad visual mediante compresión H.264',
    inputFormat: 'video',
    outputFormat: 'mp4',
    icon: Video,
    acceptTypes: {
      'video/mp4': ['.mp4'],
      'video/avi': ['.avi'],
      'video/mov': ['.mov'],
      'video/mkv': ['.mkv'],
      'video/webm': ['.webm']
    },
    category: 'optimize',
    isOptimization: true,
    optimizationSettings: {
      type: 'video',
      qualityLevels: [
        { label: '1080p', value: 1080, description: 'Full HD - Alta calidad' },
        { label: '720p', value: 720, description: 'HD - Balance calidad/tamaño' },
        { label: '480p', value: 480, description: 'SD - Máxima compresión' }
      ],
      defaultQuality: 720,
      videoCodec: 'h264',
      preset: 'medium'
    },
    maxFileSize: 2048
  },
  // Herramientas de conversión de imágenes
  {
    id: 'convert-images',
    name: 'Convertir Imágenes',
    description: 'Convierte entre diferentes formatos de imagen con control de calidad',
    inputFormat: 'image',
    outputFormat: 'image',
    icon: Image,
    acceptTypes: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'image/heic': ['.heic', '.heif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif']
    },
    category: 'image-convert',
    isImageConverter: true,
    imageConversionSettings: {
      supportedInputFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'bmp', 'tiff', 'tif'],
      supportedOutputFormats: ['jpg', 'png', 'webp'],
      supportsQuality: true,
      supportsBackground: true,
      supportsResize: true,
      defaultQuality: 85
    }
  },
  // Nuevos formatos de conversión populares
  {
    id: 'pdf-to-txt',
    name: 'PDF a TXT',
    description: 'Extrae texto del PDF como archivo de texto plano',
    inputFormat: 'pdf',
    outputFormat: 'txt',
    icon: FileType,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'from-pdf'
  },
  {
    id: 'png-to-jpg',
    name: 'PNG a JPG',
    description: 'Convierte PNG a JPG con fondo personalizable',
    inputFormat: 'png',
    outputFormat: 'jpg',
    icon: FileImage,
    acceptTypes: { 'image/png': ['.png'] },
    category: 'image-convert'
  },
  {
    id: 'jpg-to-png',
    name: 'JPG a PNG',
    description: 'Convierte JPG a PNG con transparencia',
    inputFormat: 'jpg',
    outputFormat: 'png',
    icon: FileImage,
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'] },
    category: 'image-convert'
  },
  {
    id: 'webp-to-jpg',
    name: 'WEBP a JPG',
    description: 'Convierte imagen moderna WEBP a JPG compatible',
    inputFormat: 'webp',
    outputFormat: 'jpg',
    icon: FileImage,
    acceptTypes: { 'image/webp': ['.webp'] },
    category: 'image-convert'
  },
  {
    id: 'jpg-to-webp',
    name: 'JPG a WEBP',
    description: 'Convierte JPG a formato WEBP moderno y ligero',
    inputFormat: 'jpg',
    outputFormat: 'webp',
    icon: FileImage,
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'] },
    category: 'image-convert'
  },
  // Herramientas de merge/split PDFs
  {
    id: 'merge-pdfs',
    name: 'Unir PDFs',
    description: 'Combina múltiples archivos PDF en un solo documento',
    inputFormat: 'pdf',
    outputFormat: 'pdf',
    icon: Combine,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'pdf-tools',
    isMultiFile: true,
    multiFileSettings: {
      maxFiles: 20,
      description: 'Selecciona hasta 20 archivos PDF para combinar'
    },
    maxFileSize: 25
  },
  {
    id: 'split-pdf',
    name: 'Dividir PDF',
    description: 'Separa un PDF en páginas individuales o rangos específicos',
    inputFormat: 'pdf',
    outputFormat: 'pdf',
    icon: SplitSquareHorizontal,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'pdf-tools',
    isSplitTool: true,
    splitSettings: {
      modes: ['pages', 'range'],
      description: 'Divide por páginas individuales o rangos personalizados'
    },
    maxFileSize: 100
  },
  // Audio/Video (populares para monetización)
  {
    id: 'mp4-to-mp3',
    name: 'MP4 a MP3',
    description: 'Extrae audio de video MP4 como archivo MP3',
    inputFormat: 'mp4',
    outputFormat: 'mp3',
    icon: Music,
    acceptTypes: { 'video/mp4': ['.mp4'] },
    category: 'media-convert',
    maxFileSize: 750
  },
  {
    id: 'compress-video',
    name: 'Comprimir Video',
    description: 'Reduce el tamaño de videos manteniendo calidad visual',
    inputFormat: 'mp4',
    outputFormat: 'mp4',
    icon: Film,
    acceptTypes: { 'video/mp4': ['.mp4'], 'video/avi': ['.avi'], 'video/mov': ['.mov'] },
    category: 'optimize',
    isOptimization: true,
    optimizationSettings: {
      type: 'video',
      qualityLevels: [
        { label: 'Alta calidad', value: 85, description: '1080p - Ideal para streaming' },
        { label: 'Calidad media', value: 70, description: '720p - Balance tamaño/calidad' },
        { label: 'Compresión máxima', value: 50, description: '480p - Mínimo tamaño' }
      ],
      defaultQuality: 70
    },
    maxFileSize: 2048
  },
  // Más conversiones de audio populares
  {
    id: 'wav-to-mp3',
    name: 'WAV a MP3',
    description: 'Convierte audio WAV a MP3 comprimido',
    inputFormat: 'wav',
    outputFormat: 'mp3',
    icon: Volume2,
    acceptTypes: { 'audio/wav': ['.wav'] },
    category: 'media-convert'
  },
  {
    id: 'flac-to-mp3',
    name: 'FLAC a MP3',
    description: 'Convierte audio FLAC sin pérdida a MP3',
    inputFormat: 'flac',
    outputFormat: 'mp3',
    icon: Headphones,
    acceptTypes: { 'audio/flac': ['.flac'] },
    category: 'media-convert'
  },
  {
    id: 'mp3-to-wav',
    name: 'MP3 a WAV',
    description: 'Convierte audio MP3 a formato WAV sin compresión',
    inputFormat: 'mp3',
    outputFormat: 'wav',
    icon: FileAudio,
    acceptTypes: { 'audio/mp3': ['.mp3'] },
    category: 'media-convert'
  },
  {
    id: 'aac-to-mp3',
    name: 'AAC a MP3',
    description: 'Convierte audio AAC a MP3',
    inputFormat: 'aac',
    outputFormat: 'mp3',
    icon: Music,
    acceptTypes: { 'audio/aac': ['.aac'] },
    category: 'media-convert'
  },
  // Más conversiones de video populares
  {
    id: 'avi-to-mp4',
    name: 'AVI a MP4',
    description: 'Convierte video AVI a formato MP4 moderno',
    inputFormat: 'avi',
    outputFormat: 'mp4',
    icon: Film,
    acceptTypes: { 'video/x-msvideo': ['.avi'] },
    category: 'media-convert',
    maxFileSize: 800
  },
  {
    id: 'mov-to-mp4',
    name: 'MOV a MP4',
    description: 'Convierte video QuickTime MOV a MP4',
    inputFormat: 'mov',
    outputFormat: 'mp4',
    icon: Camera,
    acceptTypes: { 'video/quicktime': ['.mov'] },
    category: 'media-convert',
    maxFileSize: 800
  },
  {
    id: 'wmv-to-mp4',
    name: 'WMV a MP4',
    description: 'Convierte video Windows Media a MP4',
    inputFormat: 'wmv',
    outputFormat: 'mp4',
    icon: Video,
    acceptTypes: { 'video/x-ms-wmv': ['.wmv'] },
    category: 'media-convert',
    maxFileSize: 700
  },
  {
    id: 'mkv-to-mp4',
    name: 'MKV a MP4',
    description: 'Convierte video Matroska a MP4 compatible',
    inputFormat: 'mkv',
    outputFormat: 'mp4',
    icon: Film,
    acceptTypes: { 'video/x-matroska': ['.mkv'] },
    category: 'media-convert',
    maxFileSize: 1000
  },
  {
    id: 'webm-to-mp4',
    name: 'WEBM a MP4',
    description: 'Convierte video WEBM a MP4',
    inputFormat: 'webm',
    outputFormat: 'mp4',
    icon: Globe,
    acceptTypes: { 'video/webm': ['.webm'] },
    category: 'media-convert',
    maxFileSize: 600
  },
  // Más conversiones de documentos
  {
    id: 'rtf-to-pdf',
    name: 'RTF a PDF',
    description: 'Convierte Rich Text Format a PDF',
    inputFormat: 'rtf',
    outputFormat: 'pdf',
    icon: FileText,
    acceptTypes: { 'application/rtf': ['.rtf'] },
    category: 'document-convert'
  },
  {
    id: 'txt-to-pdf',
    name: 'TXT a PDF',
    description: 'Convierte archivo de texto plano a PDF',
    inputFormat: 'txt',
    outputFormat: 'pdf',
    icon: FileType,
    acceptTypes: { 'text/plain': ['.txt'] },
    category: 'document-convert'
  },
  {
    id: 'odt-to-pdf',
    name: 'ODT a PDF',
    description: 'Convierte OpenDocument Text a PDF',
    inputFormat: 'odt',
    outputFormat: 'pdf',
    icon: BookOpen,
    acceptTypes: { 'application/vnd.oasis.opendocument.text': ['.odt'] },
    category: 'document-convert'
  },
  {
    id: 'pages-to-pdf',
    name: 'Pages a PDF',
    description: 'Convierte documento Apple Pages a PDF',
    inputFormat: 'pages',
    outputFormat: 'pdf',
    icon: FileText,
    acceptTypes: { 'application/x-iwork-pages-sffpages': ['.pages'] },
    category: 'document-convert'
  },
  // eBooks (muy populares para monetización)
  {
    id: 'epub-to-pdf',
    name: 'EPUB a PDF',
    description: 'Convierte libro electrónico EPUB a PDF',
    inputFormat: 'epub',
    outputFormat: 'pdf',
    icon: BookOpen,
    acceptTypes: { 'application/epub+zip': ['.epub'] },
    category: 'ebook-convert'
  },
  {
    id: 'pdf-to-epub',
    name: 'PDF a EPUB',
    description: 'Convierte PDF a libro electrónico EPUB',
    inputFormat: 'pdf',
    outputFormat: 'epub',
    icon: BookOpen,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    category: 'ebook-convert'
  },
  {
    id: 'mobi-to-pdf',
    name: 'MOBI a PDF',
    description: 'Convierte eBook MOBI (Kindle) a PDF',
    inputFormat: 'mobi',
    outputFormat: 'pdf',
    icon: Smartphone,
    acceptTypes: { 'application/x-mobipocket-ebook': ['.mobi'] },
    category: 'ebook-convert'
  },
  // Formatos de archivo comprimido
  {
    id: 'rar-to-zip',
    name: 'RAR a ZIP',
    description: 'Convierte archivo RAR a ZIP',
    inputFormat: 'rar',
    outputFormat: 'zip',
    icon: Archive,
    acceptTypes: { 'application/vnd.rar': ['.rar'] },
    category: 'archive-convert',
    maxFileSize: 300
  },
  {
    id: '7z-to-zip',
    name: '7Z a ZIP',
    description: 'Convierte archivo 7-Zip a ZIP estándar',
    inputFormat: '7z',
    outputFormat: 'zip',
    icon: HardDrive,
    acceptTypes: { 'application/x-7z-compressed': ['.7z'] },
    category: 'archive-convert',
    maxFileSize: 400
  },
  // Formatos CAD y diseño
  {
    id: 'dwg-to-pdf',
    name: 'DWG a PDF',
    description: 'Convierte dibujo AutoCAD DWG a PDF',
    inputFormat: 'dwg',
    outputFormat: 'pdf',
    icon: Layers,
    acceptTypes: { 'application/acad': ['.dwg'] },
    category: 'design-convert'
  },
  {
    id: 'svg-to-png',
    name: 'SVG a PNG',
    description: 'Convierte gráfico vectorial SVG a imagen PNG',
    inputFormat: 'svg',
    outputFormat: 'png',
    icon: Palette,
    acceptTypes: { 'image/svg+xml': ['.svg'] },
    category: 'design-convert'
  },
  {
    id: 'eps-to-pdf',
    name: 'EPS a PDF',
    description: 'Convierte PostScript EPS a PDF',
    inputFormat: 'eps',
    outputFormat: 'pdf',
    icon: Image,
    acceptTypes: { 'application/postscript': ['.eps'] },
    category: 'design-convert'
  },
  // Formatos de código y desarrollo
  {
    id: 'markdown-to-pdf',
    name: 'Markdown a PDF',
    description: 'Convierte archivo Markdown a PDF formateado',
    inputFormat: 'md',
    outputFormat: 'pdf',
    icon: FileCode,
    acceptTypes: { 'text/markdown': ['.md'] },
    category: 'data-convert'
  },
  {
    id: 'json-to-csv',
    name: 'JSON a CSV',
    description: 'Convierte datos JSON a tabla CSV',
    inputFormat: 'json',
    outputFormat: 'csv',
    icon: Database,
    acceptTypes: { 'application/json': ['.json'] },
    category: 'data-convert'
  },
  {
    id: 'xml-to-json',
    name: 'XML a JSON',
    description: 'Convierte estructura XML a formato JSON',
    inputFormat: 'xml',
    outputFormat: 'json',
    icon: Code,
    acceptTypes: { 'application/xml': ['.xml'], 'text/xml': ['.xml'] },
    category: 'data-convert'
  },
  // Más formatos de hoja de cálculo
  {
    id: 'csv-to-excel',
    name: 'CSV a Excel',
    description: 'Convierte tabla CSV a hoja Excel XLSX',
    inputFormat: 'csv',
    outputFormat: 'xlsx',
    icon: FileSpreadsheet,
    acceptTypes: { 'text/csv': ['.csv'] },
    category: 'document-convert'
  },
  {
    id: 'ods-to-excel',
    name: 'ODS a Excel',
    description: 'Convierte OpenDocument Spreadsheet a Excel',
    inputFormat: 'ods',
    outputFormat: 'xlsx',
    icon: FileSpreadsheet,
    acceptTypes: { 'application/vnd.oasis.opendocument.spreadsheet': ['.ods'] },
    category: 'document-convert'
  },
  // Formatos de presentación
  {
    id: 'keynote-to-powerpoint',
    name: 'Keynote a PowerPoint',
    description: 'Convierte presentación Apple Keynote a PowerPoint',
    inputFormat: 'key',
    outputFormat: 'pptx',
    icon: Presentation,
    acceptTypes: { 'application/x-iwork-keynote-sffkey': ['.key'] },
    category: 'document-convert'
  },
  {
    id: 'odp-to-powerpoint',
    name: 'ODP a PowerPoint',
    description: 'Convierte OpenDocument Presentation a PowerPoint',
    inputFormat: 'odp',
    outputFormat: 'pptx',
    icon: Presentation,
    acceptTypes: { 'application/vnd.oasis.opendocument.presentation': ['.odp'] },
    category: 'document-convert'
  },
  // Formatos de imagen adicionales populares
  {
    id: 'heic-to-jpg',
    name: 'HEIC a JPG',
    description: 'Convierte foto iPhone HEIC a JPG universal',
    inputFormat: 'heic',
    outputFormat: 'jpg',
    icon: Camera,
    acceptTypes: { 'image/heic': ['.heic'], 'image/heif': ['.heif'] },
    category: 'image-convert'
  },
  {
    id: 'tiff-to-jpg',
    name: 'TIFF a JPG',
    description: 'Convierte imagen TIFF de alta calidad a JPG',
    inputFormat: 'tiff',
    outputFormat: 'jpg',
    icon: Image,
    acceptTypes: { 'image/tiff': ['.tiff', '.tif'] },
    category: 'image-convert'
  },
  {
    id: 'bmp-to-png',
    name: 'BMP a PNG',
    description: 'Convierte bitmap BMP a PNG optimizado',
    inputFormat: 'bmp',
    outputFormat: 'png',
    icon: FileImage,
    acceptTypes: { 'image/bmp': ['.bmp'] },
    category: 'image-convert'
  },
  {
    id: 'ico-to-png',
    name: 'ICO a PNG',
    description: 'Convierte icono ICO a imagen PNG',
    inputFormat: 'ico',
    outputFormat: 'png',
    icon: Zap,
    acceptTypes: { 'image/x-icon': ['.ico'] },
    category: 'image-convert'
  }
]

function App() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [selectedTool, setSelectedTool] = useState<ConversionTool>(CONVERSION_TOOLS[0])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [conversionState, setConversionState] = useState<ConversionState>({
    status: 'idle',
    progress: 0,
    message: ''
  })
  const [optimizationQuality, setOptimizationQuality] = useState<number>(75)
  const [resizeImage, setResizeImage] = useState<boolean>(true)
  // Estados para conversión de imágenes
  const [selectedInputFormat, setSelectedInputFormat] = useState<string>('jpg')
  const [selectedOutputFormat, setSelectedOutputFormat] = useState<string>('png')
  const [imageQuality, setImageQuality] = useState<number>(85)
  const [backgroundColor, setBackgroundColor] = useState<string>('white')
  const [enableResize, setEnableResize] = useState<boolean>(false)
  const [imageWidth, setImageWidth] = useState<number>(1920)
  // Estado para navegación por secciones
  const [activeSection, setActiveSection] = useState<'from-pdf' | 'to-pdf' | 'optimize' | 'image-convert' | 'pdf-tools' | 'media-convert' | 'document-convert' | 'ebook-convert' | 'archive-convert' | 'data-convert' | 'design-convert' | 'all'>('all')

  // Estados para el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Estados para las nuevas funcionalidades
  const [batchConversion, setBatchConversion] = useState<BatchConversionState>({
    files: [],
    overallProgress: 0,
    completed: 0,
    failed: 0,
    status: 'idle'
  })
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([])
  const [userSettings, setUserSettings] = useState<UserSettings>({
    defaultQuality: 85,
    preferredFormats: {},
    favoriteTools: [],
    theme: 'auto',
    showPreview: true,
    batchSize: 10,
    autoDownload: true
  })
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Estados para merge/split PDFs
  const [multipleFiles, setMultipleFiles] = useState<File[]>([])
  const [splitMode, setSplitMode] = useState<'pages' | 'range'>('pages')
  const [splitPages, setSplitPages] = useState<string>('1-10') // Rango como "1-5,8,10-12"

  // Analytics tracking
  const [conversionStartTime, setConversionStartTime] = useState<number>(0)

  // Effect para detectar tamaño de pantalla
  useEffect(() => {
    const checkMobileView = () => {
      // Incluir específicamente 1280x800 y resoluciones menores
      setIsMobileView(window.innerWidth <= 1280)
    }

    checkMobileView()
    window.addEventListener('resize', checkMobileView)

    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

  // Effect para cerrar menú móvil cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const validateFile = (file: File): boolean => {
    const acceptedExtensions = Object.values(selectedTool.acceptTypes).flat()
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    return acceptedExtensions.includes(fileExtension)
  }

  const detectOptimalTool = (file: File): ConversionTool | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    // Buscar herramientas de optimización que coincidan
    for (const tool of CONVERSION_TOOLS) {
      if (tool.isOptimization && Object.values(tool.acceptTypes).flat().includes(fileExtension)) {
        return tool
      }
    }

    // Si no hay herramienta de optimización, buscar conversión regular
    for (const tool of CONVERSION_TOOLS) {
      if (!tool.isOptimization && Object.values(tool.acceptTypes).flat().includes(fileExtension)) {
        return tool
      }
    }

    return null
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: selectedTool.acceptTypes,
    multiple: selectedTool.isMultiFile || userSettings.batchSize > 1,
    maxFiles: userSettings.batchSize,
    onDrop: async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0 && acceptedFiles.length === 0) {
        // Si no hay archivos aceptados, intentar detectar herramienta automáticamente
        if (rejectedFiles.length > 0) {
          const file = rejectedFiles[0].file
          const optimalTool = detectOptimalTool(file)

          if (optimalTool) {
            // Cambiar automáticamente a la herramienta detectada
            selectTool(optimalTool)
            setSelectedFile(file)
            setConversionState({
              status: 'idle',
              progress: 0,
              message: '',
              error: `Se detectó automáticamente: ${optimalTool.name}`
            })

            // Limpiar el error después de 3 segundos
            setTimeout(() => {
              setConversionState(prev => ({ ...prev, error: undefined }))
            }, 3000)
            return
          }
        }

        setConversionState({
          status: 'error',
          progress: 0,
          message: 'Archivo no válido',
          error: `Por favor selecciona un archivo ${Object.values(selectedTool.acceptTypes).flat().join(', ')} válido para ${selectedTool.name}`
        })
        return
      }

      if (acceptedFiles.length > 0) {
        // Manejar múltiples archivos - conversión por lotes o herramientas multi-archivo
        if (acceptedFiles.length > 1 || selectedTool.isMultiFile) {
          if (selectedTool.isMultiFile) {
            // Para herramientas como merge PDF
            setMultipleFiles(acceptedFiles)
          } else {
            // Para conversión por lotes
            addFilesToBatch(acceptedFiles)
          }

          setConversionState({
            status: 'idle',
            progress: 0,
            message: `${acceptedFiles.length} archivos agregados`,
            error: undefined
          })

          // Track multiple files upload
          acceptedFiles.forEach(file => trackFileUploaded(file.type, file.size))

          // Generar vista previa para el primer archivo si está habilitada
          if (userSettings.showPreview && acceptedFiles.length > 0) {
            const preview = await generatePreview(acceptedFiles[0])
            setFilePreview(preview)
          }
          return
        }

        // Manejar archivo individual
        const file = acceptedFiles[0]

        if (!validateFile(file)) {
          // Intentar detectar herramienta automáticamente
          const optimalTool = detectOptimalTool(file)

          if (optimalTool) {
            selectTool(optimalTool)
            setSelectedFile(file)
            setConversionState({
              status: 'idle',
              progress: 0,
              message: '',
              error: `Se cambió automáticamente a: ${optimalTool.name}`
            })

            // Limpiar el mensaje después de 3 segundos
            setTimeout(() => {
              setConversionState(prev => ({ ...prev, error: undefined }))
            }, 3000)
            return
          }

          setConversionState({
            status: 'error',
            progress: 0,
            message: 'Formato de archivo incorrecto',
            error: `El archivo seleccionado no es compatible con ${selectedTool.name}. Formatos aceptados: ${Object.values(selectedTool.acceptTypes).flat().join(', ')}`
          })
          return
        }

        setSelectedFile(file)
        setConversionState({ status: 'idle', progress: 0, message: '' })

        // Generar vista previa si está habilitada
        if (userSettings.showPreview) {
          const preview = await generatePreview(file)
          setFilePreview(preview)
        }

        // Track file upload
        trackFileUploaded(file.type, file.size)
      }
    }
  })

  const convertFile = async () => {
    // Validar que tengamos archivos según el tipo de herramienta
    if (selectedTool.isMultiFile && multipleFiles.length === 0) return
    if (!selectedTool.isMultiFile && !selectedFile) return

    // Track conversion start
    const startTime = Date.now()
    setConversionStartTime(startTime)
    trackConversionStarted(selectedTool.inputFormat, selectedTool.outputFormat, selectedTool.name)

    try {
      setConversionState({
        status: 'uploading',
        progress: 10,
        message: selectedTool.isOptimization ? 'Preparando optimización...' :
                selectedTool.isMultiFile ? 'Preparando merge de PDFs...' :
                selectedTool.isSplitTool ? 'Preparando división de PDF...' :
                'Preparando conversión...'
      })

      // Crear job en CloudConvert
      const apiKey = import.meta.env.VITE_CLOUDCONVERT_API_KEY
      const inputFormat = selectedTool.inputFormat
      const outputFormat = selectedTool.outputFormat

      // Crear parámetros de procesamiento específicos
      const createProcessingParams = () => {
        // Merge PDFs
        if (selectedTool.isMultiFile) {
          return {
            operation: 'merge',
            output_format: 'pdf'
          }
        }

        // Split PDF
        if (selectedTool.isSplitTool) {
          const params: any = {
            operation: 'split',
            output_format: 'pdf'
          }

          if (splitMode === 'pages') {
            params.pages_per_file = parseInt(splitPages)
          } else if (splitMode === 'range') {
            // Convertir formato "1-5,8-12" a formato CloudConvert
            const ranges = splitPages.split(',').map(range => {
              const [start, end] = range.trim().split('-')
              return end ? `${start}-${end}` : start
            })
            params.ranges = ranges
          }

          return params
        }

        // Conversión de imágenes
        if (selectedTool.isImageConverter && selectedTool.imageConversionSettings) {
          const params: any = {
            operation: 'convert',
            input_format: selectedInputFormat,
            output_format: selectedOutputFormat
          }

          if (selectedTool.imageConversionSettings.supportsQuality) {
            params.quality = imageQuality
          }

          if (selectedTool.imageConversionSettings.supportsBackground && selectedOutputFormat === 'jpg' && backgroundColor !== 'transparent') {
            params.background = backgroundColor
          }

          if (selectedTool.imageConversionSettings.supportsResize && enableResize) {
            params.fit = 'scale'
            params.width = imageWidth
          }

          return params
        }

        // Optimización
        if (selectedTool.isOptimization && selectedTool.optimizationSettings) {
          const settings = selectedTool.optimizationSettings

          switch (settings.type) {
            case 'pdf':
              return {
                operation: 'optimize',
                compress_images: true,
                image_quality: optimizationQuality,
                remove_unused_objects: true,
                compress_content_streams: true
              }

            case 'image':
              const params: any = {
                operation: 'convert',
                output_format: 'jpg',
                quality: optimizationQuality
              }

              if (resizeImage && settings.maxWidth) {
                params.fit = 'scale'
                params.width = settings.maxWidth
              }

              return params

            case 'video':
              return {
                operation: 'convert',
                output_format: 'mp4',
                video_codec: settings.videoCodec || 'h264',
                preset: settings.preset || 'medium',
                video_resolution: `${optimizationQuality}p`
              }

            default:
              return { operation: 'convert', output_format: outputFormat }
          }
        }

        // Conversión regular
        return { operation: 'convert', output_format: outputFormat }
      }

      // Crear payload según el tipo de operación
      let jobPayload: any

      if (selectedTool.isMultiFile) {
        // Payload para merge de múltiples PDFs
        const tasks: any = {}

        // Crear tareas de upload para cada archivo
        multipleFiles.forEach((_, index) => {
          tasks[`upload-pdf-${index}`] = {
            operation: 'import/upload'
          }
        })

        // Tarea de merge
        tasks['merge-pdf'] = {
          ...createProcessingParams(),
          input: multipleFiles.map((_, index) => `upload-pdf-${index}`)
        }

        // Tarea de export
        tasks['export-pdf'] = {
          operation: 'export/url',
          input: 'merge-pdf'
        }

        jobPayload = { tasks }
      } else {
        // Payload regular para un solo archivo
        jobPayload = {
          tasks: {
            [`upload-${inputFormat}`]: {
              operation: 'import/upload'
            },
            [`process-${selectedTool.isImageConverter ? selectedOutputFormat : outputFormat}`]: {
              ...createProcessingParams(),
              input: `upload-${inputFormat}`
            },
            [`export-${selectedTool.isImageConverter ? selectedOutputFormat : outputFormat}`]: {
              operation: 'export/url',
              input: `process-${selectedTool.isImageConverter ? selectedOutputFormat : outputFormat}`
            }
          }
        }
      }

      const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobPayload)
      })

      if (!jobResponse.ok) {
        const errorText = await jobResponse.text()
        throw new Error(`Error ${jobResponse.status}: ${errorText}`)
      }

      const jobData = await jobResponse.json()

      if (selectedTool.isMultiFile) {
        // Subir múltiples archivos para merge
        setConversionState({
          status: 'uploading',
          progress: 30,
          message: `Subiendo ${multipleFiles.length} archivos PDF...`
        })

        for (let i = 0; i < multipleFiles.length; i++) {
          const uploadTask = jobData.data.tasks.find((task: any) => task.name === `upload-pdf-${i}`)

          const formData = new FormData()
          Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
            formData.append(key, value as string)
          })
          formData.append('file', multipleFiles[i])

          const uploadResponse = await fetch(uploadTask.result.form.url, {
            method: 'POST',
            body: formData
          })

          if (!uploadResponse.ok) {
            throw new Error(`Error subiendo archivo ${i + 1}`)
          }

          // Actualizar progreso
          setConversionState({
            status: 'uploading',
            progress: 30 + (i + 1) * (20 / multipleFiles.length),
            message: `Subido archivo ${i + 1} de ${multipleFiles.length}...`
          })
        }
      } else {
        // Subir un solo archivo
        const uploadTask = jobData.data.tasks.find((task: any) => task.name === `upload-${inputFormat}`)

        setConversionState({
          status: 'uploading',
          progress: 30,
          message: `Subiendo archivo ${inputFormat.toUpperCase()}...`
        })

        const formData = new FormData()
        Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
        formData.append('file', selectedFile!)

        const uploadResponse = await fetch(uploadTask.result.form.url, {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error('Error subiendo archivo')
        }
      }

      const finalOutputFormat = selectedTool.isImageConverter ? selectedOutputFormat : outputFormat

      setConversionState({
        status: 'converting',
        progress: 50,
        message: selectedTool.isMultiFile
          ? 'Combinando archivos PDF...'
          : selectedTool.isSplitTool
          ? 'Dividiendo archivo PDF...'
          : selectedTool.isOptimization
          ? `Optimizando ${inputFormat.toUpperCase()}...`
          : selectedTool.isImageConverter
          ? `Convirtiendo ${selectedInputFormat.toUpperCase()} a ${selectedOutputFormat.toUpperCase()}...`
          : `Convirtiendo ${inputFormat.toUpperCase()} a ${outputFormat.toUpperCase()}...`
      })

      // Esperar procesamiento
      let processTask: any
      if (selectedTool.isMultiFile) {
        processTask = jobData.data.tasks.find((task: any) => task.name === 'merge-pdf')
      } else {
        processTask = jobData.data.tasks.find((task: any) => task.name === `process-${finalOutputFormat}`)
      }
      await waitForCompletion(processTask.id)

      setConversionState({
        status: 'downloading',
        progress: 90,
        message: selectedTool.isMultiFile
          ? 'Descargando PDF combinado...'
          : selectedTool.isSplitTool
          ? 'Descargando archivos divididos...'
          : `Descargando archivo ${
              selectedTool.isOptimization
                ? 'optimizado'
                : selectedTool.isImageConverter
                ? finalOutputFormat.toUpperCase()
                : outputFormat.toUpperCase()
            }...`
      })

      // Descargar resultado
      let exportTask: any
      if (selectedTool.isMultiFile) {
        exportTask = jobData.data.tasks.find((task: any) => task.name === 'export-pdf')
      } else {
        exportTask = jobData.data.tasks.find((task: any) => task.name === `export-${finalOutputFormat}`)
      }

      const taskResponse = await fetch(`https://api.cloudconvert.com/v2/tasks/${exportTask.id}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CLOUDCONVERT_API_KEY}`
        }
      })

      const taskData = await taskResponse.json()
      const resultFile = taskData.data.result.files[0]
      const downloadUrl = resultFile?.url || ''
      const cloudConvertFilename = resultFile?.filename || 'archivo_convertido'

      console.log('✅ Descargando:', cloudConvertFilename, `(${resultFile.size} bytes)`)

      const fileResponse = await fetch(downloadUrl)
      const blob = await fileResponse.blob()

      // Generar nombre de archivo correcto
      let filename = cloudConvertFilename
      const currentOutputFormat = selectedTool.isImageConverter ? selectedOutputFormat : outputFormat

      if (filename.endsWith(`.${inputFormat}.${currentOutputFormat}`)) {
        filename = filename.replace(`.${inputFormat}.${currentOutputFormat}`, `.${currentOutputFormat}`)
      } else if (!filename.includes(`.${currentOutputFormat}`)) {
        const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'archivo_convertido'
        filename = selectedTool.isOptimization
          ? `${baseName}_optimizado.${currentOutputFormat}`
          : selectedTool.isImageConverter
          ? `${baseName}_convertido_${selectedInputFormat}_a_${selectedOutputFormat}.${currentOutputFormat}`
          : `${baseName}.${currentOutputFormat}`
      }

      console.log('✅ Guardando como:', filename)
      saveAs(blob, filename)

      // Track successful conversion
      const duration = Date.now() - conversionStartTime
      trackConversionCompleted(selectedTool.inputFormat, selectedTool.outputFormat, selectedTool.name, duration)

      setConversionState({
        status: 'completed',
        progress: 100,
        message: selectedTool.isOptimization
          ? 'Optimización completada exitosamente'
          : 'Conversión completada exitosamente'
      })

    } catch (error) {
      console.error('Error en conversión CloudConvert:', error)

      // Track conversion error
      const errorMessage = getErrorMessage(error)
      trackConversionError(selectedTool.inputFormat, selectedTool.outputFormat, selectedTool.name, errorMessage)

      setConversionState({
        status: 'error',
        progress: 0,
        message: 'Error en la conversión',
        error: errorMessage
      })
    }
  }

  const waitForCompletion = async (taskId: string): Promise<void> => {
    const maxAttempts = 60
    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.cloudconvert.com/v2/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CLOUDCONVERT_API_KEY}`
        }
      })

      const taskData = await response.json()
      const task = taskData.data

      if (task.status === 'finished') {
        return
      }

      if (task.status === 'error') {
        throw new Error('Error en la conversión')
      }

      const progress = 50 + (attempts / maxAttempts) * 35
      setConversionState({
        status: 'converting',
        progress,
        message: `Convirtiendo... ${Math.round(progress)}%`
      })

      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++
    }

    throw new Error('Timeout: La conversión tomó demasiado tiempo')
  }


  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error

    if (error?.message) {
      if (error.message.includes('402') || error.message.includes('CREDITS_EXCEEDED')) {
        return 'Has alcanzado el límite de conversiones gratuitas. Recarga créditos en tu cuenta de CloudConvert para continuar.'
      }
      if (error.message.includes('403')) {
        return 'API de CloudConvert no autorizada. Verificando configuración...'
      }
      if (error.message.includes('401')) {
        return 'API key inválida. Verifica tu configuración de CloudConvert.'
      }
      if (error.message.includes('429')) {
        return 'Límite de conversiones alcanzado. Intenta más tarde.'
      }
      return error.message
    }

    return 'Error desconocido en la conversión'
  }

  const resetConverter = () => {
    setSelectedFile(null)
    setMultipleFiles([])
    setConversionState({ status: 'idle', progress: 0, message: '' })
  }

  const selectTool = (tool: ConversionTool) => {
    setSelectedTool(tool)
    setSelectedFile(null)
    setMultipleFiles([])
    setConversionState({ status: 'idle', progress: 0, message: '' })

    // Track tool selection
    trackToolSelection(tool.name, tool.category)

    if (tool.isOptimization && tool.optimizationSettings?.defaultQuality) {
      setOptimizationQuality(tool.optimizationSettings.defaultQuality)
    }
  }

  const getFilteredTools = (category: string) => {
    if (category === 'all') {
      return CONVERSION_TOOLS
    }
    return CONVERSION_TOOLS.filter(tool => tool.category === category)
  }

  const getSectionTitle = (category: string) => {
    switch (category) {
      case 'from-pdf': return 'Desde PDF'
      case 'to-pdf': return 'Hacia PDF'
      case 'optimize': return 'Herramientas de Optimización'
      case 'image-convert': return 'Conversión de Imágenes'
      case 'pdf-tools': return 'Herramientas PDF'
      case 'media-convert': return 'Audio y Video'
      case 'document-convert': return 'Documentos'
      case 'ebook-convert': return 'eBooks'
      case 'archive-convert': return 'Archivos Comprimidos'
      case 'data-convert': return 'Datos'
      case 'design-convert': return 'Diseño y CAD'
      default: return 'Todas las Herramientas'
    }
  }

  const getSectionIcon = (category: string) => {
    switch (category) {
      case 'from-pdf': return FileText
      case 'to-pdf': return FileText
      case 'optimize': return Settings
      case 'image-convert': return Image
      case 'pdf-tools': return Combine
      case 'media-convert': return Film
      case 'document-convert': return FileSpreadsheet
      case 'ebook-convert': return BookOpen
      case 'archive-convert': return Archive
      case 'data-convert': return Database
      case 'design-convert': return Layers
      default: return Grid
    }
  }

  // Función para obtener el label de la sección activa
  const getActiveSectionLabel = () => {
    const menuItems = [
      { id: 'all', label: 'Todas', icon: Grid },
      { id: 'from-pdf', label: 'Desde PDF', icon: FileText },
      { id: 'to-pdf', label: 'Hacia PDF', icon: FileText },
      { id: 'pdf-tools', label: 'PDF Tools', icon: Combine },
      { id: 'optimize', label: 'Optimizar', icon: Settings },
      { id: 'image-convert', label: 'Imágenes', icon: Image },
      { id: 'media-convert', label: 'Audio/Video', icon: Film },
      { id: 'document-convert', label: 'Documentos', icon: FileSpreadsheet },
      { id: 'ebook-convert', label: 'eBooks', icon: BookOpen },
      { id: 'archive-convert', label: 'Archivos', icon: Archive },
      { id: 'data-convert', label: 'Datos', icon: Database },
      { id: 'design-convert', label: 'Diseño', icon: Layers }
    ]
    const activeItem = menuItems.find(item => item.id === activeSection)
    return activeItem ? activeItem.label : 'Herramientas'
  }

  // Funciones para conversión por lotes
  const addFilesToBatch = (files: File[]) => {
    const newFiles: FileWithProgress[] = files.map(file => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: 'pending'
    }))

    setBatchConversion(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles]
    }))
  }

  const removeFileFromBatch = (id: string) => {
    setBatchConversion(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== id)
    }))
  }

  const processBatchConversion = async () => {
    setBatchConversion(prev => ({ ...prev, status: 'processing' }))

    for (let i = 0; i < batchConversion.files.length; i++) {
      const fileItem = batchConversion.files[i]

      try {
        setBatchConversion(prev => ({
          ...prev,
          files: prev.files.map(f =>
            f.id === fileItem.id ? { ...f, status: 'processing' } : f
          )
        }))

        // Simular conversión individual
        await new Promise(resolve => setTimeout(resolve, 2000))

        setBatchConversion(prev => ({
          ...prev,
          files: prev.files.map(f =>
            f.id === fileItem.id ? {
              ...f,
              status: 'completed',
              progress: 100,
              downloadUrl: `converted_${f.file.name}`
            } : f
          ),
          completed: prev.completed + 1,
          overallProgress: ((i + 1) / batchConversion.files.length) * 100
        }))

        // Agregar al historial
        addToHistory(fileItem.file, selectedTool)

      } catch (error) {
        setBatchConversion(prev => ({
          ...prev,
          files: prev.files.map(f =>
            f.id === fileItem.id ? {
              ...f,
              status: 'error',
              error: 'Error en conversión'
            } : f
          ),
          failed: prev.failed + 1
        }))
      }
    }

    setBatchConversion(prev => ({ ...prev, status: 'completed' }))
  }

  // Funciones para historial
  const addToHistory = (file: File, tool: ConversionTool) => {
    const historyItem: ConversionHistory = {
      id: crypto.randomUUID(),
      fileName: file.name,
      inputFormat: file.name.split('.').pop() || '',
      outputFormat: tool.outputFormat,
      tool: tool.name,
      date: new Date(),
      fileSize: file.size,
      isFavorite: false
    }

    setConversionHistory(prev => [historyItem, ...prev].slice(0, 50))
  }

  const toggleFavorite = (id: string) => {
    setConversionHistory(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    )
  }

  const clearHistory = () => {
    setConversionHistory([])
  }

  // Función para vista previa
  const generatePreview = async (file: File): Promise<FilePreview | null> => {
    const url = URL.createObjectURL(file)

    if (file.type.startsWith('image/')) {
      return { url, type: 'image' }
    } else if (file.type === 'application/pdf') {
      return { url, type: 'pdf' }
    } else if (file.type.startsWith('video/')) {
      return { url, type: 'video' }
    } else if (file.type.startsWith('audio/')) {
      return { url, type: 'audio' }
    }

    return null
  }


  const getFileSizeLimit = (tool: ConversionTool): number => {
    // If tool has specific maxFileSize, use it
    if (tool.maxFileSize) return tool.maxFileSize

    // Otherwise, determine based on category and input format
    switch (tool.category) {
      case 'media-convert':
        if (tool.inputFormat.includes('video') || tool.outputFormat === 'mp4') return 500 // 500MB for videos
        if (tool.inputFormat.includes('audio') || tool.outputFormat === 'mp3') return 50  // 50MB for audio
        return 100
      case 'image-convert':
      case 'optimize':
        if (tool.optimizationSettings?.type === 'video') return 500
        if (tool.optimizationSettings?.type === 'image' || tool.isImageConverter) return 25 // 25MB for images
        return 100 // PDFs and other optimizations
      case 'pdf-tools':
        return 50 // 50MB per PDF for merge/split
      case 'archive-convert':
        return 200 // 200MB for compressed files
      case 'design-convert':
        return 100 // 100MB for CAD/design files
      case 'ebook-convert':
        return 20 // 20MB for eBooks
      case 'data-convert':
        return 10 // 10MB for data files (JSON, XML, CSV)
      case 'document-convert':
        return 30 // 30MB for documents
      case 'from-pdf':
      case 'to-pdf':
      default:
        return 50 // 50MB default for PDF conversions
    }
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: isDarkMode ? 'linear-gradient(to bottom right, #0f172a, #1e293b, #334155)' : 'linear-gradient(to bottom right, #dbeafe, #ffffff, #faf5ff)' }}>
      {/* Navigation Bar - Fixed position */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', backdropFilter: 'blur(8px)' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between py-3">
            {/* Navigation - Desktop/Mobile Adaptive */}
            {isMobileView ? (
              // Mobile Menu
              <div className="relative" ref={mobileMenuRef}>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
                  }}
                >
                  <Menu className="h-4 w-4" />
                  <span>{getActiveSectionLabel()}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMobileMenuOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg border z-50"
                    style={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      borderColor: isDarkMode ? '#374151' : '#e5e7eb'
                    }}
                  >
                    {[
                      { id: 'all', label: 'Todas', icon: Grid },
                      { id: 'from-pdf', label: 'Desde PDF', icon: FileText },
                      { id: 'to-pdf', label: 'Hacia PDF', icon: FileText },
                      { id: 'pdf-tools', label: 'PDF Tools', icon: Combine },
                      { id: 'optimize', label: 'Optimizar', icon: Settings },
                      { id: 'image-convert', label: 'Imágenes', icon: Image },
                      { id: 'media-convert', label: 'Audio/Video', icon: Film },
                      { id: 'document-convert', label: 'Documentos', icon: FileSpreadsheet },
                      { id: 'ebook-convert', label: 'eBooks', icon: BookOpen },
                      { id: 'archive-convert', label: 'Archivos', icon: Archive },
                      { id: 'data-convert', label: 'Datos', icon: Database },
                      { id: 'design-convert', label: 'Diseño', icon: Layers }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => {
                          setActiveSection(id as any)
                          setIsMobileMenuOpen(false)
                        }}
                        className={`flex items-center space-x-3 w-full px-4 py-3 text-left text-sm transition-all duration-150 first:rounded-t-lg last:rounded-b-lg ${
                          activeSection === id
                            ? 'font-medium'
                            : 'hover:font-medium'
                        }`}
                        style={{
                          backgroundColor: activeSection === id
                            ? (isDarkMode ? '#3b82f620' : '#dbeafe')
                            : 'transparent',
                          color: activeSection === id
                            ? '#3b82f6'
                            : (isDarkMode ? '#e5e7eb' : '#374151')
                        }}
                        onMouseEnter={(e) => {
                          if (activeSection !== id) {
                            e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f8fafc'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeSection !== id) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Desktop Navigation Tabs
              <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'all', label: 'Todas', icon: Grid },
                  { id: 'from-pdf', label: 'Desde PDF', icon: FileText },
                  { id: 'to-pdf', label: 'Hacia PDF', icon: FileText },
                  { id: 'pdf-tools', label: 'PDF Tools', icon: Combine },
                  { id: 'optimize', label: 'Optimizar', icon: Settings },
                  { id: 'image-convert', label: 'Imágenes', icon: Image },
                  { id: 'media-convert', label: 'Audio/Video', icon: Film },
                  { id: 'document-convert', label: 'Documentos', icon: FileSpreadsheet },
                  { id: 'ebook-convert', label: 'eBooks', icon: BookOpen },
                  { id: 'archive-convert', label: 'Archivos', icon: Archive },
                  { id: 'data-convert', label: 'Datos', icon: Database },
                  { id: 'design-convert', label: 'Diseño', icon: Layers }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id as any)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeSection === id
                        ? 'shadow-md transform scale-105'
                        : 'hover:shadow-sm hover:scale-102'
                    }`}
                    style={{
                      backgroundColor: activeSection === id
                        ? (isDarkMode ? '#3b82f620' : '#dbeafe')
                        : 'transparent',
                      color: activeSection === id ? '#3b82f6' : 'var(--text-secondary)',
                      borderColor: activeSection === id ? '#3b82f6' : 'transparent'
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                {/* History button */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 rounded-lg transition-all duration-200 hover:shadow-sm"
                  style={{
                    backgroundColor: showHistory ? (isDarkMode ? '#3b82f620' : '#dbeafe') : 'transparent',
                    color: showHistory ? '#3b82f6' : (isDarkMode ? '#e5e7eb' : '#6b7280')
                  }}
                  title="Historial de conversiones"
                >
                  <History className="h-4 w-4" />
                </button>

                {/* Settings button */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg transition-all duration-200 hover:shadow-sm"
                  style={{
                    backgroundColor: showSettings ? (isDarkMode ? '#3b82f620' : '#dbeafe') : 'transparent',
                    color: showSettings ? '#3b82f6' : (isDarkMode ? '#e5e7eb' : '#6b7280')
                  }}
                  title="Configuración"
                >
                  <Settings className="h-4 w-4" />
                </button>

                {/* Dark Mode Toggle - Smaller size */}
                <div className="transform scale-75">
                  <DarkModeToggle isDark={isDarkMode} onToggle={toggleDarkMode} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            style={{
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff'
            }}
          >
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
              <h2 className="text-xl font-bold" style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>
                Historial de Conversiones
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {conversionHistory.length === 0 ? (
                <div className="text-center py-12" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay conversiones en el historial</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversionHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
                        borderColor: isDarkMode ? '#4b5563' : '#e2e8f0'
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium" style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>
                              {item.fileName}
                            </p>
                            <p className="text-sm" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                              {item.inputFormat.toUpperCase()} → {item.outputFormat.toUpperCase()} • {item.tool}
                            </p>
                            <p className="text-xs" style={{ color: isDarkMode ? '#6b7280' : '#9ca3af' }}>
                              {new Date(item.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            item.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        {item.downloadUrl && (
                          <button className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900">
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-between" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
              <button
                onClick={clearHistory}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 inline mr-2" />
                Limpiar Historial
              </button>
              <p className="text-sm self-center" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                {conversionHistory.length} conversiones
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            style={{
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff'
            }}
          >
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
              <h2 className="text-xl font-bold" style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>
                Configuración
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Quality Settings */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                  Calidad por defecto: {userSettings.defaultQuality}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={userSettings.defaultQuality}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, defaultQuality: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>

              {/* Batch Size */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                  Archivos por lote: {userSettings.batchSize}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={userSettings.batchSize}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>

              {/* Toggle Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>Vista previa automática</span>
                  <button
                    onClick={() => setUserSettings(prev => ({ ...prev, showPreview: !prev.showPreview }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      userSettings.showPreview ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userSettings.showPreview ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>Descarga automática</span>
                  <button
                    onClick={() => setUserSettings(prev => ({ ...prev, autoDownload: !prev.autoDownload }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      userSettings.autoDownload ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userSettings.autoDownload ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl" style={{ paddingTop: 'clamp(6rem, 8rem, 10rem)' }}>

        {/* Hero Section */}
        <section className="text-center mb-16 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 -z-10">
            <div className={`absolute top-10 left-10 w-20 h-20 rounded-full blur-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/30'}`}></div>
            <div className={`absolute bottom-10 right-10 w-32 h-32 rounded-full blur-xl ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-400/30'}`}></div>
            <div className={`absolute top-1/2 left-1/2 w-40 h-40 rounded-full blur-2xl ${isDarkMode ? 'bg-green-500/10' : 'bg-green-400/20'} -translate-x-1/2 -translate-y-1/2`}></div>
          </div>

          <div className="mb-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-center mb-6"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl mr-4 shadow-lg"
              >
                <Grid className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                ConvertPro
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              El conversor de archivos más completo.{' '}
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Más de 60 formatos
              </span>{' '}
              soportados
            </motion.p>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-8"
            >
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">60+</div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Formatos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">100%</div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Gratis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">⚡</div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Rápido</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">🔒</div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Seguro</div>
              </div>
            </motion.div>

            {/* Features badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto"
            >
              {['PDF ↔ Word', 'Video → MP3', 'HEIC → JPG', 'EPUB → PDF', 'Merge PDFs', 'Split PDFs'].map((feature, index) => (
                <motion.span
                  key={feature}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: 'rgb(59, 130, 246)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}
                >
                  {feature}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Tool Selector */}
        <div className="mb-10">
          <div className="rounded-2xl border p-8 transition-all duration-300" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-center mb-8">
              {(() => {
                const SectionIcon = getSectionIcon(activeSection)
                return (
                  <>
                    <SectionIcon className="h-6 w-6 mr-3" style={{ color: 'var(--text-primary)' }} />
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {getSectionTitle(activeSection)}
                    </h2>
                  </>
                )
              })()}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredTools(activeSection).map((tool, index) => {
                const IconComponent = tool.icon
                const isSelected = selectedTool.id === tool.id

                // Determine color scheme based on category
                const getColorScheme = () => {
                  switch (tool.category) {
                    case 'from-pdf':
                    case 'to-pdf':
                      return {
                        border: isSelected ? '#3b82f6' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#1e3a8a20' : '#dbeafe') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#3b82f6' : 'var(--text-tertiary)'
                      }
                    case 'optimize':
                      return {
                        border: isSelected ? '#ea580c' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#ea580c20' : '#fed7aa') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#ea580c' : 'var(--text-tertiary)'
                      }
                    case 'image-convert':
                      return {
                        border: isSelected ? '#7c3aed' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#7c3aed20' : '#e9d5ff') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#7c3aed' : 'var(--text-tertiary)'
                      }
                    case 'pdf-tools':
                      return {
                        border: isSelected ? '#059669' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#05966920' : '#d1fae5') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#059669' : 'var(--text-tertiary)'
                      }
                    case 'media-convert':
                      return {
                        border: isSelected ? '#dc2626' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#dc262620' : '#fee2e2') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#dc2626' : 'var(--text-tertiary)'
                      }
                    case 'document-convert':
                      return {
                        border: isSelected ? '#0891b2' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#0891b220' : '#cffafe') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#0891b2' : 'var(--text-tertiary)'
                      }
                    case 'ebook-convert':
                      return {
                        border: isSelected ? '#9333ea' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#9333ea20' : '#f3e8ff') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#9333ea' : 'var(--text-tertiary)'
                      }
                    case 'archive-convert':
                      return {
                        border: isSelected ? '#65a30d' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#65a30d20' : '#ecfccb') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#65a30d' : 'var(--text-tertiary)'
                      }
                    case 'data-convert':
                      return {
                        border: isSelected ? '#be185d' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#be185d20' : '#fce7f3') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#be185d' : 'var(--text-tertiary)'
                      }
                    case 'design-convert':
                      return {
                        border: isSelected ? '#ca8a04' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#ca8a0420' : '#fef3c7') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#ca8a04' : 'var(--text-tertiary)'
                      }
                    default:
                      return {
                        border: isSelected ? '#3b82f6' : 'var(--border-secondary)',
                        bg: isSelected ? (isDarkMode ? '#1e3a8a20' : '#dbeafe') : 'var(--bg-tertiary)',
                        icon: isSelected ? '#3b82f6' : 'var(--text-tertiary)'
                      }
                  }
                }

                const colors = getColorScheme()

                return (
                  <motion.button
                    key={tool.id}
                    onClick={() => selectTool(tool)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      isSelected
                        ? 'shadow-lg'
                        : 'border-transparent hover:border-gray-300 hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isSelected ? 1.05 : 1,
                      boxShadow: isSelected
                        ? "0 15px 35px rgba(0,0,0,0.2)"
                        : "0 4px 15px rgba(0,0,0,0.1)"
                    }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    whileHover={{
                      scale: 1.03,
                      y: -5,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{
                      scale: 0.98,
                      transition: { duration: 0.1 }
                    }}
                  >
                    {tool.category === 'optimize' || tool.category === 'image-convert' || tool.category === 'pdf-tools' || tool.category === 'media-convert' || tool.category === 'document-convert' || tool.category === 'ebook-convert' || tool.category === 'archive-convert' || tool.category === 'data-convert' || tool.category === 'design-convert' ? (
                      <motion.div
                        className="flex items-center mb-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                      >
                        <motion.div
                          initial={{ rotate: -180, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <IconComponent className="h-5 w-5 mr-2" style={{ color: colors.icon }} />
                        </motion.div>
                        <motion.span
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                        >
                          {tool.name}
                        </motion.span>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="flex items-center justify-between mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                      >
                        <motion.div
                          className="flex items-center"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                          {/* Source Icon */}
                          {tool.inputFormat === 'pdf' ? (
                            <motion.svg
                              className="h-5 w-5 mr-2"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.4 }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              <motion.path
                                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9.5 11.5C9.5 12.3 8.8 13 8 13H7V15H5.5V9H8C8.8 9 9.5 9.7 9.5 10.5V11.5M14.5 13.5C14.5 14.3 13.8 15 13 15H10.5V9H13C13.8 9 14.5 9.7 14.5 10.5V13.5M18.5 10.5H17V11.5H18.5V13H17V15H15.5V9H18.5V10.5M12 10.5H13V13.5H12V10.5M7 10.5H8V11.5H7V10.5Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                              />
                            </motion.svg>
                          ) : tool.inputFormat === 'docx' ? (
                            <motion.svg
                              className="h-5 w-5 mr-2"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.4 }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              <motion.path
                                d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.2,20H13.8L12,13.2L10.2,20H8.8L6.6,11H8.1L9.5,17.8L11.3,11H12.6L14.4,17.8L15.8,11H17.3L15.2,20M13,9V3.5L18.5,9H13Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                              />
                            </motion.svg>
                          ) : tool.inputFormat === 'xlsx' ? (
                            <motion.svg
                              className="h-5 w-5 mr-2"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.4 }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              <motion.path
                                d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 5.97 8.89H4.16L6.05 12.08L4 15.28H5.78M13.88 19.5V17H8.25V19.5M13.88 15.75V12.63H12V15.75M13.88 11.38V8.25H12V11.38M13.88 7V4.5H8.25V7M20.75 19.5V17H15.13V19.5M20.75 15.75V12.63H15.13V15.75M20.75 11.38V8.25H15.13V11.38M20.75 7V4.5H15.13V7Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                              />
                            </motion.svg>
                          ) : tool.inputFormat === 'pptx' ? (
                            <motion.svg
                              className="h-5 w-5 mr-2"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.4 }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              <motion.path
                                d="M13.25 3.25Q14.46 3.25 15.58 3.56 16.7 3.88 17.67 4.45 18.64 5 19.44 5.81 20.23 6.61 20.8 7.58 21.38 8.55 21.69 9.67 22 10.79 22 12 22 13.21 21.69 14.33 21.38 15.45 20.8 16.42 20.23 17.39 19.44 18.19 18.64 19 17.67 19.55 16.7 20.13 15.58 20.44 14.46 20.75 13.25 20.75 12.18 20.75 11.15 20.5 10.12 20.24 9.2 19.76 8.28 19.27 7.5 18.58 6.69 17.88 6.07 17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.25 2.5 7 2.83 7H6.07Q6.69 6.12 7.5 5.42 8.28 4.72 9.2 4.24 10.13 3.76 11.15 3.5 12.18 3.25 13.25 3.25M13.88 4.53V11.37H20.72Q20.6 10 20.03 8.81 19.46 7.62 18.55 6.7 17.64 5.79 16.43 5.22 15.23 4.65 13.88 4.53M9.5 10.84Q9.5 10.27 9.3 9.87 9.11 9.46 8.78 9.21 8.45 8.95 8 8.84 7.55 8.72 7 8.72H4.37V15.27H5.91V13H6.94Q7.42 13 7.87 12.84 8.33 12.7 8.69 12.43 9.05 12.17 9.27 11.76 9.5 11.36 9.5 10.84M13.25 19.5Q14.23 19.5 15.14 19.26 16.04 19 16.85 18.58 17.66 18.13 18.33 17.5 19 16.89 19.5 16.13 20 15.36 20.33 14.47 20.64 13.58 20.72 12.62H12.64V4.53Q11.19 4.65 9.91 5.29 8.63 5.93 7.67 7H11.17Q11.5 7 11.76 7.25 12 7.5 12 7.83V16.17Q12 16.5 11.76 16.76 11.5 17 11.17 17H7.67Q8.2 17.6 8.84 18.06 9.5 18.5 10.19 18.84 10.91 19.17 11.68 19.33 12.45 19.5 13.25 19.5M6.85 10Q7.32 10 7.61 10.19 7.89 10.38 7.89 10.89 7.89 11.11 7.79 11.25 7.69 11.39 7.53 11.5 7.37 11.57 7.18 11.6 7 11.64 6.8 11.64H5.91V10H6.85Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                              />
                            </motion.svg>
                          ) : tool.inputFormat === 'html' ? (
                            <motion.svg
                              className="h-5 w-5 mr-2"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.4 }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              <motion.path
                                d="M12,17.56L16.07,16.43L16.62,10.33H9.38L9.2,8.3H16.8L17,6.31H7L7.56,12.32H14.45L14.22,14.9L12,15.5L9.78,14.9L9.64,13.24H7.64L7.93,16.43L12,17.56M4.07,3H19.93L18.5,19.2L12,21L5.5,19.2L4.07,3Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                              />
                            </motion.svg>
                          ) : (tool.inputFormat === 'jpg' || tool.inputFormat === 'image') ? (
                            <motion.svg
                              className="h-5 w-5 mr-2"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.4 }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              <motion.path
                                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9 13.5C9 14.6 8.1 15 7 15S5 14.6 5 13.5V12H6.5V13.5H7.5V9H9V13.5M14 11.5C14 12.3 13.3 13 12.5 13H11.5V15H10V9H12.5C13.3 9 14 9.7 14 10.5V11.5M19 10.5H16.5V13.5H17.5V12H19V13.7C19 14.4 18.5 15 17.7 15H16.4C15.6 15 15.1 14.3 15.1 13.7V10.4C15 9.7 15.5 9 16.3 9H17.6C18.4 9 18.9 9.7 18.9 10.3V10.5M11.5 10.5H12.5V11.5H11.5V10.5Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                              />
                            </motion.svg>
                          ) : (
                            <IconComponent className="h-5 w-5 mr-2" style={{ color: colors.icon }} />
                          )}
                          <motion.span
                            className="font-medium"
                            style={{ color: 'var(--text-primary)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                          >
                            {tool.name}
                          </motion.span>
                        </motion.div>

                        {/* Arrow Animation */}
                        <motion.div
                          className="flex items-center mx-2"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                        >
                          <motion.svg
                            className="h-4 w-4"
                            style={{ fill: colors.icon }}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            initial={{ x: -10 }}
                            animate={{ x: 0 }}
                            transition={{
                              duration: 0.5,
                              delay: 0.7,
                              repeat: Infinity,
                              repeatType: "reverse",
                              repeatDelay: 2
                            }}
                          >
                            <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                          </motion.svg>
                        </motion.div>

                        {/* Target Icon */}
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                        >
                          {tool.outputFormat === 'pdf' ? (
                            <motion.svg
                              className="h-5 w-5"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.7 }}
                              whileHover={{ scale: 1.1, rotate: -5 }}
                            >
                              <motion.path
                                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9.5 11.5C9.5 12.3 8.8 13 8 13H7V15H5.5V9H8C8.8 9 9.5 9.7 9.5 10.5V11.5M14.5 13.5C14.5 14.3 13.8 15 13 15H10.5V9H13C13.8 9 14.5 9.7 14.5 10.5V13.5M18.5 10.5H17V11.5H18.5V13H17V15H15.5V9H18.5V10.5M12 10.5H13V13.5H12V10.5M7 10.5H8V11.5H7V10.5Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                              />
                            </motion.svg>
                          ) : tool.outputFormat === 'docx' ? (
                            <motion.svg
                              className="h-5 w-5"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.7 }}
                              whileHover={{ scale: 1.1, rotate: -5 }}
                            >
                              <motion.path
                                d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.2,20H13.8L12,13.2L10.2,20H8.8L6.6,11H8.1L9.5,17.8L11.3,11H12.6L14.4,17.8L15.8,11H17.3L15.2,20M13,9V3.5L18.5,9H13Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                              />
                            </motion.svg>
                          ) : tool.outputFormat === 'xlsx' ? (
                            <motion.svg
                              className="h-5 w-5"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.7 }}
                              whileHover={{ scale: 1.1, rotate: -5 }}
                            >
                              <motion.path
                                d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 5.97 8.89H4.16L6.05 12.08L4 15.28H5.78M13.88 19.5V17H8.25V19.5M13.88 15.75V12.63H12V15.75M13.88 11.38V8.25H12V11.38M13.88 7V4.5H8.25V7M20.75 19.5V17H15.13V19.5M20.75 15.75V12.63H15.13V15.75M20.75 11.38V8.25H15.13V11.38M20.75 7V4.5H15.13V7Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                              />
                            </motion.svg>
                          ) : tool.outputFormat === 'pptx' ? (
                            <motion.svg
                              className="h-5 w-5"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.7 }}
                              whileHover={{ scale: 1.1, rotate: -5 }}
                            >
                              <motion.path
                                d="M13.25 3.25Q14.46 3.25 15.58 3.56 16.7 3.88 17.67 4.45 18.64 5 19.44 5.81 20.23 6.61 20.8 7.58 21.38 8.55 21.69 9.67 22 10.79 22 12 22 13.21 21.69 14.33 21.38 15.45 20.8 16.42 20.23 17.39 19.44 18.19 18.64 19 17.67 19.55 16.7 20.13 15.58 20.44 14.46 20.75 13.25 20.75 12.18 20.75 11.15 20.5 10.12 20.24 9.2 19.76 8.28 19.27 7.5 18.58 6.69 17.88 6.07 17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.25 2.5 7 2.83 7H6.07Q6.69 6.12 7.5 5.42 8.28 4.72 9.2 4.24 10.13 3.76 11.15 3.5 12.18 3.25 13.25 3.25M13.88 4.53V11.37H20.72Q20.6 10 20.03 8.81 19.46 7.62 18.55 6.7 17.64 5.79 16.43 5.22 15.23 4.65 13.88 4.53M9.5 10.84Q9.5 10.27 9.3 9.87 9.11 9.46 8.78 9.21 8.45 8.95 8 8.84 7.55 8.72 7 8.72H4.37V15.27H5.91V13H6.94Q7.42 13 7.87 12.84 8.33 12.7 8.69 12.43 9.05 12.17 9.27 11.76 9.5 11.36 9.5 10.84M13.25 19.5Q14.23 19.5 15.14 19.26 16.04 19 16.85 18.58 17.66 18.13 18.33 17.5 19 16.89 19.5 16.13 20 15.36 20.33 14.47 20.64 13.58 20.72 12.62H12.64V4.53Q11.19 4.65 9.91 5.29 8.63 5.93 7.67 7H11.17Q11.5 7 11.76 7.25 12 7.5 12 7.83V16.17Q12 16.5 11.76 16.76 11.5 17 11.17 17H7.67Q8.2 17.6 8.84 18.06 9.5 18.5 10.19 18.84 10.91 19.17 11.68 19.33 12.45 19.5 13.25 19.5M6.85 10Q7.32 10 7.61 10.19 7.89 10.38 7.89 10.89 7.89 11.11 7.79 11.25 7.69 11.39 7.53 11.5 7.37 11.57 7.18 11.6 7 11.64 6.8 11.64H5.91V10H6.85Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                              />
                            </motion.svg>
                          ) : tool.outputFormat === 'html' ? (
                            <motion.svg
                              className="h-5 w-5"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.7 }}
                              whileHover={{ scale: 1.1, rotate: -5 }}
                            >
                              <motion.path
                                d="M12,17.56L16.07,16.43L16.62,10.33H9.38L9.2,8.3H16.8L17,6.31H7L7.56,12.32H14.45L14.22,14.9L12,15.5L9.78,14.9L9.64,13.24H7.64L7.93,16.43L12,17.56M4.07,3H19.93L18.5,19.2L12,21L5.5,19.2L4.07,3Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                              />
                            </motion.svg>
                          ) : (tool.outputFormat === 'jpg' || tool.outputFormat === 'image') ? (
                            <motion.svg
                              className="h-5 w-5"
                              style={{ fill: colors.icon }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.7 }}
                              whileHover={{ scale: 1.1, rotate: -5 }}
                            >
                              <motion.path
                                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9 13.5C9 14.6 8.1 15 7 15S5 14.6 5 13.5V12H6.5V13.5H7.5V9H9V13.5M14 11.5C14 12.3 13.3 13 12.5 13H11.5V15H10V9H12.5C13.3 9 14 9.7 14 10.5V11.5M19 10.5H16.5V13.5H17.5V12H19V13.7C19 14.4 18.5 15 17.7 15H16.4C15.6 15 15.1 14.3 15.1 13.7V10.4C15 9.7 15.5 9 16.3 9H17.6C18.4 9 18.9 9.7 18.9 10.3V10.5M11.5 10.5H12.5V11.5H11.5V10.5Z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                              />
                            </motion.svg>
                          ) : (
                            <IconComponent className="h-5 w-5" style={{ color: colors.icon }} />
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                    <motion.p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.9 }}
                    >
                      {tool.description}
                    </motion.p>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Converter */}
        <div className="rounded-2xl border overflow-hidden mb-12 transition-all duration-300" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-xl)' }}>
          <div className="p-8">

            {/* File Upload */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-blue-400'
                  : selectedFile
                  ? 'border-green-400'
                  : 'hover:border-gray-400'
              }`}
              style={{
                borderColor: isDragActive ? '#60a5fa' : selectedFile ? '#34d399' : 'var(--border-secondary)',
                backgroundColor: isDragActive ? (isDarkMode ? '#1e3a8a20' : '#dbeafe') : selectedFile ? (isDarkMode ? '#04731430' : '#dcfce7') : 'transparent'
              }}
            >
              <input {...getInputProps()} />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              >
                <Upload className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} size={48} />
              </motion.div>

              {/* Mostrar archivos múltiples para merge */}
              {multipleFiles.length > 0 && selectedTool.isMultiFile ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring" }}
                >
                  <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {multipleFiles.length} archivos seleccionados para merge
                  </p>
                  <div className="space-y-1">
                    {multipleFiles.map((file, index) => (
                      <p key={index} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {file.name}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Los archivos se combinarán en el orden mostrado
                  </p>
                </motion.div>
              ) : selectedFile ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring" }}
                >
                  <motion.div
                    className="flex items-center justify-center mb-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <selectedTool.icon className="h-6 w-6 mr-2 text-green-600" />
                    </motion.div>
                    <motion.p
                      className="text-green-600 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Archivo seleccionado:
                    </motion.p>
                  </motion.div>
                  <motion.p
                    style={{ color: 'var(--text-primary)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {selectedFile.name}
                  </motion.p>
                  <motion.p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </motion.p>

                  {/* File Preview */}
                  {filePreview && userSettings.showPreview && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-4 relative group"
                    >
                      <div
                        className="relative overflow-hidden rounded-lg border-2 cursor-pointer"
                        style={{
                          borderColor: isDarkMode ? '#374151' : '#e5e7eb'
                        }}
                        onClick={() => {
                          // Open preview in modal
                          const modal = window.open('', '_blank')
                          if (modal) {
                            modal.document.write(`
                              <html>
                                <head><title>Vista Previa - ${selectedFile.name}</title></head>
                                <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
                                  ${filePreview.type === 'image'
                                    ? `<img src="${filePreview.url}" style="max-width:100%;max-height:100%;object-fit:contain;" />`
                                    : filePreview.type === 'pdf'
                                    ? `<iframe src="${filePreview.url}" style="width:100%;height:100%;border:none;" />`
                                    : filePreview.type === 'video'
                                    ? `<video src="${filePreview.url}" controls style="max-width:100%;max-height:100%;" />`
                                    : filePreview.type === 'audio'
                                    ? `<audio src="${filePreview.url}" controls style="width:300px;" />`
                                    : '<p style="color:white;">Vista previa no disponible</p>'
                                  }
                                </body>
                              </html>
                            `)
                          }
                        }}
                      >
                        {filePreview.type === 'image' && (
                          <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <img
                              src={filePreview.url}
                              alt="Preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        )}
                        {filePreview.type === 'pdf' && (
                          <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="h-12 w-12 mx-auto mb-2 text-red-600" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">Documento PDF</p>
                              <p className="text-xs text-gray-500">Click para ver completo</p>
                            </div>
                          </div>
                        )}
                        {filePreview.type === 'video' && (
                          <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <div className="text-center">
                              <Video className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">Video</p>
                              <p className="text-xs text-gray-500">Click para reproducir</p>
                            </div>
                          </div>
                        )}
                        {filePreview.type === 'audio' && (
                          <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <div className="text-center">
                              <Headphones className="h-12 w-12 mx-auto mb-2 text-green-600" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">Audio</p>
                              <p className="text-xs text-gray-500">Click para reproducir</p>
                            </div>
                          </div>
                        )}

                        {/* Preview overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                              <Eye className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview close button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFilePreview(null)
                        }}
                        className="absolute top-2 right-2 bg-gray-900 bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="flex items-center justify-center mb-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <selectedTool.icon className="h-6 w-6 mr-2" style={{ color: 'var(--text-tertiary)' }} />
                    </motion.div>
                    <motion.p
                      className="mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {selectedTool.name}
                    </motion.p>
                  </motion.div>
                  <motion.p
                    className="mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {selectedTool.isMultiFile
                      ? `Arrastra múltiples archivos ${selectedTool.inputFormat.toUpperCase()} aquí o haz click para seleccionar`
                      : `Arrastra un archivo ${selectedTool.inputFormat.toUpperCase()} aquí o haz click para seleccionar`
                    }
                  </motion.p>
                  <motion.p
                    className="text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Solo archivos {Object.values(selectedTool.acceptTypes).flat().join(', ')} • Máximo {getFileSizeLimit(selectedTool)}MB
                  </motion.p>
                </motion.div>
              )}
            </div>

            {/* Optimization Controls */}
            {selectedTool.isOptimization && selectedTool.optimizationSettings && (
              <div className="mt-6 p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <Settings className="h-5 w-5 mr-2" />
                  Configuración de Optimización
                </h3>

                {/* Quality Control */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {selectedTool.optimizationSettings.type === 'pdf' ? 'Nivel de Compresión' :
                     selectedTool.optimizationSettings.type === 'image' ? 'Calidad de Imagen' :
                     'Resolución de Video'}
                  </label>

                  {/* Quality Levels Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {selectedTool.optimizationSettings.qualityLevels?.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setOptimizationQuality(level.value)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                          optimizationQuality === level.value
                            ? 'border-orange-500 shadow-md'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        style={{
                          backgroundColor: optimizationQuality === level.value
                            ? (isDarkMode ? '#ea580c20' : '#fed7aa')
                            : 'var(--bg-secondary)',
                          borderColor: optimizationQuality === level.value ? '#ea580c' : 'var(--border-secondary)'
                        }}
                      >
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{level.label}</div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{level.description}</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Quality Slider */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Personalizado:</span>
                      <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                        {selectedTool.optimizationSettings.type === 'video' ? `${optimizationQuality}p` : `${optimizationQuality}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={selectedTool.optimizationSettings.type === 'video' ? 480 : 30}
                      max={selectedTool.optimizationSettings.type === 'video' ? 1080 : 100}
                      value={optimizationQuality}
                      onChange={(e) => setOptimizationQuality(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #ea580c 0%, #ea580c ${((optimizationQuality - (selectedTool.optimizationSettings.type === 'video' ? 480 : 30)) / ((selectedTool.optimizationSettings.type === 'video' ? 1080 : 100) - (selectedTool.optimizationSettings.type === 'video' ? 480 : 30))) * 100}%, #e5e7eb ${((optimizationQuality - (selectedTool.optimizationSettings.type === 'video' ? 480 : 30)) / ((selectedTool.optimizationSettings.type === 'video' ? 1080 : 100) - (selectedTool.optimizationSettings.type === 'video' ? 480 : 30))) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Image Resize Option */}
                {selectedTool.optimizationSettings.type === 'image' && selectedTool.optimizationSettings.supportsResize && (
                  <div className="mb-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resizeImage}
                        onChange={(e) => setResizeImage(e.target.checked)}
                        className="mr-3 h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Redimensionar automáticamente (máximo {selectedTool.optimizationSettings.maxWidth}px de ancho)
                      </span>
                    </label>
                  </div>
                )}

                {/* Info Box */}
                <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderLeft: '4px solid #ea580c' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <strong>💡 Consejo:</strong> {
                      selectedTool.optimizationSettings.type === 'pdf'
                        ? 'La compresión media ofrece el mejor balance entre calidad y tamaño.'
                        : selectedTool.optimizationSettings.type === 'image'
                        ? 'Para web usa 70%, para impresión usa 85%.'
                        : 'Para web usa 720p, para almacenamiento local usa 1080p.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Image Conversion Controls */}
            {selectedTool.isImageConverter && selectedTool.imageConversionSettings && (
              <div className="mt-6 p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <Image className="h-5 w-5 mr-2" />
                  Configuración de Conversión de Imágenes
                </h3>

                {/* Format Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Input Format */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Formato de Entrada
                    </label>
                    <select
                      value={selectedInputFormat}
                      onChange={(e) => setSelectedInputFormat(e.target.value)}
                      className="w-full p-3 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {selectedTool.imageConversionSettings.supportedInputFormats.map(format => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Output Format */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Formato de Salida
                    </label>
                    <select
                      value={selectedOutputFormat}
                      onChange={(e) => setSelectedOutputFormat(e.target.value)}
                      className="w-full p-3 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {selectedTool.imageConversionSettings.supportedOutputFormats.map(format => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quality Control */}
                {selectedTool.imageConversionSettings.supportsQuality && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Calidad de Imagen
                    </label>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Calidad:</span>
                        <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{imageQuality}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={imageQuality}
                        onChange={(e) => setImageQuality(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${(imageQuality - 50) / 50 * 100}%, #e5e7eb ${(imageQuality - 50) / 50 * 100}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Background Color for PNG with transparency */}
                {selectedTool.imageConversionSettings.supportsBackground && selectedOutputFormat === 'jpg' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Color de Fondo (para transparencias)
                    </label>
                    <div className="flex gap-3">
                      {['white', 'black', 'transparent'].map(color => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                            backgroundColor === color ? 'border-purple-500' : 'border-transparent hover:border-gray-300'
                          }`}
                          style={{
                            backgroundColor: backgroundColor === color
                              ? (isDarkMode ? '#7c3aed20' : '#e9d5ff')
                              : 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {color === 'white' ? 'Blanco' : color === 'black' ? 'Negro' : 'Transparente'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resize Options */}
                {selectedTool.imageConversionSettings.supportsResize && (
                  <div className="mb-6">
                    <label className="flex items-center cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={enableResize}
                        onChange={(e) => setEnableResize(e.target.checked)}
                        className="mr-3 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Redimensionar imagen
                      </span>
                    </label>

                    {enableResize && (
                      <div className="ml-7">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Ancho máximo (px)
                        </label>
                        <input
                          type="number"
                          value={imageWidth}
                          onChange={(e) => setImageWidth(Number(e.target.value))}
                          min="100"
                          max="4000"
                          className="w-32 p-2 rounded-lg border"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Info Box */}
                <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderLeft: '4px solid #7c3aed' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <strong>💡 Consejo:</strong> {
                      selectedOutputFormat === 'jpg'
                        ? 'JPG es ideal para fotos sin transparencia. Menor tamaño de archivo.'
                        : selectedOutputFormat === 'png'
                        ? 'PNG preserva transparencias y es ideal para gráficos con bordes definidos.'
                        : 'WEBP ofrece la mejor compresión manteniendo alta calidad.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Split PDF Configuration */}
            {selectedTool.isSplitTool && selectedFile && (
              <div className="mt-6 p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <SplitSquareHorizontal className="h-5 w-5 mr-2" />
                  Configuración de División
                </h3>

                {/* Split Mode Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Método de división
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setSplitMode('pages')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        splitMode === 'pages'
                          ? 'border-green-500 shadow-md'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        backgroundColor: splitMode === 'pages'
                          ? (isDarkMode ? '#05966920' : '#d1fae5')
                          : 'var(--bg-secondary)',
                        borderColor: splitMode === 'pages' ? '#059669' : 'var(--border-secondary)'
                      }}
                    >
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Por páginas</div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Dividir cada N páginas</div>
                    </button>
                    <button
                      onClick={() => setSplitMode('range')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        splitMode === 'range'
                          ? 'border-green-500 shadow-md'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        backgroundColor: splitMode === 'range'
                          ? (isDarkMode ? '#05966920' : '#d1fae5')
                          : 'var(--bg-secondary)',
                        borderColor: splitMode === 'range' ? '#059669' : 'var(--border-secondary)'
                      }}
                    >
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Por rango</div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Especificar páginas exactas</div>
                    </button>
                  </div>
                </div>

                {/* Split Configuration Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {splitMode === 'pages' ? 'Páginas por archivo' : 'Rango de páginas (ej: 1-5,8-12)'}
                  </label>
                  <input
                    type={splitMode === 'pages' ? 'number' : 'text'}
                    value={splitPages}
                    onChange={(e) => setSplitPages(e.target.value)}
                    min={splitMode === 'pages' ? '1' : undefined}
                    placeholder={splitMode === 'pages' ? '5' : '1-10,15-20'}
                    className="w-full p-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Info Box */}
                <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderLeft: '4px solid #059669' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <strong>💡 Consejo:</strong> {
                      splitMode === 'pages'
                        ? 'Cada archivo tendrá el número de páginas especificado (excepto el último que puede tener menos).'
                        : 'Usa formato "inicio-fin" separado por comas. Ej: "1-3,7-10" creará 2 archivos.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Convert Button */}
            {((selectedFile && !selectedTool.isMultiFile) || (multipleFiles.length > 0 && selectedTool.isMultiFile)) && conversionState.status === 'idle' && (
              <div className="flex justify-center mt-8 space-x-4">
                <button
                  onClick={convertFile}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-3"
                >
                  <selectedTool.icon className="h-5 w-5" />
                  <span>
                    {selectedTool.isMultiFile ? 'Combinar PDFs' :
                     selectedTool.isSplitTool ? 'Dividir PDF' :
                     `Convertir a ${selectedTool.outputFormat.toUpperCase()}`}
                  </span>
                </button>

                {/* Batch Conversion Button */}
                {batchConversion.files.length > 0 && (
                  <button
                    onClick={processBatchConversion}
                    disabled={batchConversion.status === 'processing'}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-3"
                  >
                    {batchConversion.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <FolderOpen className="h-5 w-5" />
                    )}
                    <span>
                      {batchConversion.status === 'processing'
                        ? `Procesando ${batchConversion.files.length} archivos...`
                        : `Convertir Lote (${batchConversion.files.length})`
                      }
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Progress */}
            {conversionState.status !== 'idle' && conversionState.status !== 'completed' && (
              <div className="mt-8 rounded-xl border overflow-hidden relative" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', height: '300px' }}>
                <LoadingAnimation
                  text={conversionState.status === 'uploading' ? 'Subiendo' :
                        conversionState.status === 'converting' ? 'Convirtiendo' :
                        conversionState.status === 'downloading' ? 'Descargando' : 'Procesando'}
                />
              </div>
            )}

            {/* Success */}
            {conversionState.status === 'completed' && (
              <div className="mt-8 p-6 rounded-xl border text-center transition-colors duration-300" style={{ backgroundColor: isDarkMode ? '#04731430' : '#dcfce7', borderColor: isDarkMode ? '#10b981' : '#86efac' }}>
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2" style={{ color: isDarkMode ? '#34d399' : '#047857' }}>¡Conversión completada!</h3>
                <p className="mb-6" style={{ color: isDarkMode ? '#6ee7b7' : '#059669' }}>Tu archivo Word ha sido descargado exitosamente</p>
                <button
                  onClick={resetConverter}
                  className="font-semibold py-3 px-6 rounded-lg border transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                  }}
                >
                  Convertir otro archivo
                </button>
              </div>
            )}

            {/* Error */}
            {conversionState.status === 'error' && (
              <div className="mt-8 p-6 rounded-xl border text-center transition-colors duration-300" style={{ backgroundColor: isDarkMode ? '#7f1d1d30' : '#fef2f2', borderColor: isDarkMode ? '#ef4444' : '#fca5a5' }}>
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2" style={{ color: isDarkMode ? '#f87171' : '#991b1b' }}>Error en la conversión</h3>
                <p className="mb-6" style={{ color: isDarkMode ? '#fca5a5' : '#b91c1c' }}>{conversionState.error || 'Por favor, intenta de nuevo'}</p>
                <button
                  onClick={resetConverter}
                  className="font-semibold py-3 px-6 rounded-lg border transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                  }}
                >
                  Intentar de nuevo
                </button>
              </div>
            )}

            {/* Batch Conversion Panel */}
            {batchConversion.files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-xl border"
                style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : '#e5e7eb'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>
                    Conversión por Lotes ({batchConversion.files.length} archivos)
                  </h3>
                  <button
                    onClick={() => setBatchConversion({ files: [], overallProgress: 0, completed: 0, failed: 0, status: 'idle' })}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Overall Progress */}
                {batchConversion.status === 'processing' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                      <span>Progreso general</span>
                      <span>{Math.round(batchConversion.overallProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${batchConversion.overallProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* File List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {batchConversion.files.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
                        borderColor: isDarkMode ? '#4b5563' : '#e2e8f0'
                      }}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="relative">
                          {fileItem.status === 'completed' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {fileItem.status === 'processing' && (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          )}
                          {fileItem.status === 'error' && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          {fileItem.status === 'pending' && (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>
                            {fileItem.file.name}
                          </p>
                          <p className="text-sm" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                            {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {fileItem.error && (
                            <p className="text-sm text-red-500 mt-1">{fileItem.error}</p>
                          )}
                        </div>

                        {/* Progress bar for individual file */}
                        {fileItem.status === 'processing' && (
                          <div className="w-24">
                            <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                              <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${fileItem.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {fileItem.downloadUrl && fileItem.status === 'completed' && (
                          <button
                            onClick={() => {
                              // Simulate download
                              const a = document.createElement('a')
                              a.href = fileItem.downloadUrl
                              a.download = fileItem.file.name.replace(/\.[^/.]+$/, `.${selectedTool.outputFormat}`)
                              a.click()
                            }}
                            className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => removeFileFromBatch(fileItem.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Batch Summary */}
                {batchConversion.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }}>
                    <div className="flex justify-between items-center">
                      <div className="text-sm" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                        <span className="text-green-600 font-medium">{batchConversion.completed} completados</span>
                        {batchConversion.failed > 0 && (
                          <span className="text-red-600 font-medium ml-4">{batchConversion.failed} fallidos</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          // Download all completed files
                          batchConversion.files
                            .filter(f => f.status === 'completed' && f.downloadUrl)
                            .forEach(f => {
                              const a = document.createElement('a')
                              a.href = f.downloadUrl!
                              a.download = f.file.name.replace(/\.[^/.]+$/, `.${selectedTool.outputFormat}`)
                              a.click()
                            })
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Descargar Todos</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-16 pb-8 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                  <Grid className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ConvertPro
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                El conversor de archivos más completo y confiable. Convierte más de 60 formatos de manera gratuita y segura.
              </p>
              <div className="flex space-x-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer"
                >
                  <span className="text-white text-xs font-bold">f</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center cursor-pointer"
                >
                  <span className="text-white text-xs font-bold">t</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center cursor-pointer"
                >
                  <span className="text-white text-xs font-bold">ig</span>
                </motion.div>
              </div>
            </div>

            {/* Popular Tools */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Herramientas Populares
              </h3>
              <ul className="space-y-2 text-sm">
                {['PDF a Word', 'Video a MP3', 'HEIC a JPG', 'Comprimir PDF', 'Merge PDFs', 'Split PDFs'].map(tool => (
                  <li key={tool}>
                    <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {tool}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Formatos */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Formatos Soportados
              </h3>
              <ul className="space-y-2 text-sm">
                {['Documentos (PDF, Word, Excel)', 'Imágenes (JPG, PNG, HEIC)', 'Audio (MP3, WAV, FLAC)', 'Video (MP4, AVI, MOV)', 'eBooks (EPUB, MOBI)', 'Archivos (ZIP, RAR, 7Z)'].map(format => (
                  <li key={format}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {format}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Info */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Información
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Términos de Servicio
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center space-x-6 text-sm mb-4 md:mb-0">
              <p style={{ color: 'var(--text-tertiary)' }}>
                &copy; 2025 ConvertPro. Todos los derechos reservados.
              </p>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span style={{ color: 'var(--text-tertiary)' }}>Todos los sistemas operativos</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lock className="h-3 w-3 text-green-600" />
                <span style={{ color: 'var(--text-tertiary)' }}>Conexión segura</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App