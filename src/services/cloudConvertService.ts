export interface CloudConvertProgress {
  status: 'uploading' | 'converting' | 'downloading' | 'completed' | 'error'
  progress: number
  message: string
  jobId?: string
}

export interface CloudConvertResult {
  blob: Blob
  filename: string
  size: number
}

export class CloudConvertService {
  private apiKey: string
  private baseUrl = 'https://api.cloudconvert.com/v2'

  constructor() {
    this.apiKey = import.meta.env.VITE_CLOUDCONVERT_API_KEY

    if (!this.apiKey || this.apiKey === 'demo_key_for_testing') {
      console.warn('⚠️ CloudConvert API key no configurada. Usando modo demo.')
    }
  }

  /**
   * Convierte PDF a Word usando CloudConvert API
   */
  async convertPDFToWord(
    file: File,
    onProgress?: (progress: CloudConvertProgress) => void
  ): Promise<CloudConvertResult> {
    console.log('☁️ Iniciando conversión con CloudConvert')
    console.log(`📄 Archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    // Validaciones previas
    this.validateFile(file)

    try {
      // Paso 1: Crear Job
      onProgress?.({
        status: 'uploading',
        progress: 10,
        message: 'Creando trabajo de conversión...'
      })

      const job = await this.createJob()
      console.log('🔧 Job creado:', job.id)

      // Paso 2: Subir archivo
      onProgress?.({
        status: 'uploading',
        progress: 30,
        message: 'Subiendo PDF...',
        jobId: job.id
      })

      const uploadTask = await this.uploadFile(file, job)

      // Paso 3: Crear tarea de conversión
      onProgress?.({
        status: 'converting',
        progress: 50,
        message: 'Iniciando conversión...',
        jobId: job.id
      })

      const convertTask = await this.createConvertTask(job, uploadTask)

      // Paso 4: Esperar a que termine la conversión
      onProgress?.({
        status: 'converting',
        progress: 70,
        message: 'Convirtiendo PDF a Word...',
        jobId: job.id
      })

      await this.waitForCompletion(convertTask, onProgress)

      // Paso 5: Descargar resultado
      onProgress?.({
        status: 'downloading',
        progress: 90,
        message: 'Descargando Word convertido...',
        jobId: job.id
      })

      const result = await this.downloadResult(convertTask, file.name)

      onProgress?.({
        status: 'completed',
        progress: 100,
        message: 'Conversión CloudConvert completada',
        jobId: job.id
      })

      console.log('✅ Conversión CloudConvert completada')
      return result

    } catch (error) {
      console.error('❌ Error en CloudConvert:', error)

      onProgress?.({
        status: 'error',
        progress: 0,
        message: this.getErrorMessage(error)
      })

      throw error
    }
  }

  /**
   * Validar archivo antes de enviar
   */
  private validateFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF')
    }

    // CloudConvert límite gratuito: 25 conversiones/día, 1GB/archivo
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      throw new Error(`Archivo demasiado grande. Máximo: ${maxSize / 1024 / 1024}MB`)
    }

    if (file.size === 0) {
      throw new Error('El archivo está vacío')
    }
  }

  /**
   * Crear nuevo Job de conversión
   */
  private async createJob(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: {
          'upload-pdf': {
            operation: 'import/upload'
          },
          'convert-to-docx': {
            operation: 'convert',
            input: 'upload-pdf',
            output_format: 'docx',
            some_other_option: 'value'
          },
          'export-docx': {
            operation: 'export/url',
            input: 'convert-to-docx'
          }
        }
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Error creando job: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    console.log('🔧 DEBUG - Job created:', data)
    return data.data
  }

  /**
   * Subir archivo
   */
  private async uploadFile(file: File, job: any): Promise<any> {
    const uploadTask = job.tasks.find((task: any) => task.name === 'upload-pdf')

    if (!uploadTask || !uploadTask.result?.form) {
      throw new Error('No se pudo obtener URL de upload')
    }

    const formData = new FormData()

    // Agregar campos del formulario
    Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
      formData.append(key, value as string)
    })

    // Agregar archivo
    formData.append('file', file)

    const response = await fetch(uploadTask.result.form.url, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Error subiendo archivo: ${response.statusText}`)
    }

