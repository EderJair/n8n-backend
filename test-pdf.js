const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// URL base del backend
const BASE_URL = 'http://localhost:5000';

async function testPDFEndpoints() {
  console.log('🧪 === PRUEBAS DE ENDPOINTS PDF ===\n');

  try {
    // 1. Probar health check
    console.log('1️⃣ Probando health check de PDF...');
    const healthResponse = await axios.get(`${BASE_URL}/api/pdf-health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // 2. Probar health general
    console.log('2️⃣ Probando health check general...');
    const generalHealthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health general:', generalHealthResponse.data);
    console.log('');

    // 3. Probar endpoint principal
    console.log('3️⃣ Probando endpoint principal...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Endpoints disponibles:', rootResponse.data.endpoints.pdf);
    console.log('');

    // 4. Simular subida de PDF (necesitarías un archivo PDF para esta prueba)
    console.log('4️⃣ Para probar la subida de PDF, usa este comando curl:');
    console.log(`curl -X POST ${BASE_URL}/api/process-pdf \\`);
    console.log(`  -F "pdf=@tu_archivo.pdf" \\`);
    console.log(`  -H "Content-Type: multipart/form-data"`);
    console.log('');

    console.log('🎉 Todas las pruebas básicas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('📝 Respuesta del error:', error.response.data);
    }
  }
}

// Función para probar con un PDF real si tienes uno
async function testWithRealPDF(pdfPath) {
  try {
    if (!fs.existsSync(pdfPath)) {
      console.log('⚠️ Archivo PDF no encontrado:', pdfPath);
      return;
    }

    console.log('📄 Probando con archivo PDF real...');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));

    const response = await axios.post(`${BASE_URL}/api/process-pdf`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000
    });

    console.log('✅ PDF procesado exitosamente:', response.data);

  } catch (error) {
    console.error('❌ Error procesando PDF:', error.message);
    if (error.response) {
      console.error('📝 Respuesta del error:', error.response.data);
    }
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testPDFEndpoints();
  
  // Si tienes un PDF de prueba, descomenta la siguiente línea y ajusta la ruta
  // testWithRealPDF('./test.pdf');
}

module.exports = {
  testPDFEndpoints,
  testWithRealPDF
};
