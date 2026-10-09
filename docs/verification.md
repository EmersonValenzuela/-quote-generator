# Evidencia de verificación — etapa 1

**Fecha:** 7 de octubre de 2026  
**Entorno:** Windows x64; Node.js `v24.15.0`; pnpm `12.10.1`; Intel Core i7-13620H; 16 GiB RAM. Node.js `24.21.0` está fijado en `.nvmrc`, pero no era el runtime activo durante esta ejecución.

## Comprobaciones

| Comando / actividad | Resultado | Evidencia o alcance |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | Pasó | Lockfile actualizado y aprobado por las políticas de cadena de suministro de pnpm; sin cambio de manifiesto. |
| `pnpm typecheck` | Pasó | `tsc --noEmit`. |
| `pnpm lint` | Pasó | `eslint .`. |
| `pnpm test` | Pasó | 2 archivos, 4 pruebas; cálculo fiscal decimal y render/extracción con ambos motores. |
| `pnpm build` | Pasó | Next.js `16.4.0`; build optimizado y rutas estáticas `/` y `/_not-found`. |
| `pnpm pdf:compare` | Pasó | 10 renders por fixture y motor; seis PDF sintéticos regenerados, conteos estables y presencia de texto requerido. Métricas en `artifacts/pdf-comparison/results.json`; análisis en [evaluación PDF](./pdf-engine-evaluation.md). |
| Verificación visual local | Pasó para la base técnica | Se abrió el build de producción en escritorio y en viewport móvil de 375 px. No se observó desbordamiento horizontal; en móvil `scrollWidth` fue 360 px. Se inspeccionaron PDF de una página, tres páginas y descripciones largas de ambos motores. |

## Archivos PDF generados

Todos son sintéticos y están excluidos de Git:

- `artifacts/pdf-comparison/react-pdf/one-page.pdf`
- `artifacts/pdf-comparison/react-pdf/three-pages.pdf`
- `artifacts/pdf-comparison/react-pdf/long-description.pdf`
- `artifacts/pdf-comparison/chromium/one-page.pdf`
- `artifacts/pdf-comparison/chromium/three-pages.pdf`
- `artifacts/pdf-comparison/chromium/long-description.pdf`

## Pendiente para cerrar la etapa

No se creó ni probó un Vercel Preview. No se publicó el proyecto ni se usaron credenciales; se necesita autorización y acceso del propietario para hacer esa comprobación. Como `PLAN.md` requiere un Preview del motor preferido y la revisión de sus límites, **la etapa está implementada y validada localmente, pero su definición de terminado permanece pendiente** hasta resolver ese punto.

PDF.js imprime `UnknownErrorException` al intentar cargar sus fuentes estándar desde `file:///.../standard_fonts/` en Windows. No impide extraer texto ni comprobar páginas, pero queda como aviso conocido del inspector. Chromium se probó localmente con Puppeteer y su Chrome for Testing descargado; no se probó su empaquetado serverless. No se ejecutaron migraciones, seed ni servicios externos.

## Prototipo inicial de interfaz de cotizaciones

Se avanzó la capa visual solicitada sin fingir que las etapas de persistencia y autenticación ya están listas:

- `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` pasaron después del cambio de interfaz. Build: Next.js `16.4.0`, rutas estáticas `/` y `/_not-found`.
- Se comprobó en navegador el listado, búsqueda/filtro, apertura del editor, escritura de cliente/servicio/concepto, selección fiscal y cálculo: subtotal S/ 1,000.00 da S/ 1,180.00 con IGV y S/ 1,000.00 sin IGV.
- En el momento de validar el prototipo, se guardó un borrador de demostración únicamente en el estado de la sesión; no se escribe a disco ni se conserva al recargar. La autenticación se conectó después en la etapa 2; cotizaciones, emisión, revisiones, descarga y sincronización aún no están conectadas.
- Se revisó la vista previa del editor a 375 px; no presenta desbordamiento horizontal y la pestaña móvil cambia entre edición y vista previa. Se mantienen explícitos el aviso de datos sintéticos y las acciones de configuración deshabilitadas.
- Directorio y datos de empresa son ficticios. El alta y guardado de configuración están deliberadamente deshabilitados hasta implementar sus servicios.

