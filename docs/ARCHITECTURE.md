# Arquitectura — Chat Peninsular

## Diagrama de alto nivel

```
                        Internet
                           │
                    [nginx reverse proxy]
                    chat.caribepeninsular.mx
                           │
              ┌────────────┴────────────┐
              │                         │
        Puerto 3000                Puerto 3001
      [Next.js / Web]          [Node.js Server]
      - Páginas React           - REST API /api/v1
      - Server Components       - Socket.IO WebSocket
      - Static assets           - Auth (magic link)
                                - Upload de imágenes
                                     │
                              ┌──────┴──────┐
                              │             │
                        [PostgreSQL]   [/uploads]
                         Docker        Sistema de
                         VPS local     archivos VPS
```

## Por qué dos procesos separados (Next.js + Node.js)

Next.js en su modo recomendado (Vercel / serverless) no soporta conexiones WebSocket persistentes. Aunque se use en un VPS, el runtime de Next.js no está diseñado para manejar conexiones de larga duración como las de Socket.IO.

La solución estándar es un servidor Node.js separado que maneja:
- El WebSocket (Socket.IO)
- La API REST
- La lógica de negocio

Next.js se ocupa solo del frontend: renderizado, rutas de página, y activos estáticos. Los dos procesos se comunican solo a través de la red local (el cliente web hace fetch y abre el socket contra el servidor Node.js).

## Monorepo con pnpm workspaces

```
chat-peninsular/
├── apps/
│   ├── web/          # Next.js 14+ (App Router)
│   └── server/       # Node.js + Express + Socket.IO
├── packages/
│   └── types/        # Tipos TS compartidos
├── package.json      # Workspace root
└── pnpm-workspace.yaml
```

El paquete `packages/types` es el puente entre front y back. Define las formas de datos (User, Channel, Message, etc.) una sola vez, y ambas apps las importan. Esto elimina la clase de bugs donde el frontend espera un campo que el backend ya no manda.

## Base de datos — PostgreSQL

### Por qué Postgres y no SQLite

SQLite sería más simple para empezar, pero Chat Peninsular tiene conexiones concurrentes en tiempo real (múltiples usuarios escribiendo al mismo tiempo). Postgres maneja concurrencia con transacciones y locks correctamente. SQLite tiene limitaciones con escrituras concurrentes que causarían corrupción o errores bajo carga normal de un equipo de 12 personas.

### Por qué Docker para Postgres en el VPS

- Aislamiento: Postgres no contamina el sistema operativo del VPS.
- Portabilidad: si se migra de VPS, `docker-compose up` y listo.
- El VPS ya corre el servidor web de Caribe Peninsular (LiteSpeed + WordPress). Postgres en Docker no interfiere.

### Por qué Prisma como ORM

- Genera tipos TypeScript automáticamente desde el schema. El editor sabe qué campos tiene cada tabla.
- Las migraciones son archivos SQL versionados en git — auditable y revertible.
- La API es más segura que queries crudas (previene SQL injection por diseño).

## Autenticación — Magic Link

Sin contraseñas. El flujo es:

1. Usuario ingresa su email en `/login`
2. Servidor genera un token JWT de un solo uso (TTL: 15 minutos)
3. Servidor envía email con link: `https://chat.caribepeninsular.mx/auth/verify?token=xxx`
4. Usuario hace clic → servidor valida token → crea sesión → invalida el token
5. Sesión almacenada como cookie `httpOnly` (no accesible por JavaScript)

### Por qué magic link y no OAuth (Google, etc.)

- El equipo de Caribe Peninsular no necesariamente tiene todos Google Workspace. Magic link funciona con cualquier email.
- Menos dependencias externas. No hay un proveedor OAuth que pueda caerse o cambiar sus políticas.
- Para un equipo interno de 12 personas, la UX de "te mando un link al correo" es suficiente.

## Tiempo real — Socket.IO

Socket.IO corre en el mismo proceso Node.js que la API REST (mismo puerto, diferentes rutas). Esto simplifica el despliegue.

### Eventos principales (v1)

```
Cliente → Servidor:
  message:send          Enviar mensaje a canal o DM
  message:edit          Editar mensaje propio (ventana 2h)
  message:delete        Borrar mensaje propio (ventana 2h)
  channel:join          Unirse a un canal (suscribirse a eventos)
  channel:leave         Salir de un canal
  typing:start          Empezó a escribir
  typing:stop           Dejó de escribir

Servidor → Cliente:
  message:new           Nuevo mensaje en canal/DM
  message:updated       Mensaje editado
  message:deleted       Mensaje borrado
  user:presence         Cambio de estado de un usuario
  typing:update         Lista actualizada de quién escribe
```

## nginx — configuración para WebSockets

El reverse proxy requiere headers especiales para que Socket.IO funcione. Sin esto, las conexiones WebSocket fallan silenciosamente y la app queda en modo polling (lento).

```nginx
server {
    listen 443 ssl;
    server_name chat.caribepeninsular.mx;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend + WebSocket (Node.js)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

## Almacenamiento de imágenes (v1)

Las imágenes se guardan en el sistema de archivos del VPS en `/var/chat-peninsular/uploads/`. nginx sirve los archivos directamente bajo `/uploads/`.

Esto es la solución más simple. Las limitaciones son:
- Si se migra de VPS, hay que mover los archivos manualmente.
- No escala a múltiples servidores.

Para v2, si el almacenamiento crece, se migra a un bucket S3 (o compatible, como Cloudflare R2) sin cambiar la interfaz de la app.

## Despliegue en producción

### Proceso recomendado

```bash
# En el VPS
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pnpm --filter server prisma:migrate:deploy

# Reiniciar procesos con PM2
pm2 restart chat-web
pm2 restart chat-server
```

### PM2 — gestión de procesos

PM2 mantiene los procesos corriendo y los reinicia si se caen. Config en `ecosystem.config.js` en la raíz.

```js
module.exports = {
  apps: [
    {
      name: 'chat-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: { PORT: 3000, NODE_ENV: 'production' }
    },
    {
      name: 'chat-server',
      cwd: './apps/server',
      script: 'dist/index.js',
      env: { PORT: 3001, NODE_ENV: 'production' }
    }
  ]
}
```
