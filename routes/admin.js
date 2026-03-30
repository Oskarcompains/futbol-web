const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../data/database');

// ── Middleware de autenticación ────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.adminLoggedIn) return next();
  res.redirect('/admin/login');
}

// ── LOGIN ──────────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.adminLoggedIn) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE usuario = ?').get(usuario);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.render('admin/login', { error: 'Usuario o contraseña incorrectos.' });
  }
  req.session.adminLoggedIn = true;
  req.session.adminUser = admin.usuario;
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ── DASHBOARD ──────────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  const stats = {
    noticias: db.prepare('SELECT COUNT(*) as c FROM noticias').get().c,
    jugadores: db.prepare('SELECT COUNT(*) as c FROM jugadores').get().c,
    productos: db.prepare('SELECT COUNT(*) as c FROM productos').get().c,
    patrocinadores: db.prepare('SELECT COUNT(*) as c FROM patrocinadores').get().c,
    mensajes: db.prepare('SELECT COUNT(*) as c FROM mensajes WHERE leido = 0').get().c,
    pedidos: db.prepare("SELECT COUNT(*) as c FROM pedidos WHERE estado = 'pendiente'").get().c,
  };
  const mensajes_recientes = db.prepare('SELECT * FROM mensajes ORDER BY fecha DESC LIMIT 5').all();
  const pedidos_recientes = db.prepare(`
    SELECT p.*, pr.nombre as producto_nombre FROM pedidos p
    LEFT JOIN productos pr ON p.producto_id = pr.id
    ORDER BY p.fecha DESC LIMIT 5
  `).all();
  res.render('admin/dashboard', { stats, mensajes_recientes, pedidos_recientes, admin: req.session.adminUser });
});

// ══ NOTICIAS ══════════════════════════════════════════════════════════════

router.get('/noticias', requireAuth, (req, res) => {
  const noticias = db.prepare('SELECT * FROM noticias ORDER BY fecha DESC').all();
  res.render('admin/noticias', { noticias, admin: req.session.adminUser });
});

router.get('/noticias/nueva', requireAuth, (req, res) => {
  res.render('admin/noticia-form', { noticia: null, admin: req.session.adminUser });
});

router.post('/noticias/nueva', requireAuth, (req, res) => {
  const { titulo, resumen, contenido, categoria, fecha } = req.body;
  db.prepare('INSERT INTO noticias (titulo, resumen, contenido, categoria, fecha) VALUES (?,?,?,?,?)').run(
    titulo, resumen, contenido, categoria || 'General', fecha || new Date().toISOString().split('T')[0]
  );
  res.redirect('/admin/noticias');
});

router.get('/noticias/editar/:id', requireAuth, (req, res) => {
  const noticia = db.prepare('SELECT * FROM noticias WHERE id = ?').get(req.params.id);
  if (!noticia) return res.redirect('/admin/noticias');
  res.render('admin/noticia-form', { noticia, admin: req.session.adminUser });
});

router.post('/noticias/editar/:id', requireAuth, (req, res) => {
  const { titulo, resumen, contenido, categoria, fecha } = req.body;
  db.prepare('UPDATE noticias SET titulo=?, resumen=?, contenido=?, categoria=?, fecha=? WHERE id=?').run(
    titulo, resumen, contenido, categoria, fecha, req.params.id
  );
  res.redirect('/admin/noticias');
});

router.post('/noticias/eliminar/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM noticias WHERE id = ?').run(req.params.id);
  res.redirect('/admin/noticias');
});

// ══ JUGADORES ══════════════════════════════════════════════════════════════

router.get('/jugadores', requireAuth, (req, res) => {
  const jugadores = db.prepare('SELECT * FROM jugadores ORDER BY dorsal ASC').all();
  res.render('admin/jugadores', { jugadores, admin: req.session.adminUser });
});

router.get('/jugadores/nuevo', requireAuth, (req, res) => {
  res.render('admin/jugador-form', { jugador: null, admin: req.session.adminUser });
});

