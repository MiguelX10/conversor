export type ConversionState = 'idle' | 'ready' | 'converting' | 'completed' | 'error'

export interface ConversionOptions {
  preserveFormatting: boolean
  extractImages?: boolean
  maintainLayout?: boolean
  ocrText?: boolean
  quality?: 'low' | 'medium' | 'high'
}

export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}