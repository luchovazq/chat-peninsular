# Spec 04 — Presencia

## Resumen

Dos señales de presencia en tiempo real: estado en línea/ausente del usuario, y "está escribiendo…" en canales y DMs.

---

## Estado en línea / ausente

### Definiciones

| Estado | Significado | Indicador |
|--------|-------------|-----------|
| `online` | Usuario tiene la tab activa y ha tenido actividad en los últimos 5 minutos | Punto verde ● |
| `away` | Usuario no tiene actividad hace más de 5 minutos, o cerró la tab | Punto gris ○ |

No hay estado manual (no existe "no molestar" o "en reunión" en v1).

### Cómo se detecta

1. Cuando el cliente abre una conexión Socket.IO, el servidor marca al usuario como `online`.
2. El cliente envía un heartbeat (`presence:ping`) cada **60 segundos** mientras la tab está activa.
3. Si el servidor no recibe heartbeat en 5 minutos, marca al usuario como `away` y emite `user:presence` a todos.
4. Cuando el cliente detecta que la tab pierde el foco (`document.visibilitychange`), deja de enviar heartbeats. El timeout de 5 minutos se aplica.
5. Cuando el socket se desconecta (cierre de tab, red caída), el servidor marca como `away` inmediatamente.

### Modelo de datos

No se guarda en la base de datos. La presencia es efímera y vive solo en memoria del servidor (un `Map<userId, lastSeenAt>`). Si el servidor se reinicia, todos aparecen como `away` hasta que reconecten — comportamiento aceptable.

---

## Está escribiendo (typing indicator)

### Comportamiento

- Cuando el usuario escribe en el input de un canal o DM, el cliente emite `typing:start` con el `channelId` o `dmId`.
- Cuando el usuario deja de escribir por más de 3 segundos, el cliente emite `typing:stop`.
- El servidor retransmite estos eventos a los demás miembros del canal/DM.
- En la UI, debajo del área de mensajes aparece: "María está escribiendo…" o "María y Carlos están escribiendo…"
- Si más de 3 personas escriben a la vez: "Varias personas están escribiendo…"

### Implementación en el cliente

```ts
let typingTimeout: ReturnType<typeof setTimeout>;

inputElement.addEventListener('input', () => {
  socket.emit('typing:start', { channelId });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', { channelId });
  }, 3000);
});
```

### Eventos Socket.IO

```
Cliente → Servidor:
  typing:start    { channelId? , dmId? }
  typing:stop     { channelId?, dmId? }
  presence:ping   (sin payload, solo para mantener estado online)

Servidor → Cliente:
  typing:update   { channelId?, dmId?, typingUsers: Array<{ id, name }> }
  user:presence   { userId, status: 'online' | 'away' }
```

---

## Dónde se muestra la presencia

### En el sidebar (DMs)
```
MENSAJES DIRECTOS
  ● María López        ← online
  ○ Carlos Ruiz        ← away
```

### En el header del DM abierto
```
Carlos Ruiz
○ Ausente
```

### En la lista de miembros del canal (panel derecho, si existe)
```
EN LÍNEA (3)
  ● María López
  ● Luis Vázquez
  ● Pedro García

AUSENTES (9)
  ○ Ana Martínez
  ...
```

### En el área de typing
```
[área de mensajes]
...
● María está escribiendo...
[input de texto]
```

---

## Privacidad y scope

- La presencia de un usuario en un canal privado es visible solo para los miembros de ese canal.
- La presencia general (quién está online) es visible para todos los usuarios del workspace — no hay granularidad mayor en v1.