router.post('/jugadores/nuevo', requireAuth, (req, res) => {
  const { nombre, dorsal, posicion, nacionalidad, edad, goles, partidos } = req.body;
  db.prepare('INSERT INTO jugadores (nombre, dorsal, posicion, nacionalidad, edad, goles, partidos) VALUES (?,?,?,?,?,?,?)').run(
    nombre, parseInt(dorsal), posicion, nacionalidad || 'España', parseInt(edad)||null, parseInt(goles)||0, parseInt(partidos)||0
  );
  res.redirect('/admin/jugadores');
});

router.get('/jugadores/editar/:id', requireAuth, (req, res) => {
  const jugador = db.prepare('SELECT * FROM jugadores WHERE id = ?').get(req.params.id);
  if (!jugador) return res.redirect('/admin/jugadores');
  res.render('admin/jugador-form', { jugador, admin: req.session.adminUser });
});

router.post('/jugadores/editar/:id', requireAuth, (req, res) => {
  const { nombre, dorsal, posicion, nacionalidad, edad, goles, partidos } = req.body;
  db.prepare('UPDATE jugadores SET nombre=?, dorsal=?, posicion=?, nacionalidad=?, edad=?, goles=?, partidos=? WHERE id=?').run(
    nombre, parseInt(dorsal), posicion, nacionalidad, parseInt(edad)||null, parseInt(goles)||0, parseInt(partidos)||0, req.params.id
  );
  res.redirect('/admin/jugadores');
});

router.post('/jugadores/eliminar/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM jugadores WHERE id = ?').run(req.params.id);
  res.redirect('/admin/jugadores');
});

// ══ PRODUCTOS ══════════════════════════════════════════════════════════════

router.get('/productos', requireAuth, (req, res) => {
  const productos = db.prepare('SELECT * FROM productos ORDER BY categoria, nombre').all();
  const stats = {
    total: productos.length,
    agotados: productos.filter(p => p.stock === 0).length,
    bajo_stock: productos.filter(p => p.stock > 0 && p.stock < 10).length,
    valor_inventario: productos.reduce((acc, p) => acc + p.precio * p.stock, 0),
  };
  res.render('admin/productos', { productos, stats, admin: req.session.adminUser });
});

router.get('/productos/nuevo', requireAuth, (req, res) => {
  res.render('admin/producto-form', { producto: null, admin: req.session.adminUser });
});

router.post('/productos/nuevo', requireAuth, (req, res) => {
  const { nombre, descripcion, precio, categoria, stock } = req.body;
  db.prepare('INSERT INTO productos (nombre, descripcion, precio, categoria, stock) VALUES (?,?,?,?,?)').run(
    nombre, descripcion, parseFloat(precio), categoria || 'General', parseInt(stock)||100
  );
  res.redirect('/admin/productos');
});

router.get('/productos/editar/:id', requireAuth, (req, res) => {
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!producto) return res.redirect('/admin/productos');
  res.render('admin/producto-form', { producto, admin: req.session.adminUser });
});

router.post('/productos/editar/:id', requireAuth, (req, res) => {
  const { nombre, descripcion, precio, categoria, stock } = req.body;
  db.prepare('UPDATE productos SET nombre=?, descripcion=?, precio=?, categoria=?, stock=? WHERE id=?').run(
    nombre, descripcion, parseFloat(precio), categoria, parseInt(stock)||0, req.params.id
  );
  res.redirect('/admin/productos');
});

router.post('/productos/stock/:id', requireAuth, (req, res) => {
  const nuevo = Math.max(0, parseInt(req.body.stock) || 0);
  db.prepare('UPDATE productos SET stock = ? WHERE id = ?').run(nuevo, req.params.id);
  res.redirect('/admin/productos');
});

router.post('/productos/eliminar/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
  res.redirect('/admin/productos');
});

// ══ PATROCINADORES ═════════════════════════════════════════════════════════

router.get('/patrocinadores', requireAuth, (req, res) => {
  const patrocinadores = db.prepare('SELECT * FROM patrocinadores ORDER BY nivel DESC, nombre').all();
  res.render('admin/patrocinadores', { patrocinadores, admin: req.session.adminUser });
});

