const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');

class PDFController {
  
  static async processPDF(pdfBuffer, filename, originalName) {
    try {
      console.log('🔄 Iniciando procesamiento de PDF...');
      
      const pdfData = await pdfParse(pdfBuffer);
      
      const result = {
        filename: originalName,
        uploadedFilename: filename,
        pages: pdfData.numpages,
        extractedText: pdfData.text,
        textLength: pdfData.text.length,
        info: pdfData.info,
        metadata: pdfData.metadata,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ PDF procesado exitosamente:', {
        pages: result.pages,
        textLength: result.textLength,
        hasInfo: !!result.info,
        hasMetadata: !!result.metadata
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error procesando PDF:', error);
      throw new Error(`Error al procesar PDF: ${error.message}`);
    }
  }
  
  static async sendToN8N(data) {
    try {
      if (!process.env.N8N_PDF_WEBHOOK_URL) {
        throw new Error('N8N_PDF_WEBHOOK_URL no configurada');
      }
      
      console.log('📤 Enviando datos a N8N...');
      console.log('📊 Tamaño del texto:', data.extractedText.length, 'caracteres');
      
      const response = await axios.post(process.env.N8N_PDF_WEBHOOK_URL, {
        type: 'pdf-document',
        ...data
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Respuesta de N8N recibida:', response.status);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Error enviando a N8N:', error.message);
      throw error;
    }
  }
  
  static prepareVectorData(pdfData) {
    // Preparar datos para vectorización
    const vectorData = {
      content: pdfData.extractedText,
      metadata: {
        filename: pdfData.filename,
        pages: pdfData.pages,
        timestamp: pdfData.timestamp,
        source: 'pdf-upload',
        ...pdfData.info
      },
      chunks: this.splitTextIntoChunks(pdfData.extractedText)
    };
    
    return vectorData;
  }
  
  static splitTextIntoChunks(text, chunkSize = 800, overlap = 100) {
    const chunks = [];
    let start = 0;
    
    // Limitar el número máximo de chunks para evitar problemas de memoria
    const maxChunks = 50;
    
    while (start < text.length && chunks.length < maxChunks) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.substring(start, end);
      
      chunks.push({
        content: chunk,
        index: chunks.length,
        start: start,
        end: end
      });
      
      start = end - overlap;
      if (start >= text.length) break;
    }
    
    console.log(`📊 Texto dividido en ${chunks.length} chunks de ~${chunkSize} caracteres`);
    
    return chunks;
  }
  
  static cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Archivo temporal eliminado:', filePath);
      }
    } catch (error) {
      console.error('❌ Error eliminando archivo:', error);
    }
  }
}

module.exports = PDFController;
