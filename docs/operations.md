# Operación, entorno y preparación inicial

Este documento es la referencia operativa para variables de entorno, aprovisionamiento y despliegue. Distingue entre lo que el código lee hoy y variables que son solo marcadores reservados en `.env.example`.

## 1. Restricciones de servicio y costo

- El sistema está planteado para uso familiar gratuito. No integrar IA, servicios de pago, planes de prueba con cobro posterior ni overages automáticos.
- Vercel Hobby solo es candidato: el uso debe cumplir sus condiciones vigentes. Cotizar para ventas de un negocio puede ser uso comercial aunque la aplicación sea gratis para la familia. Verificarlo antes de publicar.
- Neon es la base PostgreSQL configurada en el entorno local actual. No asumir disponibilidad, cuota o retención gratuita ilimitada.
- Vercel Blob, Sentry y hosting administrado no están integrados solo por aparecer en este documento o en `.env.example`.
- Si se alcanza un límite, detener la operación que necesita el recurso, conservar los datos, comunicar el bloqueo y revisar alternativas. No activar plan o gasto automáticamente.

## 2. Configuración de entorno

`.env.example` es una plantilla sin credenciales. Copiarla a `.env` y completar localmente. `.env` y `.env.*` están excluidos de Git (excepto `.env.example`); no imprimirlos, adjuntarlos ni pegar sus valores en documentación.

### 2.1 Variables que el código consume

| Variable | Obligatoria | Consumidor y función |
| --- | --- | --- |
| `DATABASE_URL` | Sí para runtime, seed y CLI cuando no hay `DIRECT_URL` | URL PostgreSQL que usa Prisma en runtime. El host pooler del proveedor suele ser apropiado para conexiones de aplicación; comprobar formato con el proveedor. Validada como URL PostgreSQL por `src/lib/env.ts`. |
| `DIRECT_URL` | No | Prisma CLI y seed/recovery la prefieren para operaciones directas; si está vacía/no definida se usa `DATABASE_URL`. En Neon suele apuntar al endpoint directo, sin el segmento pooler. Debe pertenecer al mismo proyecto/branch/base que `DATABASE_URL`. |
| `BETTER_AUTH_SECRET` | Sí para autenticación y seed | Secreto de Better Auth; mínimo 32 caracteres. Mantener privado y estable para que las sesiones existentes puedan verificarse. |
| `BETTER_AUTH_URL` | No en runtime; default `http://localhost:3000` | URL base usada por Better Auth. En seed, se toma esta variable o el mismo default. En un host publicado debe coincidir con el origen canónico permitido. |
| `APP_ENV` | No; default `development` | Valida `development`, `test`, `preview` o `production`. Los CLIs seed y reset lo usan en sus guardas; no selecciona por sí solo una infraestructura. |
| `APP_TIMEZONE` | No; default `America/Lima` | Se valida como texto y representa la zona prevista para reglas de empresa. **Actualmente no modifica los cálculos/serialización de fechas implementados**; la configuración de empresa tiene su propio campo timezone. |
| `APP_LOG_LEVEL` | No; default `info` | Se valida contra `debug`, `info`, `warn`, `error`. **El logger actual no filtra por este nivel** y solo emite info/warn/error; cambiar la variable hoy no cambia el volumen de logs. |
| `SEED_MODE` | Sí al ejecutar `pnpm db:seed` | `bootstrap` o `demo`. Solo aplica al seed CLI, no al runtime web. |
| `SEED_ADMIN_NAME` | Sí al seed bootstrap | Nombre del administrador que se crea si no existe. No cambia una cuenta existente. |
| `SEED_ADMIN_EMAIL` | Sí al seed bootstrap | Identificador de inicio de sesión; se normaliza a minúsculas. No es un canal de correo de la aplicación. |
| `SEED_ADMIN_PASSWORD` | Sí al seed bootstrap | Contraseña inicial, mínimo 12 y máximo 128 caracteres. Se transforma en hash de Better Auth; no se imprime. Preferir introducirla solo en entorno privado temporal y retirarla al terminar. |
| `SEED_ALLOW_PRODUCTION` | No; default `false` | Opt-in exacto `true` requerido solo para bootstrap explícito con `APP_ENV=production`. La guarda no reemplaza verificar visualmente el destino de BD. |
| `CHROMIUM_EXECUTABLE_PATH` | No | Ruta al ejecutable local de Chromium para el renderer de comparación. No lo usa la descarga de cotización actual, que selecciona react-pdf directamente. |

