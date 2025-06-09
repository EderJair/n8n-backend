const express = require('express');
const emailController = require('../controllers/emailController');

const router = express.Router();

// Ruta para enviar email a través de N8N
router.post('/send-email', emailController.sendEmail);

// Ruta para obtener el estado de N8N
router.get('/n8n-status', emailController.getN8nStatus);

module.exports = router;