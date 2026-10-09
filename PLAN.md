# Plan del cotizador familiar

**Actualizado:** 9 de octubre de 2026. **Estado:** base inicial, autenticación, recuperación, clientes, configuración de empresa y borradores están conectados parcialmente y probados contra Neon. Los borradores guardados ya permiten descargar una previsualización PDF privada marcada como no emitida; la emisión y los estados comerciales siguen pendientes. También faltan cuentas familiares adicionales, bancos/plantilla y pruebas E2E de etapa 3. La validación local de la etapa 1 pasó, pero falta el Vercel Preview requerido para cerrarla formalmente. Evidencia reciente en [docs/verification.md](./docs/verification.md).

Proyecto nuevo e independiente. Aplicación gratuita para uso familiar por ahora, sin IA integrada y sin servicios de pago. No usar infraestructura ni datos de proyectos anteriores. Una cuenta emisora compartida con usuarios familiares es el alcance inicial; multiempresa queda fuera.

## Documentos propietarios

| Archivo | Contenido |
| --- | --- |
| AGENTS.md | Convenciones, versiones actuales y reglas para desarrollar |
| docs/business-rules.md | IGV, numeración, estados, usuarios, modelo de datos y acciones comerciales |
| docs/pdf-spec.md | Diseño, paginación y evaluación de motores |
| docs/architecture.md | Arquitectura por capas y estructura de carpetas |
| docs/ui-spec.md | Pantallas, accesibilidad y experiencia de uso |
| docs/operations.md | Variables, seed, acceso sin correo, errores y despliegue |
| .env.example | Nombres y valores de ejemplo, sin secretos |

## Decisiones técnicas

Monolito modular con Next.js App Router, React, TypeScript estricto, shadcn/ui, Tailwind CSS y pnpm. Formularios React Hook Form + Zod son la decisión objetivo; **React Hook Form aún no está instalado** en la implementación actual. Dinero con decimal.js; PostgreSQL + Prisma; autenticación Better Auth.

Candidatos, no servicios ya integrados: Neon Free, Vercel Hobby cuando el uso cumpla sus condiciones y almacenamiento privado de Vercel Blob dentro de su cuota. Neon está configurado para el entorno actual; Blob y despliegue no están implementados/verificados. Verificar condiciones y cuotas antes de elegir; no activar cobro. Si no son adecuados, no publicar hasta resolverlo con una opción gratuita permitida.

PDF: la comparación local de `@react-pdf/renderer` y Chromium está documentada en [docs/pdf-engine-evaluation.md](./docs/pdf-engine-evaluation.md). `@react-pdf/renderer` es la preferencia local y el motor actual para la descarga de borradores; la decisión de despliegue queda pendiente de Vercel Preview. Chromium es solo comparativo local. No usar Browserless ni servicios de render contratados. V1 sin correo; hay logs estructurados y Sentry gratuito solo opcional/futuro, actualmente no integrado.

## Alcance

Acceso privado, empresa emisora, clientes, conceptos libres con autocompletado histórico, borradores, modalidad con/sin IGV, numeración, emisión, revisiones, PDF privado y respuesta manual. Botón de WhatsApp abre un mensaje; el usuario adjunta el PDF manualmente.

Fuera de v1: IA, pagos, inventario, facturación electrónica, firma, catálogo administrable, integración WhatsApp, envío de correo, enlaces públicos a documentos y múltiples empresas independientes.

## Etapas y definición de terminado

Todas las etapas con código exigen `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` sin errores. Guardar evidencia en docs/verification.md, incluyendo lo pendiente. La evidencia de la etapa 1 y del prototipo inicial de interfaz está en [docs/verification.md](./docs/verification.md). El prototipo no marca terminadas las etapas 2 ni 3.

### 1. Base mínima y decisión PDF

Crear proyecto mínimo con versiones verificadas, scripts y fixtures. Implementar dos pruebas de render, sin funcionalidades de negocio adicionales. No exigir BD o correo para esta prueba.