### 2.2 Variables reservadas, actualmente sin consumidor

La presencia de estas variables en `.env.example` no instala ni activa el servicio. No es necesario completarlas para ejecutar o compilar la aplicación actual.

| Variable(s) | Función prevista | Estado actual |
| --- | --- | --- |
| `PDF_ENGINE` | Selector de motor PDF | No se lee. La ruta de descarga importa `reactPdfRenderer` directamente. |
| `BLOB_READ_WRITE_TOKEN` | Autenticación servidor para Vercel Blob privado | No se lee; no hay integración Blob ni almacenamiento durable de archivos. |
| `SENTRY_ENABLED`, `NEXT_PUBLIC_SENTRY_ENABLED`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_APP_ENV` | Activación/compilación/configuración de Sentry y etiqueta de entorno | No se leen; no está instalado/configurado `@sentry/nextjs`. No introducir tokens esperando que tengan efecto. |

Las variables con prefijo `NEXT_PUBLIC_` se pueden incorporar al JavaScript visible en navegador durante el build. Nunca poner secretos, tokens, URL de base de datos o claves privadas en esas variables.

### 2.3 Validación

`src/lib/env.ts` valida de forma perezosa variables runtime con Zod para servidor. Las herramientas CLI `prisma/seed.ts` y `scripts/admin-reset-password.ts` tienen sus propias validaciones. La configuración Prisma CLI carga `.env` y elige `DIRECT_URL || DATABASE_URL`.

La compilación local ya se probó sin que el build ejecutara seed ni migraciones. Una compilación exitosa no prueba que la aplicación pueda iniciar sesión o conectarse: para usarla se necesitan variables válidas, base disponible/migrada y cuenta de acceso.

## 3. Inicio local

Requisitos fijados:

- Node.js `24`; versión declarada en `.nvmrc`: `24.21.0`. El trabajo de verificación registrado ejecutó Node `24.15.0`, dentro del rango admitido por `package.json`; repetir validación con la versión fijada antes de cerrar esa diferencia.
- pnpm `12.10.1`, fijado por `packageManager` en `package.json`.
- PostgreSQL accesible, esquema migrado y cuenta habilitada.

Comandos de PowerShell, desde la raíz:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
# Edita .env localmente; nunca muestres su contenido en una consola compartida.
pnpm dev
```

Abrir `http://localhost:3000/login`. Usa el administrador aprovisionado y, en su primer acceso, completa el cambio obligatorio de contraseña. El proyecto no envía correo para recuperación.

## 4. PostgreSQL y Prisma

La app utiliza PostgreSQL mediante Prisma 7 y `@prisma/adapter-pg`. Runtime consume `DATABASE_URL`; la configuración Prisma CLI, seed y recovery prefieren `DIRECT_URL`.

Operaciones de esquema:

```powershell
pnpm exec prisma validate
pnpm exec prisma migrate status
pnpm exec prisma migrate deploy
```

- `migrate status` inspecciona el destino configurado; verificar que sea el proyecto/branch esperado.
- `migrate deploy` aplica SQL pendiente. Es una operación de escritura; revisar el destino y la migración antes de ejecutarla.
- `pnpm db:migrate` ejecuta `prisma migrate dev` y es solo para una base de desarrollo aislada.
- `pnpm db:generate` regenera los tipos/cliente desde el schema.
- No ejecutar una migración o seed desde `next build`, preview o arranque automático.
- El estado Neon documentado en [verification.md](./verification.md) es `production` con las dos migraciones actuales. No usarlo para seeds demo, pruebas destructivas o Preview.

## 5. Seed y cuentas

El seed está configurado en `prisma.config.ts` y se invoca manualmente con `pnpm db:seed`. Requiere variables `SEED_*`, conexión PostgreSQL y `BETTER_AUTH_SECRET`.

| Modo | Efecto actual |
| --- | --- |
| `bootstrap` | Upsert de configuración base/unidades y creación segura de un primer administrador si no existe. No rellena clientes/cotizaciones comerciales. |
| `demo` | Añade dos clientes ficticios estables. Solo admite `APP_ENV=development` o `test`, un nombre de base que indique `demo`, `test` o `development`, y rechaza host con marca de producción. No crea fixtures cotización PDF en BD. |

Guardas críticas:

- En `production`, solo acepta `SEED_MODE=bootstrap` y `SEED_ALLOW_PRODUCTION=true`.
- El administrador existente no recibe una contraseña nueva. Un usuario de otro rol no se eleva silenciosamente.
- Seed es una operación explícita; no ejecutarla por probar ni contra un destino no confirmado.
- Para el detalle de criterios y de la transacción de aprovisionamiento, revisar el código en `prisma/seed.ts` y `src/lib/seed/seed-policy.ts`.

