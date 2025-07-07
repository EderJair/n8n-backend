const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const emailRoutes = require('./routes/email');
const imageRoutes = require('./routes/images');
const pdfRoutes = require('./routes/pdf');
const googleCalendarRoutes = require('./routes/googleCalendar');
const propuestasRoutes = require('./routes/propuestas');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5176', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('📁 Directorio de uploads servido en: /uploads');

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Rutas principales
console.log('📍 Registrando rutas...');
app.use('/api', emailRoutes);
app.use('/api', imageRoutes);  // Cambiado para que /api/process-image esté disponible
app.use('/api', pdfRoutes);    // Nuevas rutas para PDFs
app.use('/api', googleCalendarRoutes); // Nuevas rutas para Google Calendar
app.use('/api', propuestasRoutes); // Nuevas rutas para Generador de Propuestas
console.log('✅ Rutas registradas:');
console.log('   - /api/* (email)');
console.log('   - /api/* (images)');  // Actualizado
console.log('   - /api/* (pdf)');     // Nuevas rutas PDF
console.log('   - /api/* (google-calendar)'); // Nuevas rutas Google Calendar
console.log('   - /api/* (propuestas)'); // Nuevas rutas Generador de Propuestas

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '🚀 N8N Dashboard Backend funcionando correctamente',
    version: '1.0.0', endpoints: {
      email: {
        sendEmail: 'POST /api/send-email',
        health: 'GET /api/health'
      }, images: {
        processImage: 'POST /api/process-image',
        processText: 'POST /api/process-text',
        health: 'GET /api/health'
      },
      pdf: {
        processPdf: 'POST /api/process-pdf',
        pdfInfo: 'GET /api/pdf-info/:filename',
        health: 'GET /api/pdf-health'
      },
      googleCalendar: {
        createAppointment: 'POST /api/google-calendar',
        previewAppointment: 'POST /api/google-calendar/preview',
        getTodayAppointments: 'GET /api/google-calendar/appointments',
        cancelAppointment: 'POST /api/google-calendar/cancel',
        updateAppointment: 'POST /api/google-calendar/update',
        health: 'GET /api/health/google-calendar'
      },
      propuestas: {
        createPropuesta: 'POST /api/propuestas',
        previewPropuesta: 'POST /api/propuestas/preview',
        getRecentProposals: 'GET /api/propuestas/recent',
        downloadProposal: 'GET /api/propuestas/download/:proposalId',
        health: 'GET /api/health/propuestas'
      },
      lawyer: {
        consult: 'POST /api/lawyer-consult'
      },
      weather: {
        getWeather: 'POST /api/weather'
      },
      agenteMadre: {
        process: 'POST /api/agente-madre'
      },
      uploads: 'GET /uploads/:filename'
    }
  });
});

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      email: {
        n8nUrl: process.env.N8N_WEBHOOK_URL
      },
      images: {
        n8nUrl: process.env.N8N_IMAGES_WEBHOOK_URL
      },
      pdf: {
        n8nUrl: process.env.N8N_PDF_WEBHOOK_URL
      },
      googleCalendar: {
        n8nUrl: process.env.N8N_GOOGLE_CALENDAR_WEBHOOK_URL
      },
      propuestas: {
        n8nUrl: process.env.N8N_PROPUESTAS_WEBHOOK_URL
      }
    }
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  console.log('❌ Ruta no encontrada:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'POST /api/send-email',
      'POST /api/images/upload',
      'POST /api/images/upload-multiple',
      'GET /api/images/status',
      'GET /api/images/health',
      'POST /api/process-pdf',
      'GET /api/pdf-info/:filename',
      'GET /api/pdf-health',
      'POST /api/google-calendar',
      'POST /api/google-calendar/preview',
      'GET /api/google-calendar/appointments',
      'POST /api/google-calendar/cancel',
      'POST /api/google-calendar/update',
      'GET /api/health/google-calendar',
      'POST /api/propuestas',
      'POST /api/propuestas/preview',
      'GET /api/propuestas/recent',
      'GET /api/propuestas/download/:proposalId',
      'GET /api/health/propuestas',
      'GET /uploads/:filename'
    ],
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong!'
  });
});

module.exports = app;