router.get('/patrocinadores/nuevo', requireAuth, (req, res) => {
  res.render('admin/patrocinador-form', { patrocinador: null, admin: req.session.adminUser });
});

router.post('/patrocinadores/nuevo', requireAuth, (req, res) => {
  const { nombre, web, nivel, descripcion } = req.body;
  db.prepare('INSERT INTO patrocinadores (nombre, web, nivel, descripcion) VALUES (?,?,?,?)').run(
    nombre, web, parseInt(nivel)||1, descripcion
  );
  res.redirect('/admin/patrocinadores');
});

router.get('/patrocinadores/editar/:id', requireAuth, (req, res) => {
  const patrocinador = db.prepare('SELECT * FROM patrocinadores WHERE id = ?').get(req.params.id);
  if (!patrocinador) return res.redirect('/admin/patrocinadores');
  res.render('admin/patrocinador-form', { patrocinador, admin: req.session.adminUser });
});

router.post('/patrocinadores/editar/:id', requireAuth, (req, res) => {
  const { nombre, web, nivel, descripcion } = req.body;
  db.prepare('UPDATE patrocinadores SET nombre=?, web=?, nivel=?, descripcion=? WHERE id=?').run(
    nombre, web, parseInt(nivel)||1, descripcion, req.params.id
  );
  res.redirect('/admin/patrocinadores');
});

router.post('/patrocinadores/eliminar/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM patrocinadores WHERE id = ?').run(req.params.id);
  res.redirect('/admin/patrocinadores');
});

// ══ MENSAJES ═══════════════════════════════════════════════════════════════

router.get('/mensajes', requireAuth, (req, res) => {
  const mensajes = db.prepare('SELECT * FROM mensajes ORDER BY fecha DESC').all();
  db.prepare('UPDATE mensajes SET leido = 1').run();
  res.render('admin/mensajes', { mensajes, admin: req.session.adminUser });
});

router.post('/mensajes/eliminar/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM mensajes WHERE id = ?').run(req.params.id);
  res.redirect('/admin/mensajes');
});

// ══ PEDIDOS ════════════════════════════════════════════════════════════════

router.get('/pedidos', requireAuth, (req, res) => {
  const pedidos = db.prepare(`
    SELECT p.*, pr.nombre as producto_nombre FROM pedidos p
    LEFT JOIN productos pr ON p.producto_id = pr.id
    ORDER BY p.fecha DESC
  `).all();
  res.render('admin/pedidos', { pedidos, admin: req.session.adminUser });
});

router.post('/pedidos/estado/:id', requireAuth, (req, res) => {
  const { estado } = req.body;
  db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, req.params.id);
  res.redirect('/admin/pedidos');
});

// ══ AJUSTES (cambiar contraseña) ═══════════════════════════════════════════

router.get('/ajustes', requireAuth, (req, res) => {
  res.render('admin/ajustes', { admin: req.session.adminUser, success: null, error: null });
});

router.post('/ajustes/password', requireAuth, (req, res) => {
  const { actual, nueva, confirmar } = req.body;
  const adminRec = db.prepare('SELECT * FROM admins WHERE usuario = ?').get(req.session.adminUser);
  if (!bcrypt.compareSync(actual, adminRec.password_hash)) {
    return res.render('admin/ajustes', { admin: req.session.adminUser, error: 'La contraseña actual es incorrecta.', success: null });
  }
  if (nueva !== confirmar) {
    return res.render('admin/ajustes', { admin: req.session.adminUser, error: 'Las contraseñas nuevas no coinciden.', success: null });
  }
  if (nueva.length < 6) {
    return res.render('admin/ajustes', { admin: req.session.adminUser, error: 'La contraseña debe tener al menos 6 caracteres.', success: null });
  }
  const hash = bcrypt.hashSync(nueva, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE usuario = ?').run(hash, req.session.adminUser);
  res.render('admin/ajustes', { admin: req.session.adminUser, success: '¡Contraseña actualizada correctamente!', error: null });
});

module.exports = router;