**Terminado cuando:**
- Los cuatro comandos base pasan con pruebas reales del modelo y render.
- Cada motor genera PDFs de 1 y 3 páginas revisados visualmente, texto seleccionable y cero contenido perdido; si falla, queda documentado y la alternativa elegida sí cumple.
- Se prueba la variante elegida en Vercel Preview y se comprueban límites gratuitos; si no hay acceso, la etapa permanece pendiente.
- docs/pdf-engine-evaluation.md registra resultados, versiones y decisión; no hay Browserless ni credenciales de IA.

### 2. Persistencia, autenticación y operación

Implementar esquema, migraciones, acceso, roles, clientes, configuración, logger y prisma/seed.ts. Añadir CLI de recuperación del administrador y flujo de contraseña temporal sin email.

**Terminado cuando:**
- Comandos base y pruebas de integración contra PostgreSQL pasan.
- Seed dos veces no duplica ni cambia contraseñas; demo es rechazado en producción.
- Admin inicial inicia sesión, usuario cambia temporal y recuperación revoca sesiones; endpoints privados rechazan acceso anónimo.
- Variables inválidas muestran error útil; Sentry desactivado no exige credenciales.
- Fallo controlado trazable por requestId sin secretos en logs.

### 3. Cotizaciones y experiencia de edición

Crear editor, listado, filtros, cálculo, autocompletado y guardado con control de concurrencia.

**Terminado cuando:**
- Comandos base y E2E de creación/edición pasan en escritorio y móvil.
- Subtotal 1,000 da total 1,180 con tasa ejemplo 18 % y 1,000 sin IGV; cambiar repetidamente no acumula impuesto.
- Precios decimales y redondeo pasan; servidor ignora totales manipulados.
- Autocompletar respeta permisos y no copia precio sin acción explícita.
- Cambios simultáneos generan conflicto; teclado y errores de formulario revisados.

### 4. Emisión, revisiones y documentos

Implementar correlativo transaccional, snapshots, PDF conservado y estados comerciales. Agregar click-to-chat.

**Avance parcial:** se puede descargar desde la lista un PDF de previsualización de un borrador guardado. Está marcado como no emitido y no asigna número comercial, cambia estado ni sustituye el PDF histórico final.

**Terminado cuando:**
- Comandos base, integración de concurrencia y E2E de emisión pasan.
- Doble clic/reintento produce una sola emisión; cambiar cliente o tasa no altera un PDF emitido.
- Render fallido se recupera sin otro número; descarga privada autoriza cada petición.
- PDFs reales de 1 y 3 páginas revisados otra vez desde una revisión persistida.
- WhatsApp usa teléfono confirmado y texto codificado, sin autoenvío, adjunto automático ni cambio de estado engañoso.

### 5. Publicación familiar gratuita

Validar cuotas/uso permitido, acceso, backup, restauración y despliegue definitivo.

**Terminado cuando:**
- Comandos base y flujo completo en preview pasan.
- No hay plan de pago, overage automático, API de IA ni proveedor obligatorio contratado.
- Uso real compatible con hosting documentado; ser gratis para la familia no basta para clasificarlo como no comercial.
- Copia local restaurada en BD aislada y PDFs recuperados.
- Familia puede crear, emitir, descargar y recuperar acceso; límites y procedimiento ante cuota agotada documentados.

## Datos aún por confirmar

Logo/fuentes y datos de la cuenta emisora; tamaño de papel; formato final de numeración; si las cotizaciones son ejercicios personales o ventas reales para verificar condiciones de hosting. El modo con/sin IGV, pnpm y la independencia del proyecto ya están confirmados.

## Regla de seguimiento

Actualizar el archivo dueño de la regla cuando cambie una decisión. Este resumen no reemplaza las especificaciones. Nunca confundir documentación entregada con código probado o despliegue realizado.
