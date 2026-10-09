# Manual técnico

**Actualizado:** 9 de octubre de 2026  
**Estado:** guía de la implementación presente. No convierte las funciones pendientes del plan en capacidades disponibles.

## 1. Propósito y lectura recomendada

Este documento explica cómo está organizado, configurado y operado el cotizador. Para evitar duplicar reglas, los detalles normativos pertenecen a sus documentos dueños:

| Si necesitas… | Consulta |
| --- | --- |
| Calcular con/sin IGV, permisos, estados y emisión | [Reglas del negocio](./business-rules.md) |
| Diseño, paginación y seguridad de PDF | [Especificación PDF](./pdf-spec.md) |
| Pantallas y accesibilidad | [Especificación UI](./ui-spec.md) |
| Uso exacto de variables, seed y operación | [Operaciones](./operations.md) y [.env.example](../.env.example) |
| Versiones fijadas y sus fuentes | [Base de dependencias](./dependency-baseline.md) |
| Evidencia realmente ejecutada y pendientes | [Verificación](./verification.md) |
| Próximas etapas y criterios de aceptación | [PLAN.md](../PLAN.md) |

El estado funcional, a grandes rasgos:

- Autenticación privada con Better Auth; no hay registro público.
- Clientes persistidos, editables y activables/desactivables.
- Configuración básica de empresa persistida.
- Borradores guardados en PostgreSQL, relación opcional con cliente y control de versión concurrente.
- Cálculos del servidor con decimal.js; modo Con IGV/Sin IGV.
- Descarga autenticada de PDF temporal de borrador, con avisos **BORRADOR · NO EMITIDA**.
- Todavía no existe emisión, número comercial, revisión inmutable, cambio de estados comerciales ni almacenamiento histórico de PDF emitido.

## 2. Tecnologías fijadas

Las versiones exactas se encuentran en `package.json`, `pnpm-lock.yaml`, `.nvmrc` y [dependency-baseline.md](./dependency-baseline.md). Referencia actual:

| Área | Tecnología |
| --- | --- |
| Runtime | Node.js 24; `.nvmrc` fija 24.21.0 y `engines` acepta `>=24.11.0 <25` |
| Gestor | pnpm 12.10.1 |
| Web | Next.js 16.4.0 App Router, React 19.3.0, TypeScript 6.0.3 |
| Estilos e interfaz | Tailwind CSS 4.3.3, primitivas Base UI y componentes locales inspirados en shadcn/ui |
| Validación | Zod 4.6.5 |
| Persistencia | PostgreSQL, Prisma 7.10.0, adaptador `pg` |
| Autenticación | Better Auth 1.7.7 |
| Cálculo monetario | decimal.js 10.6.0 |
| PDF actual | `@react-pdf/renderer` 4.9.0 |
| Pruebas | Vitest 5.0.3; fixtures de PDF; inspección con pdfjs-dist |
| Comparación de PDF | Puppeteer/Chromium local solo para evaluación; no es el motor usado por la descarga |

React Hook Form no está instalado en la implementación actual. La plantilla shadcn CLI/componentes tampoco equivale a una biblioteca shadcn completa de formularios. No se configura Sentry, Blob ni correo transaccional.

## 3. Arquitectura implementada

Es un monolito modular: una aplicación Next.js concentra páginas, acciones/handlers, lógica de aplicación y acceso a la base. La interfaz de cliente no conecta directamente con PostgreSQL.

```text
Navegador
  ├─ páginas Next.js (Server Components)
  ├─ editor interactivo (Client Component)
  └─ acciones/handlers autenticados
          │
          ├─ Zod: valida entradas
          ├─ Better Auth: identifica y autoriza sesión
          ├─ servicios de features: reglas/cálculos/transacciones
          ├─ Prisma + adaptador pg
          │       └─ PostgreSQL en Neon (entorno configurado)
          └─ react-pdf: genera PDF en runtime Node.js
```

