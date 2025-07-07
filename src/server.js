// IMPORTANTE: Cargar dotenv ANTES que todo
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

console.log('🔧 === VARIABLES DE ENTORNO ===');
console.log('📂 NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL);
console.log('🌐 CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('🔧 === FIN VARIABLES ===');

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}`);
  console.log(`🔗 Endpoint de email: http://localhost:${PORT}/api/send-email`);
});