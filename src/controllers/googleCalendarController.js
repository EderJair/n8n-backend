const axios = require('axios');

// URL del webhook de N8N para Google Calendar
const N8N_GOOGLE_CALENDAR_WEBHOOK_URL = process.env.N8N_GOOGLE_CALENDAR_WEBHOOK_URL || 'http://localhost:5678/webhook/google-calendar';

// Imprimir la URL al cargar el módulo para debug
console.log('🌍 === CONFIGURACIÓN DEL CONTROLADOR GOOGLE CALENDAR ===');
console.log('🔗 N8N_GOOGLE_CALENDAR_WEBHOOK_URL desde .env:', process.env.N8N_GOOGLE_CALENDAR_WEBHOOK_URL);
console.log('🎯 URL final que se usará:', N8N_GOOGLE_CALENDAR_WEBHOOK_URL);
console.log('📂 NODE_ENV:', process.env.NODE_ENV);
console.log('🌍 === FIN CONFIGURACIÓN ===');

/**
 * Crea una cita en Google Calendar a través del flujo de N8N
 */
const createAppointment = async (req, res) => {
  try {
    console.log('📅 === INICIANDO PROCESO DE CREACIÓN DE CITA ===');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('📥 Datos recibidos del frontend:');
    console.log('   - Body completo:', JSON.stringify(req.body, null, 2));
    
    // Validar datos recibidos
    const { mensaje } = req.body;
    
    console.log('🔍 Validando campos...');
    console.log('   - Mensaje:', mensaje ? '✅ Presente' : '❌ Faltante');
    
    if (!mensaje) {
      console.log('❌ Validación fallida - Campo mensaje faltante');
      return res.status(400).json({
        success: false,
        message: 'Falta el campo requerido: mensaje',
        received: req.body
      });
    }

    // Preparar datos para N8N
    const appointmentData = {
      mensaje: mensaje.trim(),
      timestamp: new Date().toISOString(),
      type: req.body.type || 'create_appointment',
      source: req.body.source || 'dashboard'
    };

    console.log('📦 Datos preparados para N8N:');
    console.log(JSON.stringify(appointmentData, null, 2));
    console.log('🎯 URL de N8N:', N8N_GOOGLE_CALENDAR_WEBHOOK_URL);
    
    // Hacer petición a N8N
    console.log('📤 Enviando petición a N8N...');
    const n8nResponse = await axios.post(N8N_GOOGLE_CALENDAR_WEBHOOK_URL, appointmentData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000 // 60 segundos de timeout (la IA puede tardar en procesar)
    });

    console.log('✅ Respuesta exitosa de N8N:');
    console.log('   - Status:', n8nResponse.status);
    console.log('   - Data:', JSON.stringify(n8nResponse.data, null, 2));
    
    // Responder al frontend
    const responseData = {
      success: true,
      message: 'Cita procesada correctamente',
      data: {
        mensaje: appointmentData.mensaje,
        processedData: n8nResponse.data,
        timestamp: appointmentData.timestamp
      }
    };

    console.log('📤 Enviando respuesta al frontend:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('📅 === PROCESO COMPLETADO EXITOSAMENTE ===');

    res.json(responseData);

  } catch (error) {
    handleError(error, res, 'crear cita');
  }
};

/**
 * Obtiene una vista previa de la cita sin crearla
 */
