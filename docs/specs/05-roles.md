# Spec 05 — Roles y permisos

## Resumen

Dos roles en el workspace: Admin y Miembro. Un rol adicional a nivel de canal: Moderador.

---

## Roles del workspace

### Admin
- Existe exactamente **un** admin por workspace (el primer usuario creado en la instalación).
- El admin no puede haber sido invitado — se crea en el setup inicial.
- En v1 no hay forma de transferir el rol de admin (se hace directamente en la base de datos si es necesario).

### Miembro
- Todos los usuarios invitados son Miembros por defecto.
- Los Miembros no pueden cambiar su rol.

---

## Rol de canal: Moderador

- El creador de un canal es automáticamente su Moderador.
- Puede haber múltiples Moderadores en un canal.
- Un Moderador puede ceder su rol a otro miembro.
- El Admin del workspace actúa como Moderador en todos los canales, aunque no sea miembro.

---

## Matriz de permisos

### Workspace

| Acción | Admin | Miembro |
|--------|-------|---------|
| Invitar usuarios | ✅ | ❌ |
| Desactivar usuarios | ✅ | ❌ |
| Ver panel de administración | ✅ | ❌ |
| Crear canales | ✅ | ✅ |
| Ver canales públicos | ✅ | ✅ |
| Desarchivar cualquier canal | ✅ | ❌ |
| Borrar mensajes de otros | ✅ | ❌ |

### Canal

| Acción | Admin | Moderador del canal | Miembro del canal |
|--------|-------|---------------------|-------------------|
| Ver mensajes | ✅ | ✅ | ✅ |
| Enviar mensajes | ✅ | ✅ | ✅ |
| Editar mensajes propios (2h) | ✅ | ✅ | ✅ |
| Borrar mensajes propios (2h) | ✅ | ✅ | ✅ |
| Borrar mensajes de otros | ✅ | ❌ | ❌ |
| Invitar al canal | ✅ | ✅ | ✅* |
| Archivar el canal | ✅ | ✅ | ❌ |
| Editar nombre/descripción | ✅ | ✅ | ❌ |
| Eliminar miembro del canal | ✅ | ✅ | ❌ |

*Para canales privados. En canales públicos cualquiera puede unirse sin invitación.

---

## Panel de administración

El Admin tiene acceso a `/admin` con las siguientes funciones:

### Usuarios
- Lista de todos los usuarios activos e inactivos.
- Invitar nuevo usuario (input de email → envía email de invitación).
- Desactivar usuario (el usuario no puede entrar pero su historial se preserva).
- Reactivar usuario desactivado.
- Ver fecha de última actividad de cada usuario.

### Canales
- Lista de todos los canales (incluyendo privados y archivados).
- Archivar / desarchivar cualquier canal.
- Ver conteo de miembros y último mensaje de cada canal.

### Sistema
- Ver estado del servidor (uptime, versión).
- En v1 no hay métricas avanzadas.

---

## Modelo de datos

```prisma
// El rol del workspace está en el modelo User (spec 01):
// role  Role  @default(MEMBER)
// enum Role { ADMIN MEMBER }

// El rol del canal está en ChannelMember (spec 02):
// role  ChannelRole  @default(MEMBER)
// enum ChannelRole { MODERATOR MEMBER }
```

No se necesitan tablas adicionales — los roles están en los modelos existentes.

---

## Setup inicial (instalación)

En el primer arranque del servidor, si no existe ningún usuario en la base de datos, el servidor expone temporalmente la ruta `/setup` que permite crear el primer usuario Admin. Esta ruta se desactiva automáticamente una vez que existe al menos un usuario.

```
GET /setup   → si no hay usuarios, muestra formulario de setup
POST /setup  → crea el primer usuario Admin y el canal #general
             → cierra la ruta /setup para siempre
```

El formulario de setup pide:
- Email del admin
- Nombre del admin

(El admin entra después con magic link como cualquier usuario.)
