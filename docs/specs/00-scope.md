# Spec 00 — Scope de v1

## Qué es v1

La primera versión usable de Chat Peninsular. El criterio de "terminado" es: **el equipo de Caribe Peninsular lo usa como su herramienta principal de comunicación interna**.

v1 reemplaza WhatsApp grupales, emails internos desordenados, y cualquier chat externo. No reemplaza videollamadas todavía.

---

## Qué incluye v1

### Core obligatorio (sin esto no hay v1)

| Feature | Descripción |
|---------|-------------|
| Autenticación | Magic link por email. Acceso solo por invitación. |
| Canales | Crear, listar, unirse a canales públicos y privados. |
| Mensajes en canales | Enviar, recibir, editar (2h), borrar (2h) mensajes de texto. |
| Mensajes directos (DMs) | Conversaciones privadas uno a uno. |
| Historial | Conversaciones guardadas en la nube, accesibles desde cualquier dispositivo. |
| Presencia | Indicador en línea/ausente. "Está escribiendo…" en tiempo real. |
| Imágenes | Adjuntar imágenes en mensajes (jpeg, png, gif, webp, max 5MB). |
| Búsqueda | Búsqueda full-text básica en mensajes de canales donde el usuario es miembro. |
| Roles | Admin (un usuario) y Miembro (todos los demás). |
| Notificaciones | Notificaciones del navegador para menciones y DMs nuevos. |

### Nice-to-have en v1 (si el tiempo lo permite)

- Menciones con `@nombre` (highlight visual, no notificación push).
- Marcar mensajes como no leídos.
- Anclar mensajes en un canal (solo admin).

---

## Qué NO incluye v1 (candidatos para v2+)

Esta lista es firme. No implementar estas features en v1 aunque parezca fácil añadirlas.

| Feature | Versión estimada |
|---------|-----------------|
| Threads / respuestas anidadas | v2 |
| Reacciones con emoji | v2 |
| Llamadas de voz grupales (LiveKit) | v1.5 |
| Llamadas de video | v2 |
| Adjuntar archivos genéricos (PDF, DOCX, etc.) | v2 |
| Bots o webhooks entrantes | v2 |
| Integración con WhatsApp | v3 |
| App móvil nativa | v3 |
| Notificaciones push en móvil | v2 |
| Inicio de sesión con Google / OAuth | v2 |
| Múltiples workspaces | v3 |
| Mensajes programados | v2 |
| Estado personalizado del usuario | v2 |

---

## Definición de "terminado" por feature

### Autenticación
- [ ] Un admin puede crear una invitación asociada a un email.
- [ ] El usuario recibe el magic link y puede entrar con él.
- [ ] El link expira a los 15 minutos.
- [ ] El link es de un solo uso (no funciona la segunda vez).
- [ ] La sesión dura 30 días (cookie httpOnly).
- [ ] El usuario puede cerrar sesión.

### Canales
- [ ] Cualquier usuario puede crear un canal público o privado.
- [ ] Los canales públicos son visibles para todos.
- [ ] Los canales privados solo son visibles para sus miembros.
- [ ] El creador del canal es automáticamente miembro y moderador del canal.
- [ ] Cualquier miembro puede invitar a otro a un canal privado.
- [ ] El admin puede archivar cualquier canal.
- [ ] El creador puede archivar su canal.
- [ ] Un canal archivado es solo lectura.

### Mensajes en canales
- [ ] El usuario puede enviar texto en cualquier canal donde es miembro.
- [ ] Los mensajes aparecen en tiempo real para todos los miembros activos.
- [ ] El usuario puede editar su propio mensaje dentro de las 2 horas posteriores al envío.
- [ ] El usuario puede borrar su propio mensaje dentro de las 2 horas posteriores al envío.
- [ ] Un mensaje borrado muestra "Este mensaje fue eliminado" en lugar del contenido.
- [ ] La validación de la ventana de 2 horas ocurre en el servidor.
- [ ] El usuario puede adjuntar una imagen por mensaje.

### Mensajes directos (DMs)
- [ ] El usuario puede abrir un DM con cualquier otro miembro del workspace.
- [ ] Los DMs son privados — solo los dos participantes los ven.
- [ ] Los DMs no aparecen en búsqueda.
- [ ] Aplican las mismas reglas de editar/borrar (ventana 2h).

### Presencia
- [ ] Cuando un usuario tiene la app abierta y activa, aparece como "en línea".
- [ ] Cuando cierra la tab o lleva más de 5 minutos inactivo, aparece como "ausente".
- [ ] "Está escribiendo…" aparece mientras hay actividad de teclado y desaparece a los 3 segundos de inactividad.

### Búsqueda
- [ ] El campo de búsqueda acepta texto libre.
- [ ] Los resultados muestran mensajes de canales donde el usuario es miembro.
- [ ] Los resultados de canales privados solo se muestran a miembros de ese canal.
- [ ] Los DMs NO aparecen en resultados de búsqueda.
- [ ] Cada resultado muestra: canal, autor, fecha, fragmento del mensaje.

### Roles
- [ ] Existe exactamente un admin (el primero en la instalación).
- [ ] El admin puede invitar usuarios.
- [ ] El admin puede desactivar usuarios (impedir acceso sin borrar historial).
- [ ] El admin puede archivar cualquier canal.
- [ ] Los miembros no pueden desactivar usuarios ni archivar canales de otros.

---

## Criterio de lanzamiento

v1 está lista cuando:
1. Los 12 miembros del equipo pueden entrar y enviar mensajes.
2. El historial se mantiene entre sesiones.
3. No hay pérdida de mensajes bajo uso normal.
4. La app corre estable en el VPS por al menos 72 horas sin intervención manual.