Esto es un prototipo de presentación para revisar la dirección visual y el flujo. No cumple todavía los criterios de terminado de las etapas 2 o 3; primero faltan esquema, acceso y persistencia, y después la validación de formularios, permisos, conflictos concurrentes y E2E definidos en `PLAN.md`.

## Base de persistencia y autenticación — avance de etapa 2

**Estado:** la autenticación, migración inicial e integración con PostgreSQL local están verificadas. La etapa 2 sigue en progreso: la gestión persistente de clientes/configuración y la comprobación en Preview aún requieren trabajo.

- Esquema Prisma 7, configuración PostgreSQL, cliente de servidor, Better Auth con registro público deshabilitado, middleware de página privada, seed manual protegido por ambiente/base y flujo de cambio obligatorio de contraseña temporal.
- El seed puede validarse sin conexión y rechaza demo salvo ambiente development/test, nombre de base dedicado y host no productivo. Las pruebas unitarias cubren las guardas y el saneamiento del destino.
- Comprobaciones finales en Windows x64, Node.js `24.15.0` y pnpm `12.10.1`: `pnpm typecheck`, `pnpm lint`, `pnpm test` (3 archivos/8 pruebas), `pnpm build`, `pnpm peers check` y `pnpm install --frozen-lockfile` pasaron. El build de producción no necesitó DATABASE_URL ni BETTER_AUTH_SECRET: Prisma/Better Auth se inicializan solo al atender operaciones.
- La primera compilación expuso tipos incorrectos asumidos para errores Better Auth; las llamadas se ajustaron a la API real (errores APIError lanzados y respuesta de signOut `success`). La primera compilación también mostró que los imports eager exigían credenciales en build; resuelto con inicialización diferida y probado de nuevo con variables ausentes.
- Se generó `prisma/migrations/20261007180000_initial/migration.sql` desde el esquema validado. Se corrigieron defaults UUID para que el cliente Prisma genere ID al crear usuarios vía adaptador, y se agregó `session.impersonatedBy` requerido por el plugin Admin de Better Auth.
- Se descargaron los binarios portables oficiales de PostgreSQL 17.11 desde EDB y se creó un cluster efímero dentro del directorio de estado de la sesión, escuchando exclusivamente en `127.0.0.1:55432`. La BD dedicada `cotizador_dev` recibió `pnpm exec prisma migrate dev --name init`; `pnpm exec prisma migrate status` confirmó que el esquema está al día. No se instaló un servicio global ni se utilizó red/base remota.
- En PostgreSQL nativo, `pnpm db:seed` se ejecutó dos veces sin duplicar ni reemplazar contraseña; `APP_ENV=production` con `SEED_MODE=demo` fue rechazado. Login, sesión privada, signup bloqueado, redirección de contraseña temporal, cambio de contraseña, credencial anterior rechazada y nueva aceptada pasaron.
- La recuperación administrativa permitió login con la contraseña restablecida, marcó el cambio obligatorio, revocó sesiones y escribió auditoría; el seed posterior conservó la contraseña establecida. El endpoint rechazó una cuenta inactiva con 401.
- Se provocó un rechazo de contraseña temporal desde la interfaz; el log registró `auth.temporary_password_change_rejected` con `requestId` y estado, sin incluir password, cookie ni token. No se validó este diagnóstico en un Preview.
- `scripts/admin-reset-password.ts` incluye entrada oculta, confirmación reforzada en producción y solo permite objetivos con rol administrador. PGlite se utilizó solo para diagnóstico previo y no cuenta como evidencia final.
- No se han probado concurrencia de migraciones ni backup/restauración. La etapa 2 sigue abierta: faltan conexiones de UI/servicios para clientes y configuración y la comprobación del fallo con `requestId` en Preview.
- En esa comprobación inicial, la interfaz de cotizaciones seguía siendo demostrativa y no persistía borradores. Desde entonces comenzó la implementación parcial de la etapa 3, detallada a continuación; clientes y configuración siguen siendo demostrativos.

## Persistencia de borradores — etapa 3 en progreso