    console.log('📤 Archivo subido exitosamente')
    return uploadTask
  }

  /**
   * Crear tarea de conversión
   */
  private async createConvertTask(job: any, uploadTask: any): Promise<any> {
    // La conversión se inicia automáticamente con el job
    const convertTask = job.tasks.find((task: any) => task.name === 'convert-to-docx')

    if (!convertTask) {
      throw new Error('No se encontró tarea de conversión')
    }

    console.log('🔄 Tarea de conversión iniciada')
    return convertTask
  }

  /**
   * Esperar a que complete la conversión
   */
  private async waitForCompletion(
    convertTask: any,
    onProgress?: (progress: CloudConvertProgress) => void
  ): Promise<void> {
    const maxAttempts = 60 // 5 minutos máximo
    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await fetch(`${this.baseUrl}/tasks/${convertTask.id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error('Error verificando estado de conversión')
      }

      const taskData = await response.json()
      const task = taskData.data

      console.log(`🔍 Estado de conversión: ${task.status}`)

      if (task.status === 'finished') {
        console.log('✅ Conversión completada')
        return
      }

      if (task.status === 'error') {
        throw new Error(`Error en conversión: ${task.message}`)
      }

      // Actualizar progreso
      const progress = 70 + (attempts / maxAttempts) * 15
      onProgress?.({
        status: 'converting',
        progress,
        message: `Convirtiendo... (${attempts + 1}/${maxAttempts})`,
        jobId: convertTask.id
      })

      // Esperar 5 segundos antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    throw new Error('Timeout: La conversión tomó demasiado tiempo')
  }

  /**
   * Descargar archivo convertido
   */
  private async downloadResult(convertTask: any, originalFilename: string): Promise<CloudConvertResult> {
    // Obtener información de la tarea de exportación
    const response = await fetch(`${this.baseUrl}/tasks/${convertTask.id}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error('Error obteniendo resultado de conversión')
    }

    const taskData = await response.json()
    const task = taskData.data

    if (!task.result?.files?.[0]?.url) {
      throw new Error('No se pudo obtener URL de descarga')
    }

    console.log('🔗 URL de descarga obtenida:', task.result.files[0].url)

    // Descargar el archivo
    const fileResponse = await fetch(task.result.files[0].url)

    if (!fileResponse.ok) {
      throw new Error(`Error descargando archivo: ${fileResponse.statusText}`)
    }

    const blob = await fileResponse.blob()
    const filename = originalFilename.replace('.pdf', '.docx')

    console.log(`⬇️ Descarga completada: ${blob.size} bytes`)

    return {
      blob,
      filename,
      size: blob.size
    }
  }

  /**
   * Obtener mensaje de error legible
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error

    if (error?.message) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return 'Has alcanzado el límite de conversiones gratuitas de CloudConvert.'
      }
      if (error.message.includes('file too large')) {
        return 'El archivo es demasiado grande. Máximo permitido: 100MB.'
      }
      if (error.message.includes('timeout')) {
        return 'La conversión tomó demasiado tiempo. Intenta con un archivo más pequeño.'
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Error de conexión. Verifica tu internet e intenta de nuevo.'
      }

      return error.message
    }

    return 'Error desconocido en CloudConvert'
  }

  /**
   * Verificar estado de la API
   */
  async checkApiStatus(): Promise<{
    valid: boolean
    remaining: number
    plan: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        return {
          valid: true,
          remaining: userData.data.credits || 0,
          plan: userData.data.plan || 'free'
        }
      }

      return {
        valid: false,
        remaining: 0,
        plan: 'unknown'
      }
    } catch (error) {
      return {
        valid: false,
        remaining: 0,
        plan: 'unknown'
      }
    }
  }
}