const express = require('express');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const db = require('./data/database');
const contactRouter = require('./routes/contact');
const shopRouter = require('./routes/shop');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'sotoibarbasoa-secret-2025-cambiar-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // cambiar a true si usas HTTPS
    maxAge: 1000 * 60 * 60 * 8 // 8 horas
  }
}));

// Rate limiting for forms
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Demasiadas solicitudes, intenta más tarde.'
});
app.use('/contacto', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────

// HOME
app.get('/', (req, res) => {
  const noticias = db.prepare(`
    SELECT * FROM noticias ORDER BY fecha DESC LIMIT 3
  `).all();
  const patrocinadores = db.prepare(`
    SELECT * FROM patrocinadores ORDER BY nivel DESC, nombre ASC
  `).all();
  res.render('index', { noticias, patrocinadores });
});

// BLOG
app.get('/blog', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const offset = (page - 1) * limit;
  const noticias = db.prepare(`
    SELECT * FROM noticias ORDER BY fecha DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM noticias').get().count;
  const totalPages = Math.ceil(total / limit);
  res.render('blog', { noticias, page, totalPages });
});

app.get('/blog/:id', (req, res) => {
  const noticia = db.prepare('SELECT * FROM noticias WHERE id = ?').get(req.params.id);
  if (!noticia) return res.status(404).render('404');
  res.render('noticia', { noticia });
});

// PLANTILLA
app.get('/equipo', (req, res) => {
  const jugadores = db.prepare(`
    SELECT * FROM jugadores ORDER BY dorsal ASC
  `).all();
  res.render('equipo', { jugadores });
});

// PATROCINADORES
app.get('/patrocinadores', (req, res) => {
  const patrocinadores = db.prepare(`
    SELECT * FROM patrocinadores ORDER BY nivel DESC, nombre ASC
  `).all();
  res.render('patrocinadores', { patrocinadores });
});

// JUEGO
app.get('/juego', (req, res) => {
  res.render('juego');
});

// TIENDA
app.use('/tienda', shopRouter);

// CONTACTO
app.use('/contacto', contactRouter);

// ADMIN
app.use('/admin', adminRouter);

// 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal. Inténtalo más tarde.');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
