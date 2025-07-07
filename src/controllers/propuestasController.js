const axios = require('axios');

// URL del webhook de N8N para Generador de Propuestas
const N8N_PROPUESTAS_WEBHOOK_URL = process.env.N8N_PROPUESTAS_WEBHOOK_URL || 'http://localhost:5678/webhook/propuestas';

// Imprimir la URL al cargar el módulo para debug
console.log('🌍 === CONFIGURACIÓN DEL CONTROLADOR GENERADOR DE PROPUESTAS ===');
console.log('🔗 N8N_PROPUESTAS_WEBHOOK_URL desde .env:', process.env.N8N_PROPUESTAS_WEBHOOK_URL);
console.log('🎯 URL final que se usará:', N8N_PROPUESTAS_WEBHOOK_URL);
console.log('📂 NODE_ENV:', process.env.NODE_ENV);
console.log('🌍 === FIN CONFIGURACIÓN ===');

/**
 * Crea una propuesta comercial a través del flujo de N8N
 */
const createPropuesta = async (req, res) => {
  try {
    console.log('📄 === INICIANDO PROCESO DE CREACIÓN DE PROPUESTA ===');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('📥 Datos recibidos del frontend:');
    console.log('   - Body completo:', JSON.stringify(req.body, null, 2));
    
    // Validar datos recibidos
    const { nombre_cliente, industria, servicios_solicitados, presupuesto_estimado, timeline } = req.body;
    
    console.log('🔍 Validando campos...');
    console.log('   - Nombre Cliente:', nombre_cliente ? '✅ Presente' : '❌ Faltante');
    console.log('   - Industria:', industria ? '✅ Presente' : '❌ Faltante');
    console.log('   - Servicios Solicitados:', servicios_solicitados ? '✅ Presente' : '❌ Faltante');
    
    if (!nombre_cliente || !industria || !servicios_solicitados) {
      console.log('❌ Validación fallida - Campos requeridos faltantes');
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre_cliente, industria, servicios_solicitados',
        received: req.body
      });
    }

    // Preparar datos para N8N
    const propuestaData = {
      nombre_cliente: nombre_cliente.trim(),
      industria: industria.trim(),
      servicios_solicitados: servicios_solicitados.trim(),
      presupuesto_estimado: presupuesto_estimado || 'No especificado',
      timeline: timeline || 'No especificado',
      timestamp: new Date().toISOString(),
      type: req.body.type || 'create_proposal',
      source: req.body.source || 'dashboard'
    };

    console.log('📦 Datos preparados para N8N:');
    console.log(JSON.stringify(propuestaData, null, 2));
    console.log('🎯 URL de N8N:', N8N_PROPUESTAS_WEBHOOK_URL);
    
    // Hacer petición a N8N
    console.log('📤 Enviando petición a N8N...');
    const n8nResponse = await axios.post(N8N_PROPUESTAS_WEBHOOK_URL, propuestaData, {
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
      message: 'Propuesta procesada correctamente',
      data: {
        nombre_cliente: propuestaData.nombre_cliente,
        processedData: n8nResponse.data,
        timestamp: propuestaData.timestamp
      }
    };

    console.log('📤 Enviando respuesta al frontend:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('📄 === PROCESO COMPLETADO EXITOSAMENTE ===');

    res.json(responseData);

  } catch (error) {
    handleError(error, res, 'crear propuesta');
  }
};

/**
 * Obtiene una vista previa de la propuesta sin crearla
 */
const previewPropuesta = async (req, res) => {
  try {
    console.log('🔍 === INICIANDO PROCESO DE VISTA PREVIA DE PROPUESTA ===');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('📥 Datos recibidos del frontend:');
    console.log('   - Body completo:', JSON.stringify(req.body, null, 2));
    
    // Validar datos recibidos
    const { nombre_cliente, industria, servicios_solicitados } = req.body;
    
    if (!nombre_cliente || !industria || !servicios_solicitados) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre_cliente, industria, servicios_solicitados',
        received: req.body
      });
    }

    // Preparar datos para N8N
    const previewData = {
      nombre_cliente: nombre_cliente.trim(),
      industria: industria.trim(),
      servicios_solicitados: servicios_solicitados.trim(),
      presupuesto_estimado: req.body.presupuesto_estimado || 'No especificado',
      timeline: req.body.timeline || 'No especificado',
      timestamp: new Date().toISOString(),
      type: 'preview_proposal',
      source: req.body.source || 'dashboard'
    };

    // URL específica para vista previa
    const previewUrl = `${N8N_PROPUESTAS_WEBHOOK_URL}/preview`;
    
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
      message: 'Vista previa de propuesta generada correctamente',
      data: n8nResponse.data
    };

    console.log('📤 Enviando respuesta al frontend:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('🔍 === PROCESO DE VISTA PREVIA COMPLETADO ===');

    res.json(responseData);

  } catch (error) {
    handleError(error, res, 'obtener vista previa de propuesta');
  }
};