const previewAppointment = async (req, res) => {
  try {
    console.log('🔍 === INICIANDO PROCESO DE VISTA PREVIA DE CITA ===');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('📥 Datos recibidos del frontend:');
    console.log('   - Body completo:', JSON.stringify(req.body, null, 2));
    
    // Validar datos recibidos
    const { mensaje } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Falta el campo requerido: mensaje',
        received: req.body
      });
    }

    // Preparar datos para N8N
    const previewData = {
      mensaje: mensaje.trim(),
      timestamp: new Date().toISOString(),
      type: 'preview_appointment',
      source: req.body.source || 'dashboard'
    };

    // URL específica para vista previa
    const previewUrl = `${N8N_GOOGLE_CALENDAR_WEBHOOK_URL}/preview`;
    
    console.log('🎯 URL de N8N para vista previa:', previewUrl);
    
    // Hacer petición a N8N
    const n8nResponse = await axios.post(previewUrl, previewData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 segundos de timeout
    });

    // Responder al frontend
    const responseData = {
      success: true,
      message: 'Vista previa generada correctamente',
      data: n8nResponse.data
    };

    console.log('📤 Enviando respuesta al frontend:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('🔍 === PROCESO DE VISTA PREVIA COMPLETADO ===');

    res.json(responseData);

  } catch (error) {
    handleError(error, res, 'obtener vista previa');
  }
};

/**
 * Obtiene las citas del día actual
 */
const getTodayAppointments = async (req, res) => {
  try {
    console.log('📋 === INICIANDO PROCESO DE OBTENCIÓN DE CITAS ===');
    
    // Obtener fecha de la query o usar la fecha actual
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    // URL específica para obtener citas
    const appointmentsUrl = `${N8N_GOOGLE_CALENDAR_WEBHOOK_URL}/appointments?date=${date}`;
    
    console.log('🎯 URL de N8N para citas:', appointmentsUrl);
    
    // Hacer petición a N8N
    const n8nResponse = await axios.get(appointmentsUrl, {
      timeout: 15000 // 15 segundos de timeout
    });

    // Responder al frontend
    const responseData = {
      success: true,
      message: 'Citas obtenidas correctamente',
      date: date,
      appointments: n8nResponse.data.appointments || []
    };

    console.log('📤 Enviando respuesta al frontend:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('📋 === PROCESO DE OBTENCIÓN DE CITAS COMPLETADO ===');

    res.json(responseData);

  } catch (error) {
    handleError(error, res, 'obtener citas');
  }
};

/**
 * Cancela una cita existente
 */
const cancelAppointment = async (req, res) => {
  try {
    console.log('🚫 === INICIANDO PROCESO DE CANCELACIÓN DE CITA ===');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('📥 Datos recibidos del frontend:');
    console.log('   - Body completo:', JSON.stringify(req.body, null, 2));
    
    // Validar datos recibidos
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Falta el campo requerido: appointmentId',
        received: req.body
      });
    }

    // Preparar datos para N8N
    const cancelData = {
      appointmentId: appointmentId,
      timestamp: new Date().toISOString(),
      type: 'cancel_appointment',
      source: req.body.source || 'dashboard'
    };

    // URL específica para cancelar cita
    const cancelUrl = `${N8N_GOOGLE_CALENDAR_WEBHOOK_URL}/cancel`;
    
    console.log('🎯 URL de N8N para cancelación:', cancelUrl);
    
    // Hacer petición a N8N
    const n8nResponse = await axios.post(cancelUrl, cancelData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000 // 15 segundos de timeout
    });

    // Responder al frontend
    const responseData = {
      success: true,
      message: 'Cita cancelada correctamente',
      data: n8nResponse.data
    };

    console.log('📤 Enviando respuesta al frontend:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('🚫 === PROCESO DE CANCELACIÓN COMPLETADO ===');

    res.json(responseData);

  } catch (error) {
    handleError(error, res, 'cancelar cita');
  }
};

/**
 * Actualiza una cita existente
 */