Dirección esperada: presentación → aplicación → dominio; infraestructura se consume desde servidor. El dominio de cálculo es TypeScript puro y no debe depender de Next, Prisma o React. La aplicación no implementa repositorios genéricos.

### 3.1 Mapa del código existente

| Ruta | Responsabilidad actual |
| --- | --- |
| `src/app/page.tsx` | Autentica la entrada al espacio de trabajo y carga borradores, empresa y clientes |
| `src/app/login/` y `src/app/change-password/` | Inicio de sesión y cambio obligatorio de contraseña |
| `src/app/api/auth/[...all]/route.ts` | Adaptador HTTP de Better Auth |
| `src/app/api/quotes/drafts/[id]/pdf/route.ts` | Descarga autenticada de un borrador como PDF |
| `src/features/quotes/components/quote-workspace.tsx` | Workspace y formularios; es un componente amplio pendiente de dividir según avance funcional |
| `src/features/quotes/domain/` | Tipos de documento/borrador y cálculo fiscal |
| `src/features/quotes/server/quote-draft.actions.ts` | Entrada autenticada y manejo de errores para consultas/guardado |
| `src/features/quotes/server/quote-draft.service.ts` | Validación, cálculo autoritativo, consultas, transacciones y control de versión |
| `src/features/customers/server/customer.actions.ts` | Acciones de clientes y configuración de empresa, validación y auditoría |
| `src/lib/auth/` | Configuración Better Auth, cliente de navegador y recuperación administrativa |
| `src/lib/db/prisma.ts` | Cliente Prisma servidor con adaptador PostgreSQL |
| `src/lib/env.ts` | Validación perezosa de variables de runtime con Zod |
| `src/lib/logging/logger.ts` | Logs JSON de servidor |
| `src/lib/pdf/` | Contrato, render react-pdf y Chromium de evaluación |
| `prisma/schema.prisma` | Esquema de usuarios, empresa, clientes, borradores y auditoría |
| `prisma/migrations/` | Cambios SQL incrementales de esquema |
| `prisma/seed.ts` | Aprovisionamiento manual controlado de unidades, configuración y admin |
| `scripts/admin-reset-password.ts` | Recuperación local de contraseña de administrador |
| `tests/` | Cálculo, guardas de seed y render de PDF |

No todos los directorios descritos como objetivo futuro en [architecture.md](./architecture.md) existen todavía. Esa diferencia está señalada en dicho documento.

### 3.2 Límites HTTP visibles

| Ruta | Qué hace |
| --- | --- |
| `/login` | Inicio de sesión. |
| `/change-password` | Cambio obligatorio de clave temporal. |
| `/` | Workspace privado de cotizaciones, clientes y configuración. |
| `/api/auth/[...all]` | Endpoints gestionados por Better Auth. |
| `/api/quotes/drafts/[id]/pdf` | Genera y devuelve el PDF del borrador guardado si la sesión es válida. |

No existen aún rutas para emitir, aceptar/rechazar, anular, gestionar usuarios de familia ni descargar una revisión emitida.

## 4. Infraestructura y entornos

### 4.1 Diseño lógico

- **Aplicación local:** Next.js servido por `pnpm dev` en `http://localhost:3000`.
- **Base de datos:** PostgreSQL del proyecto Neon configurado en el `.env` local. El estado documentado de migraciones corresponde a la rama Neon `production`.
- **Migraciones/seed:** Prisma CLI toma `DIRECT_URL` si está definido; de lo contrario usa `DATABASE_URL`.
- **PDF:** se renderiza en proceso Node.js al solicitar la descarga. No requiere servicio externo ni almacenamiento Blob.
- **Archivos:** no existe almacenamiento durable de PDFs emitidos; la ruta genera un PDF de previsualización al momento de la solicitud.
- **Despliegue:** no hay Vercel Preview ni despliegue definitivo verificado. Vercel es solo candidato condicionado a confirmar uso permitido, límites y configuración de costo cero.

