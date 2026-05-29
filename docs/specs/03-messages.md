# Spec 03 — Mensajes y DMs

## Resumen

Mensajes de texto (con imágenes opcionales) en canales y conversaciones directas. Editar y borrar dentro de una ventana de 2 horas.

---

## Reglas de negocio

1. Solo miembros de un canal pueden enviar mensajes en él.
2. Cualquier usuario puede abrir un DM con cualquier otro usuario activo.
3. Un mensaje puede tener texto, una imagen, o ambos — pero al menos uno de los dos.
4. El autor puede **editar** su mensaje si `Date.now() - createdAt < 2 horas`. Validar en servidor.
5. El autor puede **borrar** su mensaje si `Date.now() - createdAt < 2 horas`. Validar en servidor.
6. El borrado es **soft delete** (`deletedAt = now()`). El mensaje muestra "Este mensaje fue eliminado".
7. Un admin puede borrar cualquier mensaje (sin restricción de tiempo). Útil para moderación.
8. Los mensajes se cargan paginados (más antiguos primero, cargar más al hacer scroll hacia arriba).
9. Las imágenes se suben al servidor antes de enviar el mensaje (flujo en dos pasos: upload → enviar).

---

## Modelo de datos

```prisma
model Message {
  id          String    @id @default(cuid())
  content     String?
  imageUrl    String?
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])

  // Uno de los dos (channelId o dmId) debe estar presente, no ambos
  channelId   String?
  channel     Channel?  @relation(fields: [channelId], references: [id])
  dmId        String?
  dm          DirectMessage? @relation(fields: [dmId], references: [id])

  editedAt    DateTime?
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model DirectMessage {
  id          String    @id @default(cuid())
  user1Id     String
  user1       User      @relation("DmUser1", fields: [user1Id], references: [id])
  user2Id     String
  user2       User      @relation("DmUser2", fields: [user2Id], references: [id])
  createdAt   DateTime  @default(now())

  messages    Message[]

  @@unique([user1Id, user2Id])
}
```

---

## API Endpoints

### GET /api/v1/channels/:id/messages
Obtener mensajes de un canal, paginados.

**Query params:**
- `before` (cursor): ID del mensaje más antiguo ya cargado. Si se omite, devuelve los más recientes.
- `limit`: default 50, max 100.

**Response 200:**
```json
{
  "data": {
    "messages": [
      {
        "id": "clxxx",
        "content": "Hola equipo",
        "imageUrl": null,
        "author": {
          "id": "clyyy",
          "name": "María López",
          "avatarUrl": null
        },
        "editedAt": null,
        "deletedAt": null,
        "createdAt": "2025-01-15T10:30:00Z",
        "canEdit": true,
        "canDelete": true
      }
    ],
    "hasMore": true
  },
  "error": null
}
```

**Nota:** `canEdit` y `canDelete` los calcula el servidor según la ventana de 2 horas. El cliente no recalcula esto.

---

### POST /api/v1/channels/:id/messages
Enviar mensaje a un canal.

**Request:**
```json
{
  "content": "Texto del mensaje",
  "imageUrl": "/uploads/abc123.jpg"
}
```

Al menos uno de `content` o `imageUrl` es requerido.

**Response 201** con el mensaje creado.

---

### PATCH /api/v1/messages/:id
Editar mensaje.

**Validaciones en servidor:**
- El solicitante es el autor.
- `Date.now() - message.createdAt < 7200000` (2 horas en ms).
- El nuevo `content` no puede ser vacío.

**Request:**
```json
{ "content": "Texto corregido" }
```

**Response 200** con mensaje actualizado.
**Response 403** si no es el autor.
**Response 422** si venció la ventana de 2 horas, con mensaje en español: "El tiempo para editar este mensaje ha expirado."

---

### DELETE /api/v1/messages/:id
Borrar mensaje (soft delete).

**Validaciones en servidor:**
- El solicitante es el autor Y `Date.now() - createdAt < 2 horas`, O
- El solicitante es admin (sin restricción de tiempo).

**Response 200.**
**Response 422** si venció la ventana: "El tiempo para eliminar este mensaje ha expirado."

---

### GET /api/v1/dms/:userId
Obtener o crear conversación directa con un usuario.

Si no existe un DM entre los dos usuarios, se crea automáticamente.

**Response 200:**
```json
{
  "data": {
    "dm": {
      "id": "clxxx",
      "otherUser": {
        "id": "clyyy",
        "name": "Carlos Ruiz",
        "isOnline": true
      }
    },
    "messages": [ ... ]
  },
  "error": null
}
```

---

### POST /api/v1/dms/:dmId/messages
Enviar mensaje en un DM.

Misma estructura que los mensajes de canal. Solo los dos participantes pueden enviar.

---

## Upload de imágenes

### POST /api/v1/upload/image
Subir imagen antes de enviar el mensaje.

**Request:** `multipart/form-data` con campo `image`.

**Validaciones:**
- Tipo MIME: `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
- Tamaño máximo: 5MB.

**Response 201:**
```json
{
  "data": { "url": "/uploads/2025/01/abc123.webp" },
  "error": null
}
```

**Proceso:** El servidor recibe la imagen, la guarda en `/var/chat-peninsular/uploads/YYYY/MM/` con nombre único (UUID), y devuelve la URL relativa. En el frontend, la URL se incluye al enviar el mensaje.

---

## Eventos Socket.IO

```
Cliente → Servidor:
  message:send        { channelId|dmId, content?, imageUrl? }
  message:edit        { messageId, content }
  message:delete      { messageId }

Servidor → Cliente (a los miembros del canal/dm):
  message:new         Mensaje nuevo (objeto completo)
  message:updated     Mensaje editado { messageId, content, editedAt }
  message:deleted     Mensaje borrado { messageId, deletedAt }
```

---

## Búsqueda

### GET /api/v1/search?q=texto
Búsqueda full-text en mensajes.

**Implementación:** `ILIKE '%texto%'` en Postgres para v1. Si el rendimiento fuera un problema (no lo será con 12 usuarios), se puede agregar `pg_trgm` index.

**Reglas de acceso:**
- Solo devuelve mensajes de canales donde el usuario es miembro.
- No devuelve mensajes de DMs.
- No devuelve contenido de mensajes con `deletedAt` distinto de null.

**Response 200:**
```json
{
  "data": {
    "results": [
      {
        "messageId": "clxxx",
        "content": "fragmento del ...texto... encontrado",
        "channelName": "redaccion",
        "channelId": "clyyy",
        "authorName": "María López",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 5
  },
  "error": null
}
```

---

## Paginación de mensajes (scroll hacia arriba)

La UI carga los últimos 50 mensajes al abrir un canal. Cuando el usuario hace scroll hacia arriba y llega al inicio, se hace una petición con `?before=<id_del_mensaje_mas_antiguo>` para cargar los 50 anteriores.

```
[mensajes más viejos]  ← cargar más al llegar aquí
[mensaje 51]
...
[mensaje 100]          ← pantalla comienza aquí al abrir
```