- Se añadieron los modelos Prisma `QuoteDraft` y `QuoteDraftItem`, y la migración `20261007190000_quote_drafts`. El cliente Prisma se regeneró con `pnpm db:generate`; `pnpm exec prisma validate` pasó.
- La pantalla de cotizaciones carga borradores desde PostgreSQL y permite abrir, crear y guardar. El servidor valida los datos, recalcula los importes desde precios base y la tasa guardada de la empresa, guarda instantáneas de los datos y registra auditoría. La actualización compara la versión esperada para rechazar escrituras obsoletas.
- Se aplicaron los dos archivos SQL de migración a una instancia PGlite efímera mediante el cliente `pg`; ambas ejecuciones pasaron. No se considera esto una prueba de PostgreSQL nativo ni de Neon. `pnpm exec prisma migrate deploy` no pudo conectar con el servidor PostgreSQL-wire de PGlite (P1001), por lo que el ejecutor de migraciones de Prisma queda pendiente de validar con PostgreSQL compatible.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` (3 archivos, 8 pruebas), `pnpm build` y `pnpm exec prisma validate` pasaron al finalizar estos cambios.
- Un smoke test local con datos sintéticos creó y abrió un borrador, guardó Con IGV (S/ 1,180.00) y Sin IGV (S/ 1,000.00), cambió de modalidad sin acumular impuesto, listó la versión más reciente y rechazó una escritura con versión obsoleta. Usó los SQL de migración aplicados a PGlite y Prisma con un adaptador pg sobre `127.0.0.1`; no fue una prueba de PostgreSQL nativo.
- `pnpm exec prisma migrate deploy` no pudo usar el servidor wire-protocol PGlite (P1001). Las migraciones se ejecutaron directamente en esa base temporal para probar el servicio; la orden estándar de Prisma sigue pendiente de probar con PostgreSQL nativo o Neon de desarrollo.
- En la primera validación local aún no se había probado Neon. La verificación remota posterior y el estado actual de las migraciones se registran en la sección siguiente.
- La etapa 3 no está terminada: falta una comprobación de integración del servicio y del conflicto concurrente sobre PostgreSQL nativo o una rama Neon de desarrollo, además de los E2E de escritorio/móvil definidos en `PLAN.md`. Clientes y configuración aún no persisten.
- En ese punto histórico no se había enlazado Neon ni aplicado cambios remotos.

## Verificación real en Neon — borradores

- A petición explícita del usuario, se conectó el `.env` al proyecto Neon cuya rama actual es `production`. Antes de escribir, se verificó por conexión de solo lectura que la base `neondb` tenía cero tablas públicas; no había historial Prisma ni tablas de usuarios/cotizaciones.
- Se encontró `DIRECT_URL` apuntando al marcador `.invalid` aunque `DATABASE_URL` ya contenía la URL Neon pooler. Se actualizó solo el valor local ignorado de `DIRECT_URL`, derivando el host directo de la misma URL Neon (se quitó el segmento `-pooler`); no se imprimieron las URLs.
- `pnpm exec prisma migrate deploy` aplicó `20261007180000_initial` y `20261007190000_quote_drafts`. `pnpm exec prisma migrate status` confirmó que las dos migraciones están aplicadas y el esquema está al día.
- Una prueba de integración ejecutada contra Neon con datos sintéticos verificó crear, leer y listar un borrador; tasa de IGV autoritativa de la empresa (se envió una tasa falsa de 99 % y se persistió 18 %); S/ 1,180.00 Con IGV; S/ 1,000.00 Sin IGV; cambio de modalidad sin acumulación; y rechazo de una versión obsoleta.
- La prueba eliminó su borrador, conceptos, auditoría, usuario sintético y configuración sintética. Una consulta final confirmó cero filas en usuarios, configuración de empresa, borradores, conceptos y auditoría; solo permanecen las dos filas de historial de migraciones.
- Verificaciones posteriores: `pnpm typecheck`, `pnpm lint`, `pnpm test` (3 archivos/8 pruebas), `pnpm build` y `pnpm exec prisma migrate status` pasaron. Un typecheck lanzado en paralelo con la compilación tropezó con archivos temporales `.next/types` que el build estaba regenerando; se repitió después del build y pasó.
- No se ejecutó `neon deploy`, no se instalaron extensiones Neon ni se ejecutó seed. La base está migrada pero sin administrador ni configuración `main`; el inicio de sesión y uso normal aún requieren el bootstrap manual autorizado. La rama sigue llamándose `production`; las pruebas se limitaron a una base inicialmente vacía y la prueba sintética se limpió. Para iterar con datos persistentes de desarrollo, crear una rama Neon separada.
- La conexión previa de lectura registró una advertencia informativa de `pg` sobre cambios futuros en la interpretación de `sslmode=require`; no afectó la conexión ni las pruebas.

## Bootstrap de administrador en Neon

- Ejecutado a solicitud explícita el `2026-10-07` con `APP_ENV=production`, `SEED_MODE=bootstrap` y `SEED_ALLOW_PRODUCTION=true`. Se generó una clave Better Auth persistente dentro del `.env` local ignorado por Git; no se añadió a archivos versionados.
- La cuenta inicial usa el identificador de ejemplo `administrador@example.com` porque no se proporcionó un correo. Se creó con una contraseña temporal aleatoria comunicada directamente al usuario; Better Auth exige cambiarla antes de acceder a la aplicación. La contraseña no se registra en este documento ni en logs.
- Verificación remota después del seed: un administrador, `mustChangePassword=true`, una configuración inicial incompleta y cinco unidades; cero clientes, borradores o eventos de auditoría. No se ejecutó modo demo ni se copiaron datos de clientes.
- `pnpm dev` reiniciado con el secreto persistente y `/login` respondió HTTP 200. El inicio de sesión con la cuenta y el flujo de cambio de contraseña quedan pendientes de prueba interactiva.

## Clientes y configuración desde la interfaz

- Se reemplazaron los registros ficticios del directorio por consultas a PostgreSQL. Crear, editar y activar/desactivar clientes se valida en acciones de servidor con sesión, Zod y auditoría. Los borradores ahora pueden seleccionar un cliente activo; se persiste la relación `customerId` además de la instantánea comercial.
- La pantalla de empresa carga valores reales y guarda nombre comercial, razón social, RUC, dirección, teléfono, correo, tasa de IGV y vigencia. El servidor vuelve a validar el usuario administrador, valida Zod, conserva decimales y audita cambios. Los campos bancarios, logo, plantilla y gestión de usuarios siguen pendientes.
- Prueba real en la sesión autenticada del administrador: se creó un cliente sintético desde la UI; se seleccionó al editar una cotización, se guardó el borrador desde el editor y se verificó en Neon que `customerId` estaba relacionado y que subtotal 1,000 + IGV 180 produjo total 1,180. La prueba temporal se limpió (cliente, borrador, conceptos y eventos de auditoría relacionados); quedan cero filas de esos datos sintéticos.
- Se guardó desde UI el formulario actual de configuración (valores bootstrap sin datos de negocio); se confirmó el mensaje de éxito. La auditoría `company.settings_updated` se conserva como registro de esa operación. No se inventaron ni establecieron datos reales de la empresa.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` (3 archivos/8 pruebas) y `pnpm build` pasaron con estos cambios.