/**
 * Obtiene propuestas recientes
 */
const getRecentProposals = async (req, res) => {
  try {
    console.log('📋 === INICIANDO PROCESO DE OBTENCIÓN DE PROPUESTAS RECIENTES ===');
    console.log('🕐 Timestamp:', new Date().toISOString());
    
    // URL específica para obtener propuestas recientes
    const recentUrl = `${N8N_PROPUESTAS_WEBHOOK_URL}/recent`;
    
    console.log('🎯 URL de N8N para propuestas recientes:', recentUrl);
    
    // Hacer petición a N8N
    const n8nResponse = await axios.get(recentUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 segundos de timeout
    });

    // Responder al frontend
    const responseData = {
      success: true,
      message: 'Propuestas recientes obtenidas correctamente',
      data: n8nResponse.data
    };

    console.log('📤 Enviando respuesta al frontend:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('📋 === PROCESO DE OBTENCIÓN DE PROPUESTAS RECIENTES COMPLETADO ===');

    res.json(responseData);

  } catch (error) {
    handleError(error, res, 'obtener propuestas recientes');
  }
};

/**
 * Descarga una propuesta como PDF
 */
const downloadProposal = async (req, res) => {
  try {
    console.log('📥 === INICIANDO PROCESO DE DESCARGA DE PROPUESTA ===');
    console.log('🕐 Timestamp:', new Date().toISOString());
    
    const { proposalId } = req.params;
    
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: 'Falta el ID de la propuesta',
      });
    }
    
    console.log('🔍 ID de propuesta recibido:', proposalId);
    
    // URL específica para descargar propuesta
    const downloadUrl = `${N8N_PROPUESTAS_WEBHOOK_URL}/download/${proposalId}`;
    
    console.log('🎯 URL de N8N para descarga:', downloadUrl);
    
    // Hacer petición a N8N
    const n8nResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 segundos de timeout
    });

    // Configurar headers para descarga de PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="propuesta-${proposalId}.pdf"`);
    
    // Enviar el PDF como respuesta
    res.send(Buffer.from(n8nResponse.data));
    
    console.log('📥 === PROCESO DE DESCARGA DE PROPUESTA COMPLETADO ===');

  } catch (error) {
    handleError(error, res, 'descargar propuesta');
  }
};

/**
 * Verifica el estado de conexión con N8N para Generador de Propuestas
 */
const checkN8nStatus = async (req, res) => {
  try {
    console.log('🔍 Verificando estado de N8N para Generador de Propuestas...');
    
    // Hacer petición de prueba a N8N
    const healthUrl = N8N_PROPUESTAS_WEBHOOK_URL.replace('/webhook/propuestas', '/health');
    const response = await axios.get(healthUrl, {
      timeout: 5000
    });

    res.json({
      success: true,
      message: 'N8N para Generador de Propuestas está funcionando correctamente',
      status: 'connected',
      url: N8N_PROPUESTAS_WEBHOOK_URL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error verificando N8N para Generador de Propuestas:', error);
    
    res.status(503).json({
      success: false,
      message: 'N8N para Generador de Propuestas no está disponible',
      status: 'disconnected',
      url: N8N_PROPUESTAS_WEBHOOK_URL,
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
      url: N8N_PROPUESTAS_WEBHOOK_URL
    } : undefined,
    timestamp: new Date().toISOString()
  };

  console.error('📤 Enviando respuesta de error al frontend:');
  console.error(JSON.stringify(errorResponse, null, 2));
  console.error('❌ === FIN DEL ERROR ===');

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  createPropuesta,
  previewPropuesta,
  getRecentProposals,
  downloadProposal,
  checkN8nStatus
};
