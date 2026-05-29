# Chat Peninsular

Una aplicación web de mensajería interna para equipos pequeños. Self-hosted, open source, construida con TypeScript, Next.js y Node.js.

> Nacida en Cancún para la redacción de [Caribe Peninsular](https://caribepeninsular.mx), como alternativa real a Slack, Teams y Rocket.Chat cuando las membresías se pagan y nadie las usa.

---

## ¿Qué es?

Chat Peninsular es un chat interno para equipos de hasta ~20 personas que quieren:

- **Canales organizados** — públicos y privados, como Slack pero sin la factura.
- **Mensajes directos** — conversaciones uno a uno.
- **Historial en la nube** — las conversaciones viven en tu servidor, nunca en el dispositivo de nadie.
- **Acceso por invitación** — sin registro público, sin cuentas de extraños.
- **Presencia en tiempo real** — quién está en línea, quién está escribiendo.
- **Self-hosted** — tus datos en tu VPS, bajo tu control.

---

## Stack

- **Frontend:** Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, TypeScript, Express, Socket.IO
- **Base de datos:** PostgreSQL + Prisma
- **Auth:** Magic link por email (sin contraseñas)
- **Monorepo:** pnpm workspaces

---

## Requisitos

- Node.js 20+
- pnpm 9+
- Docker y docker-compose (para PostgreSQL local)
- Un servidor SMTP (para los magic links)

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/[usuario]/chat-peninsular.git
cd chat-peninsular

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# 4. Editar las variables de entorno con tus valores
# (ver sección Configuración abajo)

# 5. Levantar la base de datos
docker-compose up -d postgres

# 6. Correr migraciones
pnpm --filter server prisma:migrate

# 7. Iniciar en desarrollo
pnpm dev
```

La app estará en `http://localhost:3000` y el servidor en `http://localhost:3001`.

---

## Configuración

### `apps/server/.env`

```env
DATABASE_URL="postgresql://chatpeninsula:password@localhost:5432/chatpeninsula"
JWT_SECRET="cambia-esto-por-un-string-aleatorio-largo"
SMTP_HOST="smtp.tuproveedor.com"
SMTP_PORT=587
SMTP_USER="tu@email.com"
SMTP_PASS="tu-password-smtp"
SMTP_FROM="Chat Peninsular <noreply@tudominio.com>"
APP_URL="http://localhost:3000"
PORT=3001
```

### `apps/web/.env`

```env
NEXT_PUBLIC_SERVER_URL="http://localhost:3001"
```

---

## Despliegue en producción (VPS con nginx)

Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para la guía completa de despliegue, incluyendo la configuración de nginx para WebSockets.

---

## Roadmap

### v1 (actual)
- [x] Arquitectura base y monorepo
- [ ] Auth por magic link
- [ ] Canales públicos y privados
- [ ] Mensajes directos (DMs)
- [ ] Presencia en tiempo real
- [ ] Búsqueda básica en historial
- [ ] Panel de administración simple

### v1.5
- [ ] Llamadas de voz grupales (LiveKit)

### v2
- [ ] Threads y respuestas anidadas
- [ ] Reacciones con emoji
- [ ] Adjuntar archivos genéricos
- [ ] Notificaciones push

---

## Contribuir

Este proyecto nació como herramienta interna pero se publica como open source para que cualquier equipo pequeño pueda adoptarlo. Las contribuciones son bienvenidas.

1. Fork del repositorio
2. Crea una rama: `git checkout -b feature/nombre-de-la-feature`
3. Commit con mensajes descriptivos en inglés
4. Abre un Pull Request describiendo qué cambia y por qué

Por favor lee [`docs/specs/00-scope.md`](docs/specs/00-scope.md) antes de proponer features para entender qué está y qué no está en scope.

---

## Licencia

MIT — úsalo, adáptalo, mejóralo.

---

*Hecho en Cancún, Quintana Roo 🌴*
