const express = require('express');
const axios = require('axios');

const router = express.Router();

// Endpoint que coincide con lo que espera el frontend: /api/process-image
router.post('/process-image', async (req, res) => {
  try {
    const { imageUrl, extractedText, confidence, type } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL de imagen requerida' });
    }

    console.log('📤 Datos recibidos del frontend:', {
      imageUrl,
      hasText: !!extractedText,
      confidence,
      type
    });

    // Si ya viene el texto extraído, procesarlo directamente
    if (extractedText) {
      console.log('📝 Texto extraído:', extractedText.substring(0, 100) + '...');
      
      // Aquí puedes procesar el texto extraído
      const processedData = {
        success: true,
        originalData: req.body,
        processedText: extractedText,
        confidence: confidence || 0,
        timestamp: new Date().toISOString()
      };      // Enviar a N8N y esperar respuesta de la IA
      try {
        const response = await axios.post(process.env.N8N_IMAGES_WEBHOOK_URL, {
          ...req.body,
          processed: true,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Respuesta recibida de N8N/IA:', response.data);
        
        // Devolver la respuesta completa de la IA al frontend
        return res.json({
          success: true,
          message: 'Factura procesada por IA',
          iaResponse: response.data,  // La respuesta completa de la IA
          originalData: req.body,
          timestamp: new Date().toISOString()
        });

      } catch (n8nError) {
        console.log('⚠️ Error enviando a N8N:', n8nError.message);
        return res.status(500).json({
          success: false,
          message: 'Error al procesar con IA',
          error: n8nError.message
        });
      }
    }    // Si no viene texto, enviar a N8N y devolver respuesta de IA
    console.log('📤 Enviando imagen a N8N:', imageUrl);
    const response = await axios.post(process.env.N8N_IMAGES_WEBHOOK_URL, {
      imageUrl: imageUrl,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Respuesta recibida de N8N/IA:', response.data);

    res.json({ 
      success: true, 
      message: 'Imagen procesada por IA',
      iaResponse: response.data,  // La respuesta completa de la IA
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error al procesar imagen' });
  }
});

// Endpoint para procesar texto/OCR: /api/process-text
router.post('/process-text', async (req, res) => {
  try {
    const { imageUrl, type = 'text_extraction' } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL de imagen requerida para OCR' });
    }

    console.log('📝 Enviando imagen a N8N para OCR:', imageUrl);    // Enviar al webhook de N8N para OCR/extracción de texto
    const response = await axios.post(process.env.N8N_IMAGES_WEBHOOK_URL, {
      imageUrl: imageUrl,
      type: type,
      action: 'extract_text',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Respuesta recibida de N8N/IA para OCR:', response.data);

    res.json({ 
      success: true, 
      message: 'OCR procesado por IA',
      iaResponse: response.data,  // La respuesta completa de la IA
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en OCR:', error.message);
    res.status(500).json({ error: 'Error al procesar texto de la imagen' });  }
});

// Endpoint para consultas al abogado agente: /api/lawyer-consult
router.post('/lawyer-consult', async (req, res) => {
  try {
    const { message, userContext, consultationType = 'legal_advice' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensaje de consulta requerido' });
    }

    console.log('⚖️ Enviando consulta al abogado agente:', message.substring(0, 50) + '...');    // Enviar la consulta al webhook del abogado en N8N
    const response = await axios.post(process.env.N8N_LAWYER_WEBHOOK_URL, {
      message: message,
      userContext: userContext || {},
      consultationType: consultationType,
      timestamp: new Date().toISOString(),
      source: 'dashboard_lawyer_consult'
    });

    console.log('✅ Respuesta recibida del abogado IA:', response.data);

    res.json({ 
      success: true, 
      message: 'Consulta procesada por abogado IA',
      iaResponse: response.data,  // La respuesta completa del abogado IA
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en consulta al abogado:', error.message);
    res.status(500).json({ 
      error: 'Error al procesar consulta legal',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });  }
});

// Endpoint para consultas del clima: /api/weather
router.post('/weather', async (req, res) => {  try {
    const { message, location, query, language = 'es' } = req.body;
    
    if (!message && !location && !query) {
      return res.status(400).json({ error: 'Se requiere mensaje, ubicación o consulta del clima' });
    }

    console.log('🌤️ Enviando consulta del clima:', message || location || query);

    // Enviar la consulta al webhook del clima en N8N
    const response = await axios.post(process.env.N8N_WEATHER_WEBHOOK_URL, {
      message: message,           // Campo message del frontend
      location: location,
      query: query,
      language: language,
      timestamp: new Date().toISOString(),
      source: 'dashboard_weather'
    });

    console.log('✅ Respuesta recibida del clima IA:', response.data);

    res.json({ 
      success: true, 
      message: 'Consulta del clima procesada',
      iaResponse: response.data,  // La respuesta completa del clima IA
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en consulta del clima:', error.message);
    res.status(500).json({ 
      error: 'Error al obtener información del clima',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });  }
});

// Endpoint para el agente madre: /api/agente-madre
router.post('/agente-madre', async (req, res) => {
  try {
    const { message, userContext, taskType = 'general' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido para el agente madre' });
    }

    console.log('🤖 Enviando mensaje al agente madre:', message.substring(0, 50) + '...');

    // Enviar el mensaje al webhook del agente madre en N8N
    const response = await axios.post(process.env.N8N_AGENTE_MADRE, {
      message: message,
      userContext: userContext || {},
      taskType: taskType,
      timestamp: new Date().toISOString(),
      source: 'dashboard_agente_madre'
    });

    console.log('✅ Respuesta recibida del agente madre:', response.data);

    res.json({ 
      success: true, 
      message: 'Mensaje procesado por agente madre',
      iaResponse: response.data,  // La respuesta completa del agente madre
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en agente madre:', error.message);
    res.status(500).json({ 
      error: 'Error al procesar mensaje con agente madre',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
