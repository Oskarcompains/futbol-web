const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'club.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// ── Create tables ─────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS noticias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    resumen TEXT NOT NULL,
    contenido TEXT NOT NULL,
    imagen TEXT DEFAULT '/images/default-news.jpg',
    fecha TEXT DEFAULT (date('now')),
    categoria TEXT DEFAULT 'General'
  );

  CREATE TABLE IF NOT EXISTS jugadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    dorsal INTEGER NOT NULL,
    posicion TEXT NOT NULL,
    nacionalidad TEXT DEFAULT 'España',
    edad INTEGER,
    foto TEXT DEFAULT '/images/default-player.jpg',
    goles INTEGER DEFAULT 0,
    partidos INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS patrocinadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    logo TEXT DEFAULT '/images/default-logo.png',
    web TEXT,
    nivel INTEGER DEFAULT 1,
    descripcion TEXT
  );

  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    imagen TEXT DEFAULT '/images/default-product.jpg',
    stock INTEGER DEFAULT 100,
    categoria TEXT DEFAULT 'Camisetas'
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    producto_id INTEGER,
    talla TEXT,
    cantidad INTEGER DEFAULT 1,
    total REAL,
    estado TEXT DEFAULT 'pendiente',
    fecha TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );

  CREATE TABLE IF NOT EXISTS mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    asunto TEXT,
    mensaje TEXT NOT NULL,
    fecha TEXT DEFAULT (datetime('now')),
    leido INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
`);

// ── Seed data (only if tables are empty) ─────────────────────────────────────

const noticiaCount = db.prepare('SELECT COUNT(*) as c FROM noticias').get().c;
if (noticiaCount === 0) {
  const insertNoticia = db.prepare(`
    INSERT INTO noticias (titulo, resumen, contenido, imagen, fecha, categoria) VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNoticia.run(
    'Victoria aplastante en el derbi local',
    'El equipo se impuso con autoridad ante el rival histórico con un marcador de 3-0.',
    'Fue una noche mágica en nuestro estadio. Los tres goles llegaron en la segunda parte con una actuación colectiva brillante. El capitán abrió el marcador en el minuto 52, y los demás delanteros pusieron el broche de oro.',
    '/images/news1.jpg', '2025-03-15', 'Partidos'
  );
  insertNoticia.run(
    'Nuevo fichaje para reforzar la delantera',
    'El club anuncia la incorporación de un delantero con experiencia en segunda división.',
    'Tras semanas de negociaciones, el club hace oficial la llegada del nuevo refuerzo. Con 24 años y más de 30 goles en su carrera, llega con hambre de triunfar y ganas de aportar al equipo.',
    '/images/news2.jpg', '2025-03-10', 'Club'
  );
  insertNoticia.run(
    'Pretemporada 2025: fechas y rivales confirmados',
    'Ya conocemos el calendario de pretemporada con partidos de preparación de alto nivel.',
    'La dirección deportiva ha cerrado los acuerdos para una pretemporada exigente. Cinco partidos en tres semanas frente a rivales de categorías superiores para llegar al máximo nivel el día del inicio oficial.',
    '/images/news3.jpg', '2025-03-05', 'Club'
  );
}

const jugadorCount = db.prepare('SELECT COUNT(*) as c FROM jugadores').get().c;
if (jugadorCount === 0) {
  const insert = db.prepare(`INSERT INTO jugadores (nombre, dorsal, posicion, edad, goles, partidos) VALUES (?, ?, ?, ?, ?, ?)`);
  insert.run('Marcos García', 1, 'Portero', 28, 0, 22);
  insert.run('Pedro Sánchez', 2, 'Defensa', 25, 1, 20);
  insert.run('Luis Torres', 3, 'Defensa', 30, 2, 21);
  insert.run('Carlos Ruiz', 4, 'Defensa', 27, 0, 19);
  insert.run('Iván López', 5, 'Defensa', 24, 3, 22);
  insert.run('Sergio Martín', 6, 'Centrocampista', 26, 5, 22);
  insert.run('Alejandro Gil', 8, 'Centrocampista', 23, 7, 20);
  insert.run('Raúl Fernández', 10, 'Centrocampista', 29, 9, 22);
  insert.run('Diego Moreno', 7, 'Delantero', 22, 8, 18);
  insert.run('Pablo Díaz', 9, 'Delantero', 27, 12, 22);
  insert.run('Adrián Castro', 11, 'Delantero', 25, 10, 21);
}

const patrocinadorCount = db.prepare('SELECT COUNT(*) as c FROM patrocinadores').get().c;
if (patrocinadorCount === 0) {
  const insert = db.prepare(`INSERT INTO patrocinadores (nombre, web, nivel, descripcion) VALUES (?, ?, ?, ?)`);
  insert.run('Deportes Navarra', 'https://example.com', 3, 'Patrocinador principal del club desde 2020');
  insert.run('Clínica Sport', 'https://example.com', 3, 'Servicios médicos y fisioterapia para el equipo');
  insert.run('Talleres García', 'https://example.com', 2, 'Colaborador oficial en transporte');
  insert.run('Bar La Peña', 'https://example.com', 1, 'Punto de encuentro de la afición');
  insert.run('Supermercados Plus', 'https://example.com', 2, 'Alimentación oficial del club');
}

const productoCount = db.prepare('SELECT COUNT(*) as c FROM productos').get().c;
if (productoCount === 0) {
  const insert = db.prepare(`INSERT INTO productos (nombre, descripcion, precio, categoria) VALUES (?, ?, ?, ?)`);
  insert.run('Camiseta Local 2025', 'Equipación oficial temporada 2025. 100% poliéster técnico.', 45.00, 'Camisetas');
  insert.run('Camiseta Visitante 2025', 'Equipación visitante temporada 2025. Edición limitada.', 45.00, 'Camisetas');
  insert.run('Sudadera del Club', 'Sudadera con capucha y escudo bordado. Algodón premium.', 38.00, 'Ropa');
  insert.run('Bufanda Oficial', 'Bufanda de aficionado con los colores del club.', 12.00, 'Accesorios');
  insert.run('Gorra del Club', 'Gorra con escudo bordado. Talla única ajustable.', 15.00, 'Accesorios');
  insert.run('Balón Oficial', 'Balón de entrenamiento con el logo del club.', 29.00, 'Material');
}

// ── Admin por defecto ─────────────────────────────────────────────────────
const adminCount = db.prepare('SELECT COUNT(*) as c FROM admins').get().c;
if (adminCount === 0) {
  const hash = bcrypt.hashSync('admin1234', 10);
  db.prepare('INSERT INTO admins (usuario, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('✅ Admin creado — usuario: admin | contraseña: admin1234 (¡cámbiala desde el panel!)');
}

module.exports = db;
