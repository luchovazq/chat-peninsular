# Decisiones de Arquitectura (ADRs)

Registro de por qué se tomaron las decisiones principales. Útil cuando alguien (o yo mismo en 6 meses) pregunta "¿por qué hicieron X en vez de Y?".

---

## ADR-001: Monorepo con pnpm workspaces

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** Un solo repositorio con `apps/web`, `apps/server` y `packages/types`.

**Por qué:** Compartir tipos TypeScript entre frontend y backend sin publicar paquetes npm privados. Un solo `git clone`, un solo CI. Para un equipo de un mantenedor, la complejidad de múltiples repos no aporta nada.

**Alternativa descartada:** Repositorios separados para web y server. Descartado porque sincronizar cambios de tipos entre dos repos separados es una fuente constante de bugs difíciles de detectar.

---

## ADR-002: Next.js (App Router) para el frontend

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** Next.js 14+ con App Router.

**Por qué:** El mantenedor (Luis) quiere aprender el stack moderno de React. App Router con Server Components es la dirección actual del ecosistema. Tailwind para estilos porque es el estándar de facto en proyectos TypeScript nuevos.

**Alternativa descartada:** Vite + React SPA. Más simple, pero pierde SSR y la estructura de rutas de Next.js que ya conoce el mantenedor.

---

## ADR-003: Servidor Node.js separado de Next.js

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** `apps/server` es un proceso Node.js independiente, no un API Route de Next.js.

**Por qué:** Next.js no maneja WebSockets persistentes en su modelo de ejecución estándar. Socket.IO necesita un proceso servidor que mantenga conexiones abiertas. Intentar meter Socket.IO dentro de Next.js lleva a hacks frágiles.

**Riesgo aceptado:** Dos procesos que gestionar en el VPS (PM2 los maneja).

---

## ADR-004: Socket.IO sobre WebSocket nativo

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** Socket.IO para el tiempo real.

**Por qué:** Socket.IO agrega fallback a HTTP long-polling cuando WebSocket no está disponible (redes restrictivas, proxies corporativos). También maneja reconexión automática, rooms (canales), y broadcasting con una API limpia. Para un equipo de redacción, la resiliencia de conexión es más importante que el overhead mínimo que agrega la librería.

**Alternativa descartada:** WebSocket nativo con `ws`. Más ligero, pero requiere implementar manualmente rooms, reconexión, y fallbacks. El esfuerzo no justifica el ahorro.

---

## ADR-005: PostgreSQL sobre SQLite

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** PostgreSQL en Docker.

**Por qué:** Escrituras concurrentes. Con 12 usuarios activos simultáneamente mandando mensajes, SQLite puede tener problemas de lock en escrituras concurrentes. Postgres está diseñado para esto. El costo de complejidad es bajo porque Docker abstrae la instalación.

**Alternativa descartada:** SQLite + Turso (SQLite distribuido). Interesante, pero agrega una dependencia externa de red. Postgres local en Docker es más simple y predecible para producción en VPS.

---

## ADR-006: Prisma sobre Drizzle o queries crudas

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** Prisma ORM.

**Por qué:** Prisma genera tipos TypeScript automáticamente desde el schema. El autocompletado del editor previene la clase de errores "este campo no existe". Las migraciones son SQL versionado en git. La curva de aprendizaje es baja.

**Alternativa descartada:** Drizzle ORM. Más rápido en benchmarks y más cercano a SQL crudo, pero requiere más boilerplate para el mismo resultado. Prisma es la elección correcta cuando el objetivo es velocidad de desarrollo.

---

## ADR-007: Magic link sobre OAuth o contraseñas

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** Autenticación por magic link (email con JWT de un solo uso, TTL 15 minutos).

**Por qué:** El equipo es interno y pequeño. No todos tienen Google Workspace. Las contraseñas generan tickets de soporte ("olvidé mi contraseña"). Magic link elimina esa carga de mantenimiento. Para una app interna de 12 personas, el pequeño friccionamiento de "abre tu email" es aceptable.

**Riesgo aceptado:** Dependencia del email. Si el SMTP cae, nadie puede entrar. Mitigación: usar un proveedor SMTP confiable (Mailgun, Resend, o el servidor de correo de Caribe Peninsular) con monitoreo básico.

**Alternativa descartada:** OAuth con Google. Requiere que todos tengan Google. Agrega dependencia en Google como proveedor de identidad. Para uso interno no vale la complejidad.

---

## ADR-008: Soft delete para mensajes

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** Los mensajes "borrados" no se eliminan físicamente de la base de datos. Se marca `deletedAt = now()` y el cliente muestra "Este mensaje fue eliminado".

**Por qué:** Consistencia de la UI. Si un mensaje se borra físicamente, los demás usuarios verían un "hueco" en la conversación sin explicación. El soft delete mantiene el contexto de la conversación. También permite auditoría si alguna vez se necesita.

**Regla de negocio asociada:** Solo el autor puede borrar, y solo dentro de las primeras 2 horas desde `createdAt`. Esta ventana se valida en el servidor, no en el cliente.

---

## ADR-009: Imágenes en filesystem local (v1)

**Fecha:** 2025  
**Estado:** Temporal (revisar en v2)

**Decisión:** Las imágenes subidas se guardan en `/var/chat-peninsular/uploads/` en el VPS.

**Por qué:** Es la solución más simple que funciona. Para un equipo de 12 personas con uso interno, el volumen de imágenes no justifica la complejidad de un bucket S3 en v1.

**Deuda técnica aceptada:** Si se migra de VPS, hay que copiar los archivos manualmente. Si el equipo crece y el almacenamiento se convierte en problema, migrar a Cloudflare R2 (compatible con S3, generoso en tier gratuito).

---

## ADR-010: PM2 para gestión de procesos en producción

**Fecha:** 2025  
**Estado:** Aceptado

**Decisión:** PM2 para mantener corriendo los procesos de Next.js y Node.js en el VPS.

**Por qué:** PM2 reinicia los procesos automáticamente si se caen, guarda logs, y tiene un comando simple para deploy (`pm2 restart`). Es el estándar de facto para Node.js en VPS. No requiere aprender Kubernetes ni Docker Swarm para lo que es un proyecto de un mantenedor.

**Alternativa descartada:** Docker Compose para todo (incluyendo la app). Más aislamiento, pero más complejidad operacional para un solo mantenedor en un VPS compartido con otro proyecto.
