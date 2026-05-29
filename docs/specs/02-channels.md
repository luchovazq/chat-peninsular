# Spec 02 — Canales

## Resumen

Los canales son el espacio principal de comunicación grupal. Pueden ser públicos (visibles para todos) o privados (solo para miembros invitados).

---

## Tipos de canal

| Tipo | Visibilidad | Acceso |
|------|-------------|--------|
| Público | Todos lo ven en el sidebar | Cualquiera puede unirse |
| Privado | Solo miembros lo ven | Solo por invitación |

---

## Reglas de negocio

1. Cualquier usuario (admin o miembro) puede crear canales.
2. El creador es automáticamente miembro del canal que crea.
3. El creador tiene rol de `moderador` en ese canal (puede invitar, archivar).
4. Cualquier miembro de un canal privado puede invitar a otros usuarios.
5. Un canal archivado es de solo lectura — nadie puede enviar mensajes.
6. Solo el creador o el admin puede archivar un canal.
7. Un canal archivado puede desarchivarse (solo admin).
8. No se puede borrar un canal — solo archivar (preserva el historial).
9. Todos los workspaces empiezan con un canal `#general` creado automáticamente en la instalación.

---

## Modelo de datos

```prisma
model Channel {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  isPrivate   Boolean   @default(false)
  isArchived  Boolean   @default(false)
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  members     ChannelMember[]
  messages    Message[]
}

model ChannelMember {
  id        String      @id @default(cuid())
  channelId String
  channel   Channel     @relation(fields: [channelId], references: [id])
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  role      ChannelRole @default(MEMBER)
  joinedAt  DateTime    @default(now())

  @@unique([channelId, userId])
}

enum ChannelRole {
  MODERATOR
  MEMBER
}
```

---

## API Endpoints

### GET /api/v1/channels
Listar canales visibles para el usuario autenticado.

**Response 200:**
```json
{
  "data": {
    "channels": [
      {
        "id": "clxxx",
        "name": "general",
        "description": "Canal principal del equipo",
        "isPrivate": false,
        "isArchived": false,
        "memberCount": 12,
        "isMember": true,
        "lastMessage": {
          "text": "Hola equipo",
          "authorName": "María",
          "createdAt": "2025-xx-xx"
        }
      }
    ]
  },
  "error": null
}
```

**Lógica:** Devuelve todos los canales públicos + los canales privados donde el usuario es miembro.

---

### POST /api/v1/channels
Crear canal.

**Request:**
```json
{
  "name": "redaccion",
  "description": "Coordinación de la redacción",
  "isPrivate": false
}
```

**Validaciones:**
- `name`: 2–80 caracteres, solo letras minúsculas, números y guiones. No espacios.
- `name` único en el workspace.

**Response 201:**
```json
{
  "data": { "id": "clxxx", "name": "redaccion", ... },
  "error": null
}
```

---

### GET /api/v1/channels/:id
Obtener detalle de un canal.

**Response 403** si el canal es privado y el usuario no es miembro.

---

### PATCH /api/v1/channels/:id
Editar nombre o descripción del canal.

**Permisos:** moderador del canal o admin del workspace.

**Request:**
```json
{ "description": "Nueva descripción" }
```

---

### POST /api/v1/channels/:id/archive
Archivar canal.

**Permisos:** moderador del canal o admin.
**Response 200.**

---

### POST /api/v1/channels/:id/unarchive
Desarchivar canal.

**Permisos:** solo admin.
**Response 200.**

---

### POST /api/v1/channels/:id/join
Unirse a un canal público.

**Response 403** si el canal es privado (hay que ser invitado).
**Response 200** si ya era miembro (idempotente).

---

### POST /api/v1/channels/:id/leave
Salir de un canal.

**Nota:** El creador/moderador no puede salir si es el único moderador — primero debe ceder la moderación o el admin puede eliminarlo.

---

### POST /api/v1/channels/:id/members
Invitar usuario a canal (privado o público).

**Permisos:** cualquier miembro del canal.

**Request:**
```json
{ "userId": "clxxx" }
```

---

### DELETE /api/v1/channels/:id/members/:userId
Eliminar usuario de un canal privado.

**Permisos:** moderador del canal o admin.

---

## Eventos Socket.IO

```
Servidor → Cliente:
  channel:created     Nuevo canal público creado (broadcast a todos)
  channel:updated     Canal editado (a miembros del canal)
  channel:archived    Canal archivado (a miembros del canal)
  channel:member_joined   Usuario se unió (a miembros del canal)
  channel:member_left     Usuario salió (a miembros del canal)
```

---

## UX — Sidebar

El sidebar izquierdo organiza los canales en dos secciones:

```
CANALES (públicos donde soy miembro)
  # general           ● (tiene mensajes no leídos)
  # redaccion
  + Explorar canales

MENSAJES DIRECTOS
  ● María López       (en línea)
  ○ Carlos Ruiz       (ausente)
  + Nuevo mensaje
```

- El indicador ● en un canal indica mensajes no leídos.
- "Explorar canales" muestra todos los canales públicos del workspace.
- Los canales archivados no aparecen en el sidebar (solo en el panel de admin).
