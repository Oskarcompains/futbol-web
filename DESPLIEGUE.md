# 🚀 Guía de Despliegue en Hostinger — ClubFC

## Requisitos previos
- Plan Hostinger con **Node.js** habilitado (planes Business o superior)
- Acceso a hPanel (panel de control de Hostinger)
- Git instalado en tu ordenador (opcional pero recomendado)

---

## 📁 Estructura del proyecto

```
futbol-web/
├── server.js              ← Punto de entrada principal
├── package.json           ← Dependencias
├── .env.example           ← Variables de entorno (copiar a .env)
├── .gitignore
├── data/
│   └── database.js        ← Base de datos SQLite (se auto-crea)
├── routes/
│   ├── contact.js         ← Ruta formulario de contacto
│   └── shop.js            ← Ruta tienda y pedidos
├── views/                 ← Plantillas EJS
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── index.ejs          ← Página de inicio
│   ├── blog.ejs
│   ├── noticia.ejs
│   ├── equipo.ejs
│   ├── patrocinadores.ejs
│   ├── tienda.ejs
│   ├── producto.ejs
│   ├── contacto.ejs
│   └── 404.ejs
└── public/                ← Archivos estáticos
    ├── css/
    │   └── main.css
    └── js/
        └── main.js
```

---

## 🔧 Opción A: Subir por Git (recomendado)

### 1. Prepara el repositorio local
```bash
cd futbol-web
git init
git add .
git commit -m "Primer commit - ClubFC web"
```

### 2. Crea un repositorio en GitHub/GitLab y sube el código
```bash
git remote add origin https://github.com/tuusuario/futbol-web.git
git push -u origin main
```

### 3. En hPanel de Hostinger
1. Ve a **Sitios web** → tu dominio → **Node.js**
2. Activa Node.js y selecciona la versión **18.x** o superior
3. En **Git**, conecta tu repositorio
4. Configura:
   - **Archivo de inicio:** `server.js`
   - **Puerto:** `3000`
5. Haz clic en **Deploy** (Desplegar)

---

## 📤 Opción B: Subir por FTP/Administrador de archivos

### 1. Prepara los archivos
- Comprime todo el proyecto **excepto** `node_modules/` y `data/club.db`
- El archivo `.zip` debe contener la carpeta `futbol-web/`

### 2. Sube los archivos
1. En hPanel → **Archivos** → **Administrador de archivos**
2. Ve a la carpeta `public_html` (o la carpeta raíz de tu dominio)
3. Sube y descomprime el `.zip`

### 3. Instala dependencias via SSH
```bash
# Conéctate por SSH (hPanel → SSH)
cd ~/public_html/futbol-web
npm install --production
```

### 4. Configura Node.js en hPanel
1. Ve a **Sitios web** → **Node.js** o **Aplicaciones Node.js**
2. Configura:
   - **Versión Node:** 18.x
   - **Modo:** Production
   - **Archivo de inicio:** `server.js`
   - **URL de la aplicación:** tu dominio

---

## ⚙️ Variables de entorno

En hPanel → Node.js → **Variables de entorno**, añade:

| Variable     | Valor        |
|-------------|--------------|
| `PORT`       | `3000`       |
| `NODE_ENV`   | `production` |
| `CLUB_NOMBRE`| `ClubFC`     |

O crea un archivo `.env` en la raíz del proyecto:
```bash
cp .env.example .env
nano .env  # edita con tus valores
```

---

## ▶️ Arrancar la aplicación

### Desde hPanel
Botón **Restart** o **Start** en la sección Node.js

### Por SSH
```bash
cd ~/public_html/futbol-web
npm start
# o para producción con PM2:
npm install -g pm2
pm2 start server.js --name "clubfc"
pm2 save
pm2 startup
```

---

## 🗄️ Base de datos

La base de datos SQLite (`data/club.db`) se crea **automáticamente** al arrancar la aplicación por primera vez, con datos de ejemplo incluidos.

**Importante:** La carpeta `data/` debe tener permisos de escritura:
```bash
chmod 755 data/
```

---

## 🌐 Configurar dominio

1. En hPanel → **Dominios** → apunta tu dominio a la aplicación Node.js
2. Si usas un subdominio (ej. `club.tudominio.com`), crea el subdominio y apúntalo al puerto de Node.js
3. Hostinger gestiona el SSL automáticamente (Let's Encrypt)

---

## 🔍 Verificar que funciona

Visita las rutas principales:
- `/` → Página de inicio con hero, noticias y patrocinadores
- `/blog` → Listado de noticias con paginación
- `/equipo` → Tabla de jugadores por posición
- `/tienda` → Catálogo de productos con filtros
- `/patrocinadores` → Página de sponsors por nivel
- `/contacto` → Formulario de contacto (guarda en BD)

---

## 📝 Personalización rápida

### Cambiar nombre y colores del club
- **Nombre:** Edita `ClubFC` en todos los archivos `.ejs` y `server.js`
- **Colores:** Modifica `--rojo` y `--acento` en `/public/css/main.css` (variables CSS)
- **Escudo:** Reemplaza el SVG en `views/index.ejs` (sección `.hero-visual`)

### Añadir noticias, jugadores o productos
Edita directamente en `data/database.js` los bloques de datos de ejemplo, o conecta SQLite con un cliente como **DB Browser for SQLite** para gestionar los datos visualmente.

### Añadir imágenes reales
Sube las imágenes a `/public/images/` y actualiza las rutas en la base de datos:
- Noticias: campo `imagen` en tabla `noticias`
- Jugadores: campo `foto` en tabla `jugadores`
- Productos: campo `imagen` en tabla `productos`

---

## 🛠️ Scripts útiles

```bash
npm start          # Arrancar en producción
npm run dev        # Arrancar con nodemon (desarrollo)
```

---

## ❓ Solución de problemas

| Problema | Solución |
|----------|----------|
| `Cannot find module 'better-sqlite3'` | Ejecuta `npm install` en el servidor |
| Puerto ya en uso | Cambia `PORT` en `.env` |
| Base de datos sin permisos | `chmod 755 data/` |
| La web no carga | Revisa los logs en hPanel → Node.js → Logs |

---

*Generado para ClubFC — Web con Express.js + SQLite + EJS*