const updateAppointment = async (req, res) => {
  try {
    console.log('📝 === INICIANDO PROCESO DE ACTUALIZACIÓN DE CITA ===');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('📥 Datos recibidos del frontend:');
    console.log('   - Body completo:', JSON.stringify(req.body, null, 2));
    
    // Validar datos recibidos
    const { appointmentId, mensaje } = req.body;
    
    if (!appointmentId || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: appointmentId, mensaje',
        received: req.body
      });
    }

    // Preparar datos para N8N
    const updateData = {
      appointmentId: appointmentId,
      mensaje: mensaje.trim(),
      timestamp: new Date().toISOString(),
      type: 'update_appointment',
      source: req.body.source || 'dashboard'
    };

    // URL específica para actualizar cita
    const updateUrl = `${N8N_GOOGLE_CALENDAR_WEBHOOK_URL}/update`;
    
    console.log('🎯 URL de N8N para actualización:', updateUrl);
    
    // Hacer petición a N8N
    const n8nResponse = await axios.post(updateUrl, updateData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 segundos de timeout
    });

    // Responder al frontend
    const responseData = {
      success: true,
      message: 'Cita actualizada correctamente',
      data: n8nResponse.data
    };

    console.log('📤 Enviando respuesta al frontend:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('📝 === PROCESO DE ACTUALIZACIÓN COMPLETADO ===');

    res.json(responseData);

  } catch (error) {
    handleError(error, res, 'actualizar cita');
  }
};

/**
 * Verifica el estado de conexión con N8N para Google Calendar
 */
const checkN8nStatus = async (req, res) => {
  try {
    console.log('🔍 Verificando estado de N8N para Google Calendar...');
    
    // Hacer petición de prueba a N8N
    const healthUrl = N8N_GOOGLE_CALENDAR_WEBHOOK_URL.replace('/webhook/google-calendar', '/health');
    const response = await axios.get(healthUrl, {
      timeout: 5000
    });

    res.json({
      success: true,
      message: 'N8N para Google Calendar está funcionando correctamente',
      status: 'connected',
      url: N8N_GOOGLE_CALENDAR_WEBHOOK_URL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error verificando N8N para Google Calendar:', error);
    
    res.status(503).json({
      success: false,
      message: 'N8N para Google Calendar no está disponible',
      status: 'disconnected',
      url: N8N_GOOGLE_CALENDAR_WEBHOOK_URL,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Función helper para manejar errores
 */
const handleError = (error, res, action) => {
  console.error(`❌ === ERROR AL ${action.toUpperCase()} ===`);
  console.error('🕐 Timestamp:', new Date().toISOString());
  console.error('📋 Detalles del error:');
  console.error('   - Message:', error.message);
  console.error('   - Code:', error.code);
  console.error('   - Stack:', error.stack);

  if (error.response) {
    console.error('📡 Respuesta de error de N8N:');
    console.error('   - Status:', error.response.status);
    console.error('   - Data:', error.response.data);
    console.error('   - Headers:', error.response.headers);
  }

  // Determinar tipo de error
  let errorMessage = `Error al ${action}`;
  let statusCode = 500;

  if (error.code === 'ECONNREFUSED') {
    errorMessage = 'No se pudo conectar con N8N. Verifica que esté ejecutándose.';
    statusCode = 503;
    console.error('🔌 Error de conexión: N8N no está disponible');
  } else if (error.response) {
    errorMessage = `Error de N8N: ${error.response.data?.message || error.response.statusText}`;
    statusCode = error.response.status;
    console.error('⚠️ Error de respuesta de N8N');
  } else if (error.code === 'ENOTFOUND') {
    errorMessage = 'URL de N8N no válida o no encontrada';
    statusCode = 502;
    console.error('🔍 Error de DNS: URL de N8N no encontrada');
  } else if (error.code === 'ETIMEDOUT') {
    errorMessage = 'Timeout: N8N tardó demasiado en responder';
    statusCode = 504;
    console.error('⏱️ Error de timeout');
  }

  const errorResponse = {
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      code: error.code,
      url: N8N_GOOGLE_CALENDAR_WEBHOOK_URL
    } : undefined,
    timestamp: new Date().toISOString()
  };

  console.error('📤 Enviando respuesta de error al frontend:');
  console.error(JSON.stringify(errorResponse, null, 2));
  console.error('❌ === FIN DEL ERROR ===');

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  createAppointment,
  previewAppointment,
  getTodayAppointments,
  cancelAppointment,
  updateAppointment,
  checkN8nStatus
};
