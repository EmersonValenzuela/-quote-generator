# Arquitectura y estructura

## 1. Enfoque

El sistema es un **monolito modular en Next.js App Router**. La aplicación web, autenticación, casos de uso y acceso a PostgreSQL comparten el mismo proyecto y despliegue previsto. No es una arquitectura de microservicios ni depende de un servicio PDF contratado.

La arquitectura aplica separación práctica por capas:

```text
Presentación (src/app, features/*/components)
        ↓
Entradas autenticadas (Server Actions / Route Handlers)
        ↓
Aplicación (features/*/server)
        ↓
Dominio puro (features/*/domain)
        ↓
Infraestructura (src/lib, Prisma, Better Auth, react-pdf)
```

El dominio no debe importar React, Next.js, Prisma ni SDK de proveedores. Los servicios de aplicación pueden usar Prisma directamente; no crear repositorios genéricos por tabla sin una necesidad comprobada.

## 2. Estado implementado frente a arquitectura objetivo

La siguiente es la estructura **real y activa** del repositorio:

```text
src/
  app/
    api/
      auth/[...all]/route.ts
      quotes/drafts/[id]/pdf/route.ts
    change-password/page.tsx
    login/page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/ui/
  features/
    customers/server/customer.actions.ts
    quotes/
      components/
        workspace-layout.tsx
        quote-workspace.tsx
        quotes-screen.tsx
        editor-screen.tsx
        quote-detail.tsx
        customers-screen.tsx
        settings-screen.tsx
        page-heading.tsx
        workspace-formatters.tsx
        workspace-types.ts
      documents/
      domain/
      server/
    users/
      components/
      server/
  lib/
    auth/
    db/prisma.ts
    env.ts
    logging/logger.ts
    pdf/
    seed/
prisma/
  schema.prisma
  migrations/
  seed.ts
scripts/admin-reset-password.ts
tests/
  unit/
  integration/
```

El workspace conserva la coordinación del estado compartido y delega el layout y cada pantalla a componentes separados; los modelos UI y utilidades de formato compartidas están en módulos propios. Los módulos `company/`, `storage/`, `monitoring/`, `e2e/` y `visual/` del diseño inicial aún no existen como integraciones/capas completas. El editor no usa React Hook Form. No introducir una refactorización de carpetas solo para hacer coincidir la estructura deseada.

### Rutas existentes

| Ruta | Propósito |
| --- | --- |
| `/login` | Inicio de sesión |
| `/change-password` | Cambio obligatorio de contraseña temporal |
| `/` | Workspace autenticado de cotizaciones, clientes y configuración |
| `/api/auth/[...all]` | Better Auth |
| `/api/quotes/drafts/[id]/pdf` | PDF de preview de un borrador persistido |

Rutas dedicadas `/cotizaciones`, `/clientes` y `/configuracion` estaban en el diseño inicial, pero la interfaz real se compone actualmente desde `/`.

## 3. Capas y responsabilidades

| Capa | Responsabilidad | Ubicación |
| --- | --- | --- |
| Presentación | Server Components por defecto; formularios/listas interactivas en Client Components | `src/app/`, `src/features/*/components/` |
| Entrada y autorización | Leer sesión, validar entradas, traducir resultado o error | Server Actions junto al feature; Route Handlers en `src/app/api/` |
| Aplicación | Coordinar persistencia, validación, transacciones y efectos de auditoría | `src/features/*/server/` |
| Dominio | Cálculo fiscal y tipos independientes del framework | `src/features/quotes/domain/` |
| Infraestructura | Auth, PostgreSQL/Prisma, logger, PDF y entorno | `src/lib/` y `src/generated/prisma/` |

Responsabilidades y límites:

- **UI:** captura datos y representa estados; no consulta Prisma ni decide permisos.
- **Actions/Routes:** autentican, validan Zod, llaman servicios y devuelven respuestas sin filtrar errores internos.
- **Servicios:** aplican reglas y transacciones en el servidor.
- **Dominio:** calcula importes en decimal.js. El servidor recalcula; jamás confía en los totales del navegador.
- **Persistencia:** solo desde módulos de servidor. En módulos privados usar `import "server-only"`.
- **Documentos:** renderizan un `QuoteDocumentModel`; una futura revisión emitida debe congelar su snapshot y no reconstruirse desde datos vivos.

Las validaciones de cliente mejoran la interacción pero no sustituyen validación y autorización del servidor.

## 4. Recorridos principales

### Guardar borrador

1. `src/app/page.tsx` valida sesión y carga resúmenes de borradores, configuración y clientes.
2. `quote-workspace.tsx` mantiene el estado de edición local.
3. `quote-draft.actions.ts` comprueba usuario activo/cambio de contraseña y crea `requestId`.
4. `quote-draft.service.ts` valida la forma del documento, recalcula subtotal/IGV/total y persiste snapshot más líneas con Prisma.
5. Para actualizaciones, compara `expectedVersion`; si otra sesión avanzó la versión, devuelve conflicto.

### Guardar cliente/configuración