## Validación final de persistencia — clientes, configuración y relación con borradores

- Después de los últimos cambios (edición de clientes, vínculo del cliente al borrador y uso de la tasa IGV de la empresa), pasaron `pnpm lint`, `pnpm test` (3 archivos, 8 pruebas), `pnpm exec prisma validate`, `pnpm build`, `pnpm typecheck` y `pnpm exec prisma migrate status`.
- El estado de Prisma confirmó que las dos migraciones están aplicadas y que el esquema de Neon está actualizado. No fue necesario crear ni aplicar otra migración.
- `pnpm build` compiló correctamente Next.js `16.4.0`; el build también completó su comprobación TypeScript. `pnpm typecheck` se ejecutó aparte después del build para evitar interferencia con los tipos generados en `.next`.
- La aplicación local respondió HTTP 200 en `http://localhost:3000/`. La evidencia funcional de creación/selección/guardado de cliente, relación persistida con el borrador, cálculo fiscal y guardado de configuración corresponde a la prueba autenticada descrita en la sección anterior; no se repitieron escrituras de prueba durante esta validación final.
- No se imprimieron ni modificaron credenciales. No se repitió seed ni se hicieron cambios destructivos en Neon.

## Descarga de previsualización PDF de borradores

- Se añadió una ruta privada `GET /api/quotes/drafts/[id]/pdf`: exige sesión activa y contraseña ya cambiada, solo sirve borradores existentes, renderiza en Node.js con react-pdf y devuelve `application/pdf` como descarga privada sin caché. Se verificó que una solicitud anónima recibe 401; identificadores mal formados o borradores inexistentes reciben 404.
- En la lista de cotizaciones aparece un botón de descarga por borrador. El archivo se genera con los datos guardados, no con datos sin guardar del editor, y la descarga no altera el estado ni escribe un PDF permanente en almacenamiento.
- La previsualización lleva las leyendas **BORRADOR · NO EMITIDA** y **No válido para envío**. Cambiar estados comerciales, emitir, asignar número definitivo y conservar el PDF de una revisión emitida siguen pendientes; no se presenta este PDF de prueba como documento final.
- Prueba en navegador con sesión autenticada: la ruta local respondió HTTP 200, `Content-Type: application/pdf`, disposición de descarga y contenido PDF de 5.119 bytes. No se modificaron datos en la base.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (3 archivos, 9 pruebas) y `pnpm build` pasaron. La prueba de PDF verificó que la versión borrador contiene el aviso de no emisión y no contiene las leyendas del fixture sintético.

