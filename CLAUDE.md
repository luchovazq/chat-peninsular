# CLAUDE.md — Chat Peninsular

Este archivo es el harness de IA para Claude Code. Léelo completo antes de tocar cualquier archivo del proyecto.

---

## Qué es este proyecto

**Chat Peninsular** es una aplicación web de mensajería interna para equipos pequeños (12–20 personas), construida como alternativa self-hosted a Slack/Teams/Rocket.Chat. Nació para Caribe Peninsular (caribepeninsular.mx), una sala de redacción digital en Cancún, Quintana Roo, México.

Es un proyecto **open source**. El código debe ser legible por cualquier desarrollador que lo adopte.

**Repositorio:** https://github.com/[usuario]/chat-peninsular ← actualizar cuando exista

---

## Prioridades del proyecto (en orden)

1. **Que funcione** — entrega sobre elegancia. Si hay que elegir entre código bonito y que el equipo lo use hoy, gana que lo use hoy.
2. **Equilibrio** — aprender + funcionar + mantener, sin sacrificar ninguno completamente.
3. **Mantenible por una sola persona** — Luis es el único mantenedor. Si algo requiere más de 30 minutos de diagnóstico para un error común, es demasiado complejo.
4. **Código ejemplar** — viene después, no antes.

---

## Stack

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | Next.js 14+ (App Router), React, TypeScript | Todo en `/apps/web` |
| Estilos | Tailwind CSS | Sin CSS-in-JS |
| Tiempo real | Socket.IO | Servidor separado de Next.js |
| Backend API | Node.js + TypeScript (Express) | En `/apps/server` |
| WebSockets | Socket.IO server en `/apps/server` | Next.js no maneja WS persistentes bien |
| Base de datos | PostgreSQL (Docker en VPS) | |
| ORM | Prisma | Genera tipos TS automáticamente |
| Auth | Magic link por email (Nodemailer + JWT) | Sin passwords |
| Almacenamiento | Sistema de archivos local del VPS | Solo imágenes en v1 |
| Monorepo | pnpm workspaces | |
| Reverse proxy | nginx (ya existe en el VPS) | Chat en subdominio chat.caribepeninsular.mx |
| Contenedores | Docker + docker-compose | Postgres + server |

---

## Estructura del monorepo

```
chat-peninsular/
├── apps/
│   ├── web/          # Next.js frontend
│   └── server/       # Node.js + Socket.IO backend
├── packages/
│   └── types/        # Tipos TypeScript compartidos entre apps
├── docs/             # Specs y arquitectura (no tocar al generar código)
├── docker-compose.yml
├── package.json      # pnpm workspaces root
└── CLAUDE.md         # Este archivo
```

---

## Convenciones de código

### TypeScript
- **Strict mode activado** en todos los tsconfig. No usar `any` salvo que sea inevitable y esté comentado.
- Preferir `type` sobre `interface` para objetos de datos; `interface` para contratos que se extienden.
- Exportar tipos desde `packages/types/index.ts` cuando se comparten entre `web` y `server`.

### Nombrado
- Archivos de componentes React: `PascalCase.tsx`
- Archivos de utilidades y rutas: `kebab-case.ts`
- Variables y funciones: `camelCase`
- Constantes globales: `UPPER_SNAKE_CASE`
- Eventos de Socket.IO: `snake_case` (ej. `message:send`, `channel:join`)

### Estructura de componentes React
```tsx
// 1. Imports externos
// 2. Imports internos
// 3. Types locales
// 4. Componente
// 5. Export default
```

### API REST
- Rutas en `/api/v1/...`
- Respuestas siempre con forma `{ data, error }`:
  ```ts
  // Éxito
  { data: T, error: null }
  // Error
  { data: null, error: { message: string, code: string } }
  ```
- Códigos HTTP semánticos: 200, 201, 400, 401, 403, 404, 500.

