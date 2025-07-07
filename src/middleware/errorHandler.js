/**
 * Middleware para manejo de errores de multer y otros errores relacionados con archivos
 */

const multer = require('multer');

const handleMulterError = (error, req, res, next) => {
  console.error('🚨 Error de Multer detectado:', error);

  if (error instanceof multer.MulterError) {
    let message = '';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'El archivo es demasiado grande. Tamaño máximo permitido: 10MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Demasiados archivos. Máximo permitido: 10 archivos';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de archivo inesperado. Use "image" para un archivo o "images" para múltiples';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Demasiadas partes en el formulario';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Nombre de campo demasiado largo';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Valor de campo demasiado largo';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Demasiados campos en el formulario';
        break;
      default:
        message = 'Error al procesar el archivo';
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
      error: {
        code: error.code,
        field: error.field
      },
      timestamp: new Date().toISOString()
    });
  }

  // Si el error es sobre tipo de archivo (de nuestro fileFilter)
  if (error.message.includes('Solo se permiten archivos de imagen')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      allowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'svg'],
      timestamp: new Date().toISOString()
    });
  }

  // Para otros errores, pasar al siguiente middleware
  next(error);
};

module.exports = {
  handleMulterError
};
