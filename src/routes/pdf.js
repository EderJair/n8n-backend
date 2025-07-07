const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const PDFController = require('../controllers/PDFController');

const router = express.Router();

// Configuración de multer para PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pdfs');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único con timestamp
    const uniqueName = `pdf-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    cb(null, uniqueName);
  }
});

// Filtro para solo aceptar PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  }
});

// Endpoint para procesar PDFs
router.post('/process-pdf', upload.single('pdf'), async (req, res) => {
  try {
    console.log('📄 Iniciando procesamiento de PDF...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha subido ningún archivo PDF'
      });
    }

    console.log('📁 Archivo recibido:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });

    // Leer el PDF
    const pdfBuffer = fs.readFileSync(req.file.path);

    // Procesar PDF usando el controlador
    const pdfData = await PDFController.processPDF(
      pdfBuffer, 
      req.file.filename, 
      req.file.originalname
    );

    // Agregar información del archivo
    pdfData.fileSize = req.file.size;
    pdfData.filePath = req.file.path;

    // Preparar datos vectorizados
    const vectorData = PDFController.prepareVectorData(pdfData);

    // MOSTRAR DATOS COMPLETOS EN CONSOLA
    console.log('========================================');
    console.log('📊 DATOS DESESTRUCTURADOS DEL PDF');
    console.log('========================================');
    
    console.log('📄 INFORMACION BASICA:');
    console.log('  - Nombre archivo:', pdfData.filename);
    console.log('  - Paginas:', pdfData.pages);
    console.log('  - Tamaño archivo:', req.file.size, 'bytes');
    console.log('  - Longitud texto:', pdfData.textLength, 'caracteres');
    console.log('  - Chunks generados:', vectorData.chunks.length);
    
    console.log('\n📋 METADATA DEL PDF:');
    console.log(JSON.stringify(pdfData.info, null, 2));
    
    console.log('\n📝 TEXTO EXTRAIDO (primeros 1000 caracteres):');
    console.log('--- INICIO TEXTO ---');
    const textPreview = pdfData.extractedText.substring(0, 1000);
    console.log(textPreview);
    console.log('--- FIN VISTA PREVIA ---');
    
    // Si el texto es muy largo, mostrar también el final
    if (pdfData.textLength > 1000) {
      console.log('\n📝 TEXTO EXTRAIDO (ultimos 500 caracteres):');
      console.log('--- FINAL DOCUMENTO ---');
      const textEnd = pdfData.extractedText.substring(pdfData.textLength - 500);
      console.log(textEnd);
      console.log('--- FIN FINAL ---');
    }
    
    console.log('\n📦 EJEMPLOS DE CHUNKS:');
    vectorData.chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} (${chunk.content.length} caracteres):`);
      console.log(chunk.content.substring(0, 200) + '...');
      console.log('---');
    });
    
    console.log('========================================');
    console.log('📊 FIN DATOS PDF');
    console.log('========================================\n');

    // ENVIAR DATOS A N8N
    console.log('📤 Enviando datos a N8N...');

    if (process.env.N8N_PDF_WEBHOOK_URL) {
      try {
        // Preparar datos para N8N
        const dataForN8N = {
          type: 'pdf-document',
          filename: pdfData.filename,
          uploadedFilename: req.file.filename,
          fileSize: req.file.size,
          pages: pdfData.pages,
          textLength: pdfData.textLength,
          extractedText: pdfData.extractedText,
          metadata: {
            ...pdfData.info,
            timestamp: pdfData.timestamp,
            source: 'pdf-upload',
            chunks: vectorData.chunks.length
          },
          vectorData: {
            content: pdfData.extractedText,
            chunks: vectorData.chunks,
            metadata: {
              filename: pdfData.filename,
              pages: pdfData.pages,
              timestamp: pdfData.timestamp,
              source: 'pdf-upload'
            }
          }
        };

        console.log('📊 Enviando a N8N:', {
          url: process.env.N8N_PDF_WEBHOOK_URL,
          filename: pdfData.filename,
          
          textLength: pdfData.textLength,
          chunks: vectorData.chunks.length
        });

        const n8nResponse = await axios.post(process.env.N8N_PDF_WEBHOOK_URL, dataForN8N, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Respuesta de N8N recibida:', n8nResponse.status);
        console.log('📋 Datos de respuesta N8N:', n8nResponse.data);

        // Respuesta exitosa con datos de N8N
        return res.json({
          success: true,
          message: 'PDF procesado y enviado a N8N exitosamente',
          data: {
            filename: pdfData.filename,
            pages: pdfData.pages,
            textLength: pdfData.textLength,
            chunks: vectorData.chunks.length,
            timestamp: pdfData.timestamp
          },
          n8nResponse: n8nResponse.data,
          fileUrl: `/uploads/pdfs/${req.file.filename}`
        });

      } catch (n8nError) {
        console.error('❌ Error al enviar a N8N:', n8nError.message);
        
        // Aunque falle N8N, devolvemos el PDF procesado
        return res.json({
          success: true,
          message: 'PDF procesado (Error al enviar a N8N)',
          data: {
            filename: pdfData.filename,
            pages: pdfData.pages,
            textLength: pdfData.textLength,
            chunks: vectorData.chunks.length,
            timestamp: pdfData.timestamp
          },
          warning: 'No se pudo enviar a N8N: ' + n8nError.message,
          fileUrl: `/uploads/pdfs/${req.file.filename}`
        });
      }
    } else {
      console.log('⚠️ N8N_PDF_WEBHOOK_URL no configurada');
      
      // Sin N8N configurado, solo procesamos y devolvemos
      return res.json({
        success: true,
        message: 'PDF procesado (N8N no configurado)',
        data: {
          filename: pdfData.filename,
          pages: pdfData.pages,
          textLength: pdfData.textLength,
          chunks: vectorData.chunks.length,
          timestamp: pdfData.timestamp
        },
        fileUrl: `/uploads/pdfs/${req.file.filename}`
      });
    }

  } catch (error) {
    console.error('❌ Error procesando PDF:', error);

    // Limpiar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      PDFController.cleanupFile(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'Error procesando el PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// Endpoint para obtener información de un PDF procesado
router.get('/pdf-info/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/pdfs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo PDF no encontrado'
      });
    }

    const stats = fs.statSync(filePath);
    const pdfBuffer = fs.readFileSync(filePath);
    
    // Usar el controlador para procesar
    const pdfData = await PDFController.processPDF(pdfBuffer, filename, filename);

    res.json({
      success: true,
      data: {
        filename: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        pages: pdfData.pages,
        textLength: pdfData.textLength,
        info: pdfData.info
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo info del PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información del PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// Endpoint de health check para PDFs
router.get('/pdf-health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'PDF Processing',
    timestamp: new Date().toISOString(),
    config: {
      maxFileSize: '10MB',
      supportedFormats: ['application/pdf'],
      n8nConfigured: !!process.env.N8N_PDF_WEBHOOK_URL
    }
  });
});

module.exports = router;
