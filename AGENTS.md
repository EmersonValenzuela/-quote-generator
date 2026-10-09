# Reglas para implementar el cotizador

## Contexto y lectura

Proyecto nuevo e independiente. No reutilizar credenciales, infraestructura ni reglas de proyectos anteriores. Este paquete es una especificación; no contiene la aplicación implementada.

Leer `PLAN.md` antes de trabajar. Consultar solamente los documentos relevantes para el cambio:

| Trabajo | Fuente de verdad |
| --- | --- |
| Reglas, dinero, IGV, estados, permisos | `docs/business-rules.md` |
| PDF y comparación de motores | `docs/pdf-spec.md` |
| Capas, dependencias y estructura | `docs/architecture.md` |
| Pantallas e interacción | `docs/ui-spec.md` |
| Variables, seed, correo, monitoreo y despliegue | `docs/operations.md` y `.env.example` |

Ante una contradicción, aplicar la instrucción explícita más reciente del usuario y actualizar el documento propietario de la regla. No duplicar reglas completas entre archivos.

## Restricciones confirmadas

Aplicación familiar gratuita por ahora. No integrar IA, LLM, embeddings, agentes, OCR de pago, AI SDK ni API de modelos dentro del producto. La ayuda de IA durante el desarrollo no implica una función de IA en la aplicación.

No contratar servicios ni activar planes, pruebas que pasen a cobro u overages automáticos. Usar librerías gratuitas y servicios con plan gratuito verificado. Si un límite impide continuar, informar y mantener los datos; no actualizar el plan automáticamente. No prometer alojamiento gratuito ilimitado.

V1 sin correo transaccional y sin Browserless. Monitoreo básico con logs estructurados; Sentry gratuito es opcional, desactivado por defecto. El alcance de uso personal/no comercial del hosting debe verificarse antes de publicar: una app gratuita puede usarse con fines comerciales.

## Versiones y documentación

- Antes de instalar o actualizar, consultar documentación oficial, releases estables y compatibilidad de Next.js, React, Node.js, pnpm, Prisma, Better Auth y el motor PDF.
- Elegir versiones estables actuales compatibles entre sí. No adoptar beta, RC o canary por defecto ni copiar versiones de memoria o de tutoriales antiguos.
- Registrar versión exacta, fecha, URL oficial y razón de cualquier excepción en `docs/dependency-baseline.md` al iniciar la implementación.
- Fijar Node.js y `packageManager`; conservar `pnpm-lock.yaml`. No dejar `latest` como especificación permanente.
- Usar pnpm en local, CI y Vercel: `pnpm install --frozen-lockfile` en CI. No introducir lockfiles de npm o Yarn.
- Verificar las APIs reales de la versión instalada; no inventar opciones o reutilizar configuración de otro major de Prisma/Sentry/Next.js.

## Arquitectura y código

- Monolito modular por capas. Presentación → aplicación → dominio; proveedores encapsulados en infraestructura.
- Dominio independiente de React, Next.js, Prisma y SDK externos. Servicios de aplicación pueden usar Prisma directamente; no crear repositorios genéricos sin necesidad.
- TypeScript estricto, nombres en inglés, UI y mensajes en español. Evitar `any`, números mágicos y funciones de responsabilidad múltiple.
- Server Components por defecto; Client Components para interacción. Módulos privados marcados como exclusivos del servidor.
- Actions y handlers delgados; validar Zod y autorizar todas las mutaciones y descargas en servidor.
- Comentar decisiones, no repetir el código. Mantener archivos legibles y abstraer cuando exista una responsabilidad compartida real.
- Cálculo decimal centralizado; jamás confiar en importes enviados por el navegador.
- No modificar revisiones emitidas. No mezclar el estado comercial con el estado de generación PDF.
- Las interfaces de usuario deben contemplar teclado, móvil, errores, estados vacíos y cambios sin guardar.

## Trabajo y validación

- Implementar por las etapas de PLAN.md; no marcar una etapa terminada sin evidencias de su definición de terminado.
- Usar datos sintéticos en pruebas y mediciones. No copiar clientes reales al seed.
- Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` en cada etapa con código. Añadir integración/E2E/visual según su criterio de terminado.
- Un fallo por falta de credenciales o un PDF no revisado se reporta como pendiente, nunca como prueba superada.
- Registrar resultados, comandos, entorno y limitaciones en `docs/verification.md` durante implementación.
- No ejecutar seed ni migraciones automáticamente durante un build. No usar la base de producción para previews.
- No versionar secretos, PDFs comerciales privados ni archivos `.env` reales.
- No enviar mensajes, contratar servicios ni publicar sin la autorización aplicable. Preparar antes resultados revisables.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