```text
Persona autorizada
  └─ navegador ── HTTPS/local ── Next.js
                                  ├─ Better Auth + sesión
                                  ├─ Prisma/pg ── Neon PostgreSQL
                                  └─ react-pdf ── respuesta PDF privada
```

No versionar ni copiar cadenas de conexión en documentación. No reutilizar esta base real para pruebas destructivas, seeds demo o previews. Solicitar/crear una base o branch de desarrollo aislada antes de esas operaciones.

### 4.2 Variables y secretos

La tabla completa y clasificación por variable está en [operations.md](./operations.md). Reglas esenciales:

- `.env` es local, está ignorado por Git y no debe imprimirse ni compartirse.
- `.env.example` contiene nombres/valores de ejemplo, nunca credenciales reales.
- `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, contraseñas de seed y tokens no deben tener prefijo `NEXT_PUBLIC_`.
- Solo usar `NEXT_PUBLIC_*` para valores deliberadamente visibles en el bundle del navegador.
- Varias variables de `.env.example` son futuras/reservadas; que aparezcan ahí no significa que la función esté integrada.

## 5. Persistencia y datos

Prisma define, en términos funcionales:

| Modelo | Uso actual |
| --- | --- |
| `User`, `Session`, `Account`, `Verification` | Identidad y sesión Better Auth; rol familiar y cambio obligatorio de clave |
| `CompanySettings` | Emisor principal (`main`), datos básicos, moneda PEN, tasa IGV y vigencia |
| `BankAccount` | Esquema disponible; UI de mantenimiento aún pendiente |
| `Customer` | Directorio persistente de clientes |
| `QuoteDraft`, `QuoteDraftItem` | Documento editable, líneas y datos snapshot necesarios para el borrador |
| `UnitOfMeasure` | Unidades iniciales |
| `AuditEvent` | Registro de acciones administrativas/comerciales implementadas |

Migraciones actuales: `20261007180000_initial` y `20261007190000_quote_drafts`. Comprobar el destino antes de cualquier operación de escritura. Build no debe ejecutar seed ni migraciones.

### 5.1 Guardado de cotización

El navegador envía entradas editables; el servidor valida con Zod, obtiene la tasa desde configuración de empresa, calcula importes con decimal.js y guarda el borrador. Totales del navegador no son autoridad. Para actualizar se compara `expectedVersion`; un cambio concurrente debe producir conflicto en vez de sobrescribir silenciosamente. Los campos del cliente y emisor se guardan como snapshot en el borrador.

Más detalle fiscal y comercial: [business-rules.md](./business-rules.md).

## 6. Autenticación, permisos y recuperación

- No hay signup público ni correo transaccional.
- Se usa Better Auth con usuario/contraseña; `role=admin` identifica administración y `cotizador` es el rol predeterminado.
- Cuenta inactiva o con `mustChangePassword=true` no puede operar el workspace ni descargar PDF.
- Las acciones sensibles vuelven a comprobar la sesión en servidor. Guardar configuración de empresa requiere admin; clientes y cotizaciones requieren sesión activa.
- El seed bootstrap solo debe ejecutarse contra un destino confirmado. En producción requiere la combinación explícita indicada en `operations.md`.
- Para recuperar al único admin: `pnpm admin:reset-password`; es interactivo, exige confirmación, solicita contraseña sin mostrarla, revoca sesiones y marca cambio obligatorio. La frase especial de producción no elimina la obligación de revisar el destino.

El procedimiento exacto, el comportamiento de idempotencia del seed y los límites del flujo están en [operations.md](./operations.md).

## 7. PDF y tratamiento de datos

1. El usuario guarda un borrador.
2. El enlace descarga únicamente los datos ya persistidos (no cambios todavía presentes en el editor).
3. El handler valida sesión y existencia del borrador.
4. `reactPdfRenderer` crea el documento con react-pdf en Node.js.
5. La respuesta es `application/pdf`, `private, no-store`, como adjunto.

La descarga no cambia el estado, no asigna número comercial y no conserva un archivo histórico. El documento lleva marca **BORRADOR · NO EMITIDA**. La plantilla tiene curvas vectoriales superiores e inferiores; logo real y otros recursos de marca siguen pendientes. Para emisión, revisión inmutable, almacenamiento y PDF final, seguir [pdf-spec.md](./pdf-spec.md) y etapa 4 de [PLAN.md](../PLAN.md).

## 8. Instalación y comandos frecuentes

Desde PowerShell en la raíz del proyecto:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
# Editar .env localmente sin imprimir su contenido.
pnpm dev
```

