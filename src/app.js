const express = require('express');
const cors = require('cors');

// Importar rutas
const emailRoutes = require('./routes/email');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite y otros puertos comunes
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Rutas
app.use('/api', emailRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '🚀 N8N Dashboard Backend funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      sendEmail: 'POST /api/send-email',
      health: 'GET /api/health'
    }
  });
});

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
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