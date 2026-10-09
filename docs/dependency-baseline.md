# Base de versiones de la etapa 1

**Verificada:** 7 de octubre de 2026. Versiones exactas fijadas en `package.json`, `pnpm-lock.yaml` y `.nvmrc`. La compatibilidad indicada se comprobó con instalación inmutable, typecheck, lint, pruebas y build locales; no implica validación en Vercel.

## Runtime y herramientas principales

| Componente | Versión fijada / comprobada | Fuente oficial consultada | Decisión |
| --- | --- | --- | --- |
| Node.js | `.nvmrc`: `24.21.0`; `engines`: `>=24.11.0 <25` | [Ciclo oficial de releases](https://nodejs.org/en/about/previous-releases) | Se fija la línea 24 LTS. El entorno de esta prueba tenía Node `24.15.0`, también dentro del rango y compatible con los comandos ejecutados. |
| pnpm | `12.10.1` (`packageManager`) | [Instalación de pnpm](https://pnpm.io/installation) | Mismo gestor y versión en local y CI; lockfile conservado. |
| Next.js | `16.4.0` | [Instalación y requisitos oficiales](https://nextjs.org/docs/app/getting-started/installation) | App Router; el build local produjo las rutas estáticas sin necesitar base de datos ni servicios externos. |
| React / React DOM | `19.3.0` / `19.3.0` | [Documentación oficial de React](https://react.dev/learn) | Versiones iguales; instalación y build comprobados junto con Next.js. |
| TypeScript | `6.0.3` | [Documentación oficial de TypeScript](https://www.typescriptlang.org/docs/) | Se fija una versión estable compatible con el parser de TypeScript incluido por `eslint-config-next`; no se adopta TS 7. |
| Tailwind CSS / PostCSS | `4.3.3` / `4.3.3` | [Documentación de Tailwind](https://tailwindcss.com/docs) | Misma versión para el plugin y el framework. |
| shadcn CLI | `4.21.4` | [Documentación oficial de shadcn/ui](https://ui.shadcn.com/docs) | Generó los componentes base de la etapa; los componentes quedan en el repositorio. |
| `@react-pdf/renderer` | `4.9.0` | [Documentación v4](https://react-pdf.org/docs/v4/advanced/page-wrapping) | Candidato de producción evaluado con sus primitivas de documento y paginación. |
| Puppeteer | `25.12.0` | [Documentación oficial](https://pptr.dev/) | Solo candidato comparativo local; descarga y lanza Chromium for Testing sin servicio contratado. |
| Chromium for Testing | `154.0.8037.57` | [Gestión oficial de navegadores de Puppeteer](https://pptr.dev/browsers-api) | Binario local descargado por Puppeteer. No representa una prueba de empaquetado serverless. |

## Dependencias fijadas

| Paquete | Versión | Uso |
| --- | --- | --- |
| `@base-ui/react` | `1.8.0` | Primitivas de UI utilizadas por shadcn/ui. |
| `class-variance-authority` | `0.7.1` | Variantes de componentes. |
| `cn` | `0.4.0` | Composición de clases utilizada por shadcn/ui. |
| `decimal.js` | `10.6.0` | Cálculo decimal del dominio de cotizaciones. |
| `lucide-react` | `1.52.0` | Iconografía. |
| `tw-animate-css` | `1.4.0` | Utilidades de animación de shadcn/ui. |
| `@tailwindcss/postcss` | `4.3.3` | Integración PostCSS de Tailwind. |
| `@types/node` | `24.10.0` | Tipos del runtime Node.js. |
| `@types/react` / `@types/react-dom` | `19.3.0` / `19.3.0` | Tipos de React. |
| `eslint` / `eslint-config-next` | `9.39.5` / `16.4.0` | ESLint 9 es la rama compatible con los peers declarados por los plugins import, jsx-a11y y react. ESLint 10 ejecutaba lint pero producía peers incompatibles; se eligió la versión 9.x más reciente del registro consultado. |
| `pdfjs-dist` | `6.4.299` | Conteo de páginas y extracción de texto en la comparación. |
| `tsx` | `4.23.15` | Ejecución del script de comparación en TypeScript. |
| `vitest` | `5.0.3` | Pruebas unitarias y de integración. |
| `prisma` / `@prisma/client` / `@prisma/adapter-pg` | `7.10.0` | Persistencia PostgreSQL; Prisma 7 configura URL y seed en `prisma.config.ts`. |
| `better-auth` | `1.7.7` | Sesiones con credenciales, acceso privado y administración de roles; signup público deshabilitado. |
| `pg` / `@types/pg` | `8.23.1` / `8.23.1` | Adaptador oficial de PostgreSQL de Prisma. |
| `zod` | `4.6.5` | Validación de entorno, autenticación y formularios del servidor. |
| `dotenv` | `18.0.6` | Carga de `.env` en la configuración CLI de Prisma. |
| PostgreSQL (prueba local) | `17.11` | Instancia portátil temporal para migración e integración en Windows; solo loopback, sin servicio global ni datos de producción. Binarios obtenidos del [sitio oficial de PostgreSQL](https://www.postgresql.org/download/windows/) y EDB. |

El lockfile resuelve las dependencias transitivas con versiones exactas. La instalación reproducible `pnpm install --frozen-lockfile` pasó el 7 de octubre de 2026 con pnpm `12.10.1`.

## Compatibilidad y alcance

- Node.js `24.21.0` está fijado para el proyecto; typecheck, lint, pruebas, render y build se ejecutaron en `24.15.0`. Ejecutar nuevamente en la versión fijada antes de cerrar la etapa.
- El renderer de Chromium necesita un proceso de navegador y más recursos que react-pdf. Esta etapa solo prueba Chromium local; no se instalaron binarios serverless ni se contrató alojamiento.
- Prisma y Better Auth se incorporaron para la etapa 2, con versiones estables consultadas en sus páginas oficiales de releases y compatibles con el runtime fijado. No se añadió proveedor de despliegue.
- pnpm 12 aplica controles a scripts de instalación. Se permitieron explícitamente `esbuild`, `puppeteer` y `unrs-resolver` en `pnpm-workspace.yaml`; no se habilitaron scripts de forma global.
- No se integraron APIs, SDK ni servicios de IA, correo o Browserless.
- Base etapa 2 consultada el 7 de octubre de 2026: [Prisma 7.10.0](https://github.com/prisma/prisma/releases/tag/7.10.0), [Better Auth 1.7.7](https://github.com/better-auth/better-auth/releases/tag/v1.7.7) y [ESLint 9.39.5](https://github.com/eslint/eslint/releases/tag/v9.39.5). Prisma/Better Auth se eligieron por estabilidad y soporte para Prisma 7/PostgreSQL con Node fijado; ESLint se limita a 9.39.5 por los rangos peer de los plugins de la configuración Next actual.
- Better Auth IDs se generan con `@default(uuid())` del cliente Prisma; requerido por la combinación real de Better Auth 1.7.7 y adaptador Prisma 7.10.0. El plugin Admin también exige `Session.impersonatedBy`; ambos requisitos se comprobaron al ejecutar el seed y el endpoint de autenticación.
