// Test the imageController loading
console.log('Testing imageController loading...');

try {
  const imageController = require('./src/controllers/imageController.js');
  console.log('✅ Module loaded successfully');
  console.log('📋 Available exports:', Object.keys(imageController));
  console.log('🔍 processCloudinaryImage type:', typeof imageController.processCloudinaryImage);
  console.log('🔍 processMultipleCloudinaryImages type:', typeof imageController.processMultipleCloudinaryImages);
  console.log('🔍 getImagesStatus type:', typeof imageController.getImagesStatus);
} catch (error) {
  console.error('❌ Error loading module:', error.message);
  console.error('📍 Stack:', error.stack);
}
