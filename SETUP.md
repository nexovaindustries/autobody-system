# Autobody SAC — Guía de Instalación y Arranque

## Requisitos previos
- Node.js 18+ (LTS)
- PostgreSQL 14+
- npm 9+

---

## 1. Clonar / ubicarse en el directorio
```bash
cd autobody-system
```

## 2. Instalar dependencias
```bash
npm install
```

## 3. Configurar base de datos

### Crear la base de datos en PostgreSQL:
```sql
CREATE DATABASE autobody_db;
```

### Editar `backend/.env` con tus credenciales:
```
DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5432/autobody_db"
JWT_SECRET="cambia-este-secreto-en-produccion"
JWT_REFRESH_SECRET="cambia-este-refresh-secreto-en-produccion"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

## 4. Configurar Prisma y base de datos
```bash
# Desde la raíz del monorepo:
cd backend

# Copiar schema al lugar correcto de Prisma
cp src/prisma/schema.prisma prisma/schema.prisma

# Ejecutar migraciones
npx prisma migrate dev --name init

# Generar cliente Prisma
npx prisma generate

# Poblar con usuarios iniciales
npx tsx src/prisma/seed.ts

cd ..
```

## 5. Arrancar el sistema en desarrollo
```bash
# Desde la raíz:
npm run dev
```

Esto lanza:
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:5173

---

## Usuarios de prueba (post-seed)
| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@autobody.pe | Admin2025! | ADMIN |
| tecnico@autobody.pe | Tecnico2025! | TECNICO |
| recepcion@autobody.pe | Recepcion2025! | RECEPCIONISTA |

---

## URLs del sistema
| Módulo | URL |
|--------|-----|
| Panel interno (login) | http://localhost:5173/login |
| Dashboard | http://localhost:5173/app/dashboard |
| Nueva proforma | http://localhost:5173/app/cotizaciones |
| Órdenes | http://localhost:5173/app/ordenes |
| Usuarios (admin) | http://localhost:5173/app/usuarios |
| **Portal cliente (público)** | http://localhost:5173/seguimiento |

---

## Notas importantes

### Generación de PDFs
El backend genera PDFs con Puppeteer. En Windows, asegúrate de que Chrome/Chromium esté disponible.
Los PDFs se guardan en `backend/pdfs/` y son accesibles en `http://localhost:3001/pdfs/[archivo].pdf`.

### Migración del schema de Prisma
El archivo `schema.prisma` debe estar en `backend/prisma/schema.prisma` para que Prisma lo detecte automáticamente.

```bash
cd backend
mkdir -p prisma
cp src/prisma/schema.prisma prisma/schema.prisma
```

### Para producción
1. Cambiar `JWT_SECRET` y `JWT_REFRESH_SECRET` por valores seguros y aleatorios
2. Configurar HTTPS
3. Usar `npm run build` y servir los estáticos del frontend
4. Configurar backups automáticos de la BD en el proveedor de hosting

---

## Stack técnico
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **BD**: PostgreSQL + Prisma ORM
- **Auth**: JWT + bcrypt (tokens 8h + refresh 7d)
- **PDFs**: Puppeteer
- **State**: Zustand + React Query

---
Sistema desarrollado por Nexova — nexovacorp.com  
Carlos Postigo Emanuel, CTO
