console.log('🚨 TEST CONVERTER CARGADO')

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat, convertInchesToTwip } from 'docx'

export class TestConverter {
  constructor() {
    console.log('🚨 TEST CONVERTER CONSTRUCTOR')
  }

  async convertFile(file: File): Promise<Blob> {
    console.log('🚨 TEST CONVERTER - convertFile llamado')
    console.log('🚨 Archivo:', file.name, file.size, 'bytes')

    // Crear un documento Word simple con contenido fijo
    const testText = `DOCUMENTO DE PRUEBA

Archivo original: ${file.name}
Tamaño: ${(file.size / 1024).toFixed(1)} KB
Fecha: ${new Date().toLocaleString('es-ES')}

CONTENIDO DE PRUEBA:
Este es un documento Word generado con texto fijo para verificar que el proceso funciona correctamente.

Si ves este texto en lugar del código PDF, significa que el problema está en la extracción del PDF, no en la generación del Word.

PRÓXIMOS PASOS:
1. Verificar que este Word se descarga correctamente
2. Confirmar que no contiene código PDF
3. Implementar extracción real del PDF`

    const paragraphs = testText.split('\n').map(line =>
      new Paragraph({
        children: [
          new TextRun({
            text: line.trim(),
            size: 22,
          }),
        ],
        spacing: { after: 120 },
      })
    )

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    })

    console.log('🚨 Generando blob...')
    const blob = await Packer.toBlob(doc)
    console.log('🚨 Blob generado:', blob.size, 'bytes')

    return blob
  }

  async createWordFromText(text: string, fileName: string): Promise<Blob> {
    console.log('🚨 createWordFromText llamado')
    console.log('🚨 Texto recibido (primeros 300 chars):', text.substring(0, 300))
    console.log('🚨 Longitud total del texto:', text.length)

    console.log('🚨 Usando texto extraído directamente (sin filtros)')

    // Limpiar texto extraído para mejorar formato (preservando saltos de línea)
    text = text
      .replace(/ +/g, ' ')  // Múltiples espacios a uno, pero preservar \n
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // Espacios entre palabras pegadas
      .trim()

    // Procesar líneas con formato estructural
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    console.log(`🚨 Procesando ${lines.length} líneas con formato`)
    console.log(`🚨 Primeras 5 líneas:`, lines.slice(0, 5))

    const paragraphs: Paragraph[] = []
    let listLevel = 0

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      // Parsear marcadores de formato: TIPO|||TEXTO
      const parts = trimmedLine.split('|||')
      const elementType = parts[0] || 'PARAGRAPH'
      const elementText = parts[1] || trimmedLine

      console.log(`🔍 Procesando: ${elementType} - ${elementText.substring(0, 50)}...`)

      switch (elementType) {
        case 'HEADING1':
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: elementText,
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 300 },
          }))
          break

        case 'HEADING2':
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: elementText,
                bold: true,
                size: 26,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }))
          break

        case 'LIST_NUM':
          // Remover número del inicio si existe
          const cleanedNumText = elementText.replace(/^\d+\.\s*/, '')
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: cleanedNumText,
                size: 22,
              }),
            ],
            numbering: {
              reference: 'numbered-list',
              level: 0,
            },
            spacing: { after: 120 },
          }))
          break

        case 'LIST_BULLET':
          // Remover símbolo del inicio si existe
          const cleanedBulletText = elementText.replace(/^[•·▪▫-]\s*/, '')
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: cleanedBulletText,
                size: 22,
              }),
            ],
            bullet: {
              level: 0,
            },
            spacing: { after: 120 },
          }))
          break

        default: // PARAGRAPH
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: elementText,
                size: 22,
              }),
            ],
            spacing: { after: 120 },
          }))
          break
      }
    }

    const doc = new Document({
      numbering: {
        config: [{
          reference: 'numbered-list',
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.START,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
              },
            },
          }],
        }],
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: paragraphs,
      }],
    })

    console.log('🚨 Generando blob final...')
    const blob = await Packer.toBlob(doc)
    console.log('🚨 Blob final generado:', blob.size, 'bytes')

    return blob
  }
}