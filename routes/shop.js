const express = require('express');
const router = express.Router();
const db = require('../data/database');
const nodemailer = require('nodemailer');

// Configurar transporte de email (opcional, usa vars de entorno)
function getTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

async function enviarConfirmacion(pedido, producto) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email no configurado. Configura EMAIL_HOST, EMAIL_USER y EMAIL_PASS para enviar confirmaciones.');
    return;
  }
  const talaInfo = pedido.talla && pedido.talla !== 'Única' ? `Talla: ${pedido.talla}` : '';
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: pedido.email,
    subject: `Pedido #${pedido.id} recibido — Soto Ibarbasoa`,
    html: `
      <h2>¡Gracias por tu pedido, ${pedido.nombre}!</h2>
      <p>Hemos recibido tu pedido correctamente.</p>
      <table>
        <tr><td><strong>Pedido nº:</strong></td><td>${pedido.id}</td></tr>
        <tr><td><strong>Producto:</strong></td><td>${producto.nombre}</td></tr>
        ${talaInfo ? `<tr><td><strong>Talla:</strong></td><td>${pedido.talla}</td></tr>` : ''}
        <tr><td><strong>Cantidad:</strong></td><td>${pedido.cantidad}</td></tr>
        <tr><td><strong>Total:</strong></td><td>${pedido.total.toFixed(2)}€</td></tr>
      </table>
      <p>Nos pondremos en contacto contigo en breve para confirmar la forma de pago y el envío.</p>
      <p>Un saludo,<br>Club Soto Ibarbasoa</p>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error enviando email de confirmación:', err.message);
  }
}

router.get('/', (req, res) => {
  const categoria = req.query.categoria || null;
  let productos;
  if (categoria) {
    productos = db.prepare('SELECT * FROM productos WHERE categoria = ? ORDER BY nombre ASC').all(categoria);
  } else {
    productos = db.prepare('SELECT * FROM productos ORDER BY categoria ASC, nombre ASC').all();
  }
  const categorias = db.prepare('SELECT DISTINCT categoria FROM productos').all().map(r => r.categoria);
  res.render('tienda', { productos, categorias, categoriaActiva: categoria });
});

router.get('/producto/:id', (req, res) => {
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!producto) return res.status(404).render('404');
  res.render('producto', { producto, success: null, error: null });
});

router.post('/pedido', async (req, res) => {
  const { nombre, email, producto_id, talla, cantidad } = req.body;
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(producto_id);

  if (!producto) return res.status(404).render('404');
  if (!nombre || !email) {
    return res.render('producto', { producto, success: null, error: 'Rellena todos los campos.' });
  }

  const cantidadNum = parseInt(cantidad) || 1;

  // Control de stock
  if (producto.stock < cantidadNum) {
    const msg = producto.stock === 0
      ? 'Este producto está agotado.'
      : `Solo quedan ${producto.stock} unidades disponibles.`;
    return res.render('producto', { producto, success: null, error: msg });
  }

  const total = producto.precio * cantidadNum;

  try {
    const result = db.prepare(`
      INSERT INTO pedidos (nombre, email, producto_id, talla, cantidad, total) VALUES (?, ?, ?, ?, ?, ?)
    `).run(nombre, email, producto_id, talla || 'Única', cantidadNum, total);

    // Decrementar stock
    db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?').run(cantidadNum, producto_id);

    // Enviar email de confirmación (sin bloquear la respuesta si falla)
    const pedido = { id: result.lastInsertRowid, nombre, email, talla: talla || 'Única', cantidad: cantidadNum, total };
    enviarConfirmacion(pedido, producto).catch(() => {});

    res.render('producto', {
      producto: { ...producto, stock: producto.stock - cantidadNum },
      success: `¡Pedido #${result.lastInsertRowid} recibido! Total: ${total.toFixed(2)}€. Te contactaremos en breve para confirmar.`,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.render('producto', { producto, success: null, error: 'Error al procesar el pedido.' });
  }
});

module.exports = router;
