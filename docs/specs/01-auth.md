# Spec 01 — Autenticación

## Resumen

Autenticación por magic link. Sin contraseñas. Acceso solo por invitación del admin.

---

## Flujo completo

### 1. Invitación (admin)

```
Admin abre panel → Ingresa email del nuevo miembro → Sistema crea invitación
→ Envía email con link de "activar cuenta" → Link válido por 48 horas
```

Una invitación es diferente a un magic link. La invitación crea la cuenta. El magic link inicia sesión en una cuenta existente.

### 2. Primer acceso (usuario invitado)

```
Usuario recibe email de invitación
→ Hace clic en link (GET /auth/accept-invite?token=xxx)
→ Servidor valida token de invitación (no expirado, no usado)
→ Servidor activa la cuenta del usuario
→ Crea sesión y redirige al workspace
```

En el primer acceso se le pide al usuario su nombre de display (no el email, que ya se conoce).

### 3. Login posterior (usuario ya registrado)

```
Usuario va a /login
→ Ingresa su email
→ Servidor genera magic link (JWT, TTL 15 min, un solo uso)
→ Envía email con link (GET /auth/verify?token=xxx)
→ Usuario hace clic
→ Servidor valida: token válido + no usado + no expirado
→ Marca token como usado
→ Crea sesión (cookie httpOnly, TTL 30 días)
→ Redirige a /app
```

### 4. Cierre de sesión

```
Usuario hace clic en "Cerrar sesión"
→ Servidor invalida el token de sesión
→ Elimina la cookie
→ Redirige a /login
```

---

## Modelo de datos

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String
  avatarUrl   String?
  role        Role      @default(MEMBER)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  lastSeenAt  DateTime?

  invitations Invitation[] @relation("InvitedBy")
  sessions    Session[]
  messages    Message[]
  memberships ChannelMember[]
}

enum Role {
  ADMIN
  MEMBER
}

model Invitation {
  id          String    @id @default(cuid())
  email       String
  token       String    @unique
  invitedById String
  invitedBy   User      @relation("InvitedBy", fields: [invitedById], references: [id])
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model MagicLink {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## API Endpoints

### POST /api/v1/auth/magic-link
Solicitar un magic link para login.

**Request:**
```json
{ "email": "usuario@caribepeninsular.mx" }
```

**Response 200** (siempre, para no revelar si el email existe):
```json
{ "data": { "message": "Si el email existe, recibirás un enlace en breve." }, "error": null }
```

**Notas:**
- Si el email no existe o el usuario está inactivo, responder igual (200) pero no enviar email. Previene enumeración de usuarios.
- Rate limit: máximo 3 solicitudes por email por hora.

---

### GET /api/v1/auth/verify?token=xxx
Verificar magic link y crear sesión.

**Response 302** (redirect a /app):
- Cookie `session` seteada, httpOnly, SameSite=Lax, Secure en producción.

**Response 400** (token inválido, expirado, o ya usado):
- Redirect a `/login?error=link-invalido`

---

### POST /api/v1/admin/invitations
Crear invitación (solo admin).

**Request:**
```json
{ "email": "nuevo@caribepeninsular.mx" }
```

**Response 201:**
```json
{
  "data": {
    "id": "clxxx",
    "email": "nuevo@caribepeninsular.mx",
    "expiresAt": "2025-xx-xx"
  },
  "error": null
}
```

**Response 403** si el solicitante no es admin.
**Response 409** si el email ya tiene cuenta activa.

---

### GET /api/v1/auth/accept-invite?token=xxx
Aceptar invitación y activar cuenta.

**Response:** Si el token es válido, muestra formulario para ingresar nombre. Si el token es inválido/expirado, redirige a `/login?error=invitacion-invalida`.

---

### POST /api/v1/auth/accept-invite
Completar activación de cuenta con nombre.

**Request:**
```json
{ "token": "xxx", "name": "María López" }
```

**Response 302** a `/app` con sesión creada.

---

### POST /api/v1/auth/logout
Cerrar sesión.

**Response 200**, cookie eliminada.

---

## Seguridad

| Aspecto | Implementación |
|---------|---------------|
| Token de sesión | JWT firmado con `JWT_SECRET`, almacenado en cookie `httpOnly` |
| Magic link token | JWT firmado, TTL 15 min, campo `used: boolean` en DB |
| Invitación token | Random string (crypto.randomBytes), no JWT |
| Rate limiting | express-rate-limit: 3 magic links por email por hora |
| CSRF | SameSite=Lax en cookies previene la mayoría de ataques CSRF |
| Enumeración | Siempre responder 200 en `/magic-link` aunque el email no exista |

---

## Emails (plantillas)

### Magic link
```
Asunto: Tu enlace de acceso a Chat Peninsular

Hola,

Alguien (esperemos que tú) solicitó acceso a Chat Peninsular.

[Entrar ahora →] (botón con link)

Este enlace expira en 15 minutos y solo puede usarse una vez.
Si no solicitaste esto, ignora este correo.

— Chat Peninsular
```

### Invitación
```
Asunto: Te invitaron a Chat Peninsular

Hola,

[Nombre del admin] te invitó a unirte a Chat Peninsular,
el espacio de comunicación interna de Caribe Peninsular.

[Activar mi cuenta →] (botón con link)

Este enlace expira en 48 horas.

— Chat Peninsular
```