### Manejo de errores
- **Nunca** `console.log` en producción. Usar un logger simple (pino).
- Todo `async/await` dentro de un try/catch o con un wrapper helper.
- Errores del usuario (400, 401, 403) deben tener mensajes en español — el equipo es hispanohablante.

---

## Base de datos — reglas Prisma

- Siempre correr `npx prisma generate` después de cambiar el schema.
- Migrations con nombres descriptivos: `npx prisma migrate dev --name "add_channel_archived_field"`.
- No usar `prisma.upsert` con lógica compleja; preferir transacciones explícitas.
- Soft delete en mensajes: campo `deletedAt DateTime?` — nunca borrar físicamente un mensaje.

---

## Reglas de negocio críticas (NO cambiar sin revisar spec)

1. **Mensajes:** editar y borrar solo si `Date.now() - message.createdAt < 2 horas`. Validar en servidor, no solo en cliente.
2. **Borrado:** soft delete. El mensaje queda con `deletedAt` y el cliente muestra "Este mensaje fue eliminado".
3. **Invitaciones:** el registro es solo por invitación. No existe ruta pública de signup.
4. **Magic link:** expira en 15 minutos. Un solo uso (invalidar después de usar).
5. **Imágenes:** tamaño máximo 5MB por archivo. Tipos permitidos: `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
6. **Canales privados:** el contenido NO aparece en búsqueda para usuarios que no son miembros.

---

## Reglas de desarrollo

- **No instalar librerías nuevas sin evaluar si ya existe algo en el proyecto que resuelva lo mismo.** El bundle debe mantenerse liviano.
- **No generar código para features fuera del scope de v1.** Ver `docs/specs/00-scope.md`. Si algo no está en las specs, preguntar antes de implementar.
- **No mover la lógica de negocio al cliente.** Las validaciones críticas (ventana de 2 horas, permisos de canal) viven en el servidor.
- **No usar `localStorage` para datos sensibles.** El token de sesión va en una cookie `httpOnly`.
- **Preferir soluciones simples.** Si hay una forma de hacer algo en 20 líneas y otra en 5 archivos con abstracciones, elegir las 20 líneas.

---

## Comandos frecuentes

```bash
# Instalar dependencias (desde la raíz)
pnpm install

# Desarrollo local
pnpm dev              # Corre web + server en paralelo

# Solo frontend
pnpm --filter web dev

# Solo backend
pnpm --filter server dev

# Base de datos (Docker)
docker-compose up -d postgres

# Migraciones
pnpm --filter server prisma:migrate

# Generar tipos Prisma
pnpm --filter server prisma:generate

# Build producción
pnpm build

# Tests
pnpm test
```

---

## Entorno de producción

- **VPS:** el mismo donde corre Caribe Peninsular (WordPress + LiteSpeed).
- **Subdominio:** `chat.caribepeninsular.mx`
- **Reverse proxy:** nginx redirige el subdominio al puerto de la app. El WebSocket requiere headers `Upgrade` y `Connection` en la config de nginx.
- **Postgres:** corre en Docker en el mismo VPS, accesible solo desde localhost.
- **Variables de entorno:** nunca hardcodear. Usar `.env` local y variables de entorno del sistema en producción. El `.env` nunca se commitea.

---

## Lo que NO es este proyecto (v1)

- No hay threads (respuestas anidadas dentro de un mensaje).
- No hay reacciones con emoji.
- No hay llamadas de voz ni video.
- No hay bots ni webhooks entrantes.
- No hay integración con WhatsApp ni email externo.
- No hay app móvil nativa (es web responsive).
- No hay registro público — todo es por invitación.

Estas features están documentadas como candidatas para v2 en `docs/specs/00-scope.md`.

---

## Contexto del equipo

- **Mantenedor:** Luis Vázquez (TAE → Solutions Engineer, Cancún MX)
- **Usuarios:** equipo de Caribe Peninsular, ~12 personas, periodistas y colaboradores digitales
- **Idioma de la UI:** español
- **Idioma del código:** inglés (variables, funciones, comentarios técnicos)
- **Idioma de mensajes de error al usuario:** español