## Fidelidad de curvas del PDF de borrador

- A partir del PDF de referencia adjuntado por el usuario, se reemplazó el encabezado recto por curvas vectoriales azul marino y gris azulado en react-pdf. El nombre y dirección de empresa y el rótulo de borrador se dibujan después de las formas en la misma capa SVG, así las curvas no los tapan. El pie inferior se dejó intacto.
- Se revisó visualmente el PDF sintético de una página y se regeneraron los seis artefactos de comparación. `pnpm pdf:compare` pasó para ambos motores, con conteos de 1 página, 3 páginas y descripción extensa consistentes, texto seleccionable y todos los contenidos requeridos.
- `pnpm lint`, `pnpm typecheck` y la prueba dirigida `pnpm test -- tests/integration/pdf-rendering.test.ts` pasaron. La prueba dirigida verificó 3 casos de render y paginación.
- La identidad del logo y otros recursos visuales originales siguen pendientes; este cambio aproxima únicamente el diseño curvo superior solicitado.

## Curvas del encabezado en la previsualización del editor

- La vista previa HTML del formulario ahora muestra las mismas curvas superiores vectoriales azul marino y gris azulado que la plantilla react-pdf. Los datos editables de empresa y el rótulo **BORRADOR · NO EMITIDA** se presentan sobre las curvas, con contraste legible.
- La vista previa HTML también reproduce la curva gris azulada y el campo azul marino del pie PDF, manteniendo los textos informativos encima del fondo curvo.
- Se comprobó visualmente la pantalla del editor en el navegador local. No se alteró el comportamiento fiscal del preview.

## Condiciones comerciales y especificaciones opcionales

- Los borradores nuevos inician con forma de pago “50 % de anticipo al confirmar la orden y 50 % contra entrega”, validez de 7 días calendario desde la emisión y plazo de ejecución de 7 días calendario posteriores al anticipo y recepción de la orden de trabajo. Los tres textos son editables por cotización.
- Especificaciones quedó como sección independiente y opcional; el bloque se omite en la vista previa y en ambos renderers PDF si no hay contenido. Condiciones comerciales se muestran siempre, también en la vista previa y en ambos renderers PDF.
- `pnpm lint` pasó. `pnpm test` pasó con 4 archivos y 10 pruebas. `pnpm pdf:compare` regeneró los fixtures sintéticos con paginación/texto extraíble consistente; PDF.js mostró sus avisos conocidos de fuentes estándar locales no cargadas en Windows. No se hizo una nueva revisión visual de esos artefactos.
- La compilación de Next.js pasó su fase de compilación, pero `pnpm typecheck` y la fase de tipos de `pnpm build` fallaron por tres archivos vacíos preexistentes (`src/app/clientes/page.tsx`, `src/app/configuracion/page.tsx`, `src/app/cotizaciones/page.tsx`) referenciados por tipos generados. El typecheck temporal focalizado en los módulos modificados pasó. No se modificaron esas rutas fuera del alcance.
- No se ejecutaron migraciones ni seed; los campos persistentes existentes ya guardan los textos y no requirieron cambios de esquema.
