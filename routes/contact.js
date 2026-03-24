const express = require('express');
const router = express.Router();
const db = require('../data/database');

router.get('/', (req, res) => {
  res.render('contacto', { success: null, error: null });
});

router.post('/', (req, res) => {
  const { nombre, email, asunto, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.render('contacto', { success: null, error: 'Por favor, rellena todos los campos obligatorios.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render('contacto', { success: null, error: 'El email no tiene un formato válido.' });
  }

  try {
    db.prepare(`
      INSERT INTO mensajes (nombre, email, asunto, mensaje) VALUES (?, ?, ?, ?)
    `).run(nombre, email, asunto || 'Sin asunto', mensaje);

    res.render('contacto', { success: '¡Mensaje enviado correctamente! Te responderemos pronto.', error: null });
  } catch (err) {
    console.error(err);
    res.render('contacto', { success: null, error: 'Error al enviar el mensaje. Inténtalo más tarde.' });
  }
});

module.exports = router;