`customer.actions.ts` autentica, valida con Zod y usa transacción Prisma para mutación y auditoría. Configuración de empresa requiere rol `admin`; acciones de cliente requieren sesión activa.

### Descargar PDF

`GET /api/quotes/drafts/[id]/pdf` exige sesión válida, carga solo un borrador, ejecuta `reactPdfRenderer` en runtime Node.js y devuelve `application/pdf` privado sin caché. No persiste el binario ni emite estado/número comercial. El documento lleva la marca “BORRADOR · NO EMITIDA”.

## 5. Persistencia

Prisma 7 genera el cliente bajo `src/generated/prisma`. No editar manualmente esos archivos: se regeneran desde `prisma/schema.prisma`.

| Modelo | Propósito |
| --- | --- |
| `User`, `Session`, `Account`, `Verification` | Better Auth, credenciales y sesiones |
| `CompanySettings` | Emisor principal, moneda, tasa fiscal y vigencia |
| `BankAccount` | Estructura de cuentas bancarias; UI todavía pendiente |
| `Customer` | Directorio de clientes |
| `QuoteDraft`, `QuoteDraftItem` | Borradores editables, líneas y snapshots |
| `UnitOfMeasure` | Catálogo pequeño de unidades |
| `AuditEvent` | Eventos de auditoría de acciones implementadas |

El estado del esquema y las migraciones aplicadas se registra en [verification.md](./verification.md). La configuración de URL Prisma 7 vive en `prisma.config.ts`; `DIRECT_URL` tiene prioridad para operaciones CLI.

## 6. Autenticación y permisos

Better Auth usa adaptador Prisma PostgreSQL con email/password, signup deshabilitado y plugin Admin. El correo funciona como identificador; no se integra envío o verificación por correo. Las páginas privadas y acciones comprueban sesión, usuario activo y estado `mustChangePassword`.

La matriz objetivo de permisos vive en [business-rules.md](./business-rules.md); las funcionalidades de emisión, estados, anulación y administración de usuarios descritas ahí son reglas de diseño hasta que se implementen. Actualmente la configuración de empresa exige `admin`; clientes y borradores están accesibles a sesiones activas.

No enviar secretos/cookies al navegador. La presencia de un control deshabilitado u oculto no sustituye guardas en servidor.

## 7. Infraestructura por entorno

```text
Local:
  Next.js dev server → DATABASE_URL (PostgreSQL)
                    → Better Auth en la misma app
                    → react-pdf en proceso Node

Actual configuración local:
  Next.js → PostgreSQL Neon; migration status verificado en branch production

No verificado:
  Preview/producción de la app, Blob, Sentry, correo, backups/restauración
```

No asumir que Neon production debe usarse para desarrollo. Antes de E2E, preview o seed demo usar base/branch aislado. Vercel sigue siendo candidato, no despliegue demostrado. Límites, coste y permiso para el uso comercial previsto se comprueban al publicar.

Variables y scripts se detallan en [operations.md](./operations.md).

## 8. PDF y almacenamiento

La descarga operativa actual usa `@react-pdf/renderer`. Puppeteer/Chromium permanece para comparación local con fixtures; `PDF_ENGINE` no conmuta los motores. Vercel Blob y almacenamiento de archivos no están implementados. No guardar PDF temporal en disco esperando persistencia serverless.

La previsualización del formulario es HTML/CSS/SVG aproximado y reproduce las curvas superior/inferior; el PDF descargado usa el renderer de servidor. La especificación exacta está en [pdf-spec.md](./pdf-spec.md) y los resultados en [pdf-engine-evaluation.md](./pdf-engine-evaluation.md).

## 9. Comandos y dependencias de desarrollo

Usar Node 24 y pnpm 12.10.1 conforme a `.nvmrc`, `engines` y `packageManager`.

| Actividad | Comando |
| --- | --- |
| Instalación reproducible | `pnpm install --frozen-lockfile` |
| Desarrollo | `pnpm dev` |
| Tipos | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Pruebas | `pnpm test` |
| Comparación PDF sintético | `pnpm pdf:compare` |
| Validar schema | `pnpm exec prisma validate` |
| Estado migrations | `pnpm exec prisma migrate status` |
| Build / server local | `pnpm build` / `pnpm start` |

No hay scripts E2E en `package.json` por ahora. No agregar lockfiles npm/Yarn.

## 10. Evolución segura

- Actualizar esta arquitectura cuando exista una nueva integración, no antes.
- Añadir emisión/revisiones en servicios del feature con transacción idempotente y estados separados de generación PDF.
- Asegurar PDF histórico sobre snapshot inmutable y autorización por descarga antes de integrar almacenamiento.
- Añadir usuarios/roles y campos de banco/logo mediante casos de uso y UI, no endpoints sin autorización.
- Si se elige Sentry/Blob/correo, verificar primero versión estable, APIs, cuota, costo y uso permitido; actualizar `operations.md`, `.env.example` y baseline.
- No poner migraciones, seed, datos reales o credenciales en el build.
