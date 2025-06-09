const axios = require('axios');

// URL del webhook de N8N (la configuraremos después)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/send-email';

/**
 * Envía email a través del flujo de N8N
 */
const sendEmail = async (req, res) => {
  try {
    console.log('📧 Iniciando proceso de envío de email...');
    
    // Validar datos recibidos
    const { subject, message, recipients } = req.body;
    
    if (!subject || !message || !recipients) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: subject, message, recipients',
        received: req.body
      });
    }

    // Preparar datos para N8N
    const emailData = {
      subject: subject.trim(),
      message: message.trim(),
      recipients: recipients.trim(),
      timestamp: new Date().toISOString(),
      source: 'dashboard'
    };

    console.log('📤 Enviando datos a N8N:', emailData);

    // Hacer petición a N8N
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, emailData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 segundos de timeout
    });

    console.log('✅ Respuesta de N8N:', n8nResponse.data);

    // Responder al frontend
    res.json({
      success: true,
      message: 'Email enviado correctamente',
      data: {
        subject: emailData.subject,
        recipients: emailData.recipients,
        processedMessage: n8nResponse.data.processedMessage || emailData.message,
        n8nResponse: n8nResponse.data,
        timestamp: emailData.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error enviando email:', error);

    // Determinar tipo de error
    let errorMessage = 'Error al procesar el email';
    let statusCode = 500;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'No se pudo conectar con N8N. Verifica que esté ejecutándose.';
      statusCode = 503;
    } else if (error.response) {
      errorMessage = `Error de N8N: ${error.response.data?.message || error.response.statusText}`;
      statusCode = error.response.status;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'URL de N8N no válida o no encontrada';
      statusCode = 502;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        url: N8N_WEBHOOK_URL
      } : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verifica el estado de conexión con N8N
 */
const getN8nStatus = async (req, res) => {
  try {
    console.log('🔍 Verificando estado de N8N...');
    
    // Hacer petición de prueba a N8N
    const response = await axios.get(N8N_WEBHOOK_URL.replace('/webhook/send-email', '/rest/active-workflows'), {
      timeout: 5000
    });

    res.json({
      success: true,
      message: 'N8N está funcionando correctamente',
      status: 'connected',
      url: N8N_WEBHOOK_URL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error verificando N8N:', error);
    
    res.status(503).json({
      success: false,
      message: 'N8N no está disponible',
      status: 'disconnected',
      url: N8N_WEBHOOK_URL,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  sendEmail,
  getN8nStatus
};