En una instalación ya configurada:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

| Comando | Efecto |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo local. |
| `pnpm build` / `pnpm start` | Compila y ejecuta producción local; no migra ni siembra. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm lint` | ESLint. |
| `pnpm test` | Vitest completo. |
| `pnpm pdf:compare` | Genera fixtures PDF sintéticos con react-pdf y Chromium, comprueba texto/páginas y actualiza artefactos locales excluidos de Git. |
| `pnpm db:generate` | Regenera cliente Prisma desde el schema. |
| `pnpm exec prisma validate` | Valida el schema. |
| `pnpm exec prisma migrate status` | Consulta estado de migraciones del destino configurado. |
| `pnpm exec prisma migrate deploy` | Aplica migraciones pendientes al destino CLI; revisar base/branch antes de ejecutarlo. |
| `pnpm db:migrate` | `prisma migrate dev`, destinado a desarrollo con base aislada. No usar en producción. |
| `pnpm db:seed` | Ejecuta seed explícito; valida entorno y destino. No ejecutarlo como diagnóstico casual. |
| `pnpm admin:reset-password` | Recuperación interactiva de la cuenta admin. |

Instalación reproducible local/CI: `pnpm install --frozen-lockfile`. No añadir package-lock ni yarn.lock.

## 9. Pruebas y evidencia

Antes de declarar lista una etapa con cambios de código se requieren typecheck, lint, test y build. Las verificaciones concretas ejecutadas, entorno, límites, pruebas Neon y PDF están en [verification.md](./verification.md). Estado más reciente documentado: pruebas y builds locales pasan; migraciones Neon están al día; despliegue/Preview, respaldo-restauración y E2E completo de negocio siguen pendientes.

Los artefactos de comparación en `artifacts/pdf-comparison/` son fixtures sintéticos locales; están excluidos de Git. No tratar la salida de prueba como cotización comercial.

## 10. Seguridad y operación segura

- Confirmar el host/nombre de base y el entorno antes de migrar, seed o recuperar una contraseña.
- Nunca ejecutar seeds demo en Neon production ni usar la base de producción como Preview/E2E.
- No guardar PDFs comerciales ni `.env` en Git; el PDF original de referencia también está ignorado.
- No escribir nombres, documentos, direcciones, cuentas bancarias, contraseñas o URLs de BD en logs ni documentación.
- Logs JSON están pensados para eventos técnicos y referencias (`requestId`); `AuditEvent` persiste acciones auditables. No son lo mismo.
- Si se alcanza un límite gratuito, detener la operación que requiera el recurso, conservar los datos y revisar una alternativa compatible; no activar facturación u overages automáticamente.
- No publicar sin revisar el permiso de uso personal/comercial del proveedor elegido.

## 11. Pendientes de capacidad (no disponibles hoy)

- Emisión transaccional, correlativo, revisiones comerciales y estados aceptada/rechazada/anulada.
- PDF final generado desde revisión emitida e inmutable, con almacenamiento privado y descarga autorizada por revisión.
- Edición de bancos, logo y plantilla; gestión de usuarios familiares.
- Autocompletado de conceptos emitidos, exportaciones y WhatsApp.
- Sentry opcional, Blob, correo transaccional, despliegue, plan de backup y prueba de restauración.
- E2E de creación/edición de extremo a extremo en escritorio/móvil y validación del Preview de infraestructura.

El progreso normativo y sus criterios de salida se mantiene en [PLAN.md](../PLAN.md), no en este resumen.
