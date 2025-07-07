const express = require('express');
const router = express.Router();
const propuestasController = require('../controllers/propuestasController');

// Ruta para crear una propuesta comercial
router.post('/propuestas', propuestasController.createPropuesta);

// Ruta para obtener vista previa de una propuesta
router.post('/propuestas/preview', propuestasController.previewPropuesta);

// Ruta para obtener propuestas recientes
router.get('/propuestas/recent', propuestasController.getRecentProposals);

// Ruta para descargar una propuesta como PDF
router.get('/propuestas/download/:proposalId', propuestasController.downloadProposal);

// Ruta para verificar estado de conexión con N8N
router.get('/health/propuestas', propuestasController.checkN8nStatus);

module.exports = router;
