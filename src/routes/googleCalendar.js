const express = require('express');
const googleCalendarController = require('../controllers/googleCalendarController');

const router = express.Router();

// Ruta para crear cita en Google Calendar a través de N8N
router.post('/google-calendar', googleCalendarController.createAppointment);

// Ruta para obtener vista previa de cita (sin crear)
router.post('/google-calendar/preview', googleCalendarController.previewAppointment);

// Ruta para obtener citas del día
router.get('/google-calendar/appointments', googleCalendarController.getTodayAppointments);

// Ruta para cancelar una cita
router.post('/google-calendar/cancel', googleCalendarController.cancelAppointment);

// Ruta para actualizar una cita
router.post('/google-calendar/update', googleCalendarController.updateAppointment);

// Ruta para verificar el estado de conexión con N8N para Google Calendar
router.get('/health/google-calendar', googleCalendarController.checkN8nStatus);

module.exports = router;
