const express = require('express');
const router = express.Router();
const db = require('../data/database');

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

router.post('/pedido', (req, res) => {
  const { nombre, email, producto_id, talla, cantidad } = req.body;
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(producto_id);

  if (!producto) return res.status(404).render('404');
  if (!nombre || !email) {
    return res.render('producto', { producto, success: null, error: 'Rellena todos los campos.' });
  }

  const total = producto.precio * (parseInt(cantidad) || 1);

  try {
    db.prepare(`
      INSERT INTO pedidos (nombre, email, producto_id, talla, cantidad, total) VALUES (?, ?, ?, ?, ?, ?)
    `).run(nombre, email, producto_id, talla || 'Única', parseInt(cantidad) || 1, total);

    res.render('producto', {
      producto,
      success: `¡Pedido recibido! Total: ${total.toFixed(2)}€. Te contactaremos en breve para confirmar.`,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.render('producto', { producto, success: null, error: 'Error al procesar el pedido.' });
  }
});

module.exports = router;