La recuperación del único administrador se hace localmente:

```powershell
pnpm admin:reset-password
```

Es interactivo: confirma destino, correo y nueva contraseña dos veces con entrada oculta. Revoca sesiones existentes, marca el cambio obligatorio y escribe auditoría con requestId. En `APP_ENV=production` exige escribir `RESET PRODUCTION`. Esta confirmación no sustituye la verificación manual del host y base antes de continuar.

## 6. Autenticación y políticas

- Better Auth usa credenciales, registro público deshabilitado y sesiones PostgreSQL.
- `role=admin` puede guardar configuración de empresa; `cotizador` es el rol de negocio predeterminado.
- Mutaciones de negocio exigen sesión activa; el cambio obligatorio de contraseña bloquea el workspace y descargas.
- Los mensajes de recuperación no prometen envío de email. El familiar contacta al administrador.
- No hay gestión de usuarios familiares en la UI actual.

## 7. Logs y auditoría

`src/lib/logging/logger.ts` escribe registros JSON en los streams locales del proceso (`console.info`, `console.warn`, `console.error`). Las acciones agregan nombres de evento, `requestId`, identificador de usuario cuando se conoce y tipo de error. No configurar logs para volcar payloads comerciales, credenciales o secretos.

`AuditEvent` en PostgreSQL es distinto de los logs efímeros: conserva algunas acciones auditables del negocio con actor, acción, entidad y requestId. No es un almacén de logs completo.

No hay proveedor externo de monitoreo implementado. Las variables Sentry son reservadas y no producen telemetría.

## 8. PDF, archivos y privacidad

La descarga actual es `GET /api/quotes/drafts/[id]/pdf`, requiere sesión activa y devuelve el PDF del borrador guardado. Se genera bajo demanda en runtime Node.js con `@react-pdf/renderer` y se responde como `private, no-store`. No se guarda el archivo generado y descargar no cambia estado.

Chromium/Puppeteer se usan en `pnpm pdf:compare` para fixtures de evaluación local; no se necesitan para descargar el borrador. No hay Blob, enlaces públicos ni PDF final de revisión emitida.

## 9. Construcción y publicación

Comandos normales:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

`pnpm build` compila Next.js; no aplica migraciones ni seed. CI/despliegues deben usar pnpm fijado e instalación inmutable `pnpm install --frozen-lockfile`.

**No existe evidencia de despliegue Vercel/Preview o producción.** Antes de publicar:

1. Elegir branch/base de datos separada de `production` para preview/dev.
2. Verificar oficialmente condiciones vigentes y compatibilidad del hosting con el uso familiar/comercial previsto.
3. Verificar límites gratuitos, backups/restore y tratamiento de secretos; no aceptar upgrades automáticos.
4. Configurar solo variables consumidas, con valores separados por entorno.
5. Aplicar migraciones de forma controlada; no ejecutar seed automáticamente.
6. Validar autenticación, permisos, descarga privada, comportamiento de fallos y flujos E2E.
7. No publicar hasta cumplir los criterios de [PLAN.md](../PLAN.md).

## 10. Copias de seguridad y respuesta a límites

No se debe asumir que Neon/hosting gratuito incluye copias apropiadas para recuperación ni almacenamiento permanente de PDF. Aún no existe procedimiento verificado de backup/restauración del proyecto.

Pendiente antes de operación crítica:

- Definir y ensayar exportación/restore en base aislada.
- Definir conservación segura de PDF final cuando se implemente emisión.
- Establecer quién ejecuta la copia y quién confirma la restauración.
- Registrar el límite/cuota detectado y comunicarlo antes de cualquier operación que pueda fallar.

No borrar históricos ni habilitar facturación para sortear límites sin autorización explícita.

## 11. Fuentes oficiales

Consultar documentación/restricciones en la fecha de implementación o publicación:

- Better Auth: https://better-auth.com/docs/installation y https://better-auth.com/docs/authentication/email-password
- Prisma seed: https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
- Prisma CLI/configuración: https://www.prisma.io/docs/orm/reference/prisma-config-reference
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Vercel Blob: https://vercel.com/docs/vercel-blob/usage-and-pricing
- Neon: https://neon.com/pricing
- Sentry Next.js (solo si se propone integrarlo): https://docs.sentry.io/platforms/javascript/guides/nextjs/
