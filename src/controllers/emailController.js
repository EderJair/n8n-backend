const axios = require('axios');

// URL del webhook de N8N (la configuraremos después)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/send-email';

// Imprimir la URL al cargar el módulo para debug
console.log('🌍 === CONFIGURACIÓN DEL CONTROLADOR ===');
console.log('🔗 N8N_WEBHOOK_URL desde .env:', process.env.N8N_WEBHOOK_URL);
console.log('🎯 URL final que se usará:', N8N_WEBHOOK_URL);
console.log('📂 NODE_ENV:', process.env.NODE_ENV);
console.log('🌍 === FIN CONFIGURACIÓN ===');

/**
 * Envía email a través del flujo de N8N
 */
const sendEmail = async (req, res) => {
  try {
    console.log('📧 === INICIANDO PROCESO DE ENVÍO DE EMAIL ===')
    console.log('🕐 Timestamp:', new Date().toISOString())
    console.log('📥 Datos recibidos del frontend:')
    console.log('   - Body completo:', JSON.stringify(req.body, null, 2))
    console.log('   - Headers:', req.headers)
    console.log('   - Method:', req.method)
    console.log('   - URL:', req.url)
    
    // Validar datos recibidos
    const { subject, message, recipients } = req.body;
    
    console.log('🔍 Validando campos...')
    console.log('   - Subject:', subject ? '✅ Presente' : '❌ Faltante')
    console.log('   - Message:', message ? '✅ Presente' : '❌ Faltante')
    console.log('   - Recipients:', recipients ? '✅ Presente' : '❌ Faltante')
    
    if (!subject || !message || !recipients) {
      console.log('❌ Validación fallida - Campos faltantes')
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

    console.log('📦 Datos preparados para N8N:')
    console.log(JSON.stringify(emailData, null, 2))
    console.log('🎯 URL de N8N:', N8N_WEBHOOK_URL)    // Hacer petición a N8N
    console.log('📤 Enviando petición a N8N...')
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, emailData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 segundos de timeout
    });

    console.log('✅ Respuesta exitosa de N8N:')
    console.log('   - Status:', n8nResponse.status)
    console.log('   - Data:', JSON.stringify(n8nResponse.data, null, 2))    // Responder al frontend
    const responseData = {
      success: true,
      message: 'Email enviado correctamente',
      data: {
        subject: emailData.subject,
        recipients: emailData.recipients,
        processedMessage: n8nResponse.data.processedMessage || emailData.message,
        n8nResponse: n8nResponse.data,
        timestamp: emailData.timestamp
      }
    };

    console.log('📤 Enviando respuesta al frontend:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('📧 === PROCESO COMPLETADO EXITOSAMENTE ===')

    res.json(responseData);

  } catch (error) {
    console.error('❌ === ERROR EN EL PROCESO ===')
    console.error('🕐 Timestamp:', new Date().toISOString())
    console.error('📋 Detalles del error:')
    console.error('   - Message:', error.message)
    console.error('   - Code:', error.code)
    console.error('   - Stack:', error.stack)

    if (error.response) {
      console.error('📡 Respuesta de error de N8N:')
      console.error('   - Status:', error.response.status)
      console.error('   - Data:', error.response.data)
      console.error('   - Headers:', error.response.headers)
    }

    // Determinar tipo de error
    let errorMessage = 'Error al procesar el email';
    let statusCode = 500;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'No se pudo conectar con N8N. Verifica que esté ejecutándose.';
      statusCode = 503;
      console.error('🔌 Error de conexión: N8N no está disponible')
    } else if (error.response) {
      errorMessage = `Error de N8N: ${error.response.data?.message || error.response.statusText}`;
      statusCode = error.response.status;
      console.error('⚠️ Error de respuesta de N8N')
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'URL de N8N no válida o no encontrada';
      statusCode = 502;
      console.error('🔍 Error de DNS: URL de N8N no encontrada')
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout: N8N tardó demasiado en responder';
      statusCode = 504;
      console.error('⏱️ Error de timeout')
    }

    const errorResponse = {
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        url: N8N_WEBHOOK_URL
      } : undefined,
      timestamp: new Date().toISOString()
    };

    console.error('📤 Enviando respuesta de error al frontend:')
    console.error(JSON.stringify(errorResponse, null, 2))
    console.error('❌ === FIN DEL ERROR ===')

    res.status(statusCode).json(errorResponse);
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