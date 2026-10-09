# Cotizador familiar

Aplicación privada para preparar cotizaciones familiares. El sistema actual conecta clientes, datos básicos de empresa y borradores con PostgreSQL; permite descargar un PDF de previsualización privado, marcado como no emitido.

## Documentación

- [Manual técnico](./docs/technical-manual.md): cómo ejecutar el proyecto, arquitectura implementada, infraestructura, entorno, datos y límites actuales.
- [Plan y etapas](./PLAN.md): alcance, progreso y definición de terminado.
- [Reglas del negocio](./docs/business-rules.md): IGV, permisos, estados y proceso comercial.
- [Arquitectura](./docs/architecture.md): capas, dependencias y estructura del código.
- [Operación y variables de entorno](./docs/operations.md): referencia canónica de entorno, seed, autenticación y despliegue.
- [Interfaz](./docs/ui-spec.md): pantallas y criterios de experiencia.
- [PDF](./docs/pdf-spec.md) y [evaluación de motores](./docs/pdf-engine-evaluation.md).
- [Base de versiones](./docs/dependency-baseline.md) y [evidencia de verificación](./docs/verification.md).

## Inicio rápido local

Requiere Node.js `24` (versión de referencia en `.nvmrc`) y pnpm `12.10.1`.

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
# Completa DATABASE_URL, BETTER_AUTH_SECRET y los datos de entorno requeridos.
pnpm dev
```

Abre `http://localhost:3000/login`. La aplicación necesita una base PostgreSQL migrada y una cuenta aprovisionada; no ejecutes el seed contra una base existente sin confirmar primero el destino. Consulta [el manual técnico](./docs/technical-manual.md) antes de migrar o aprovisionar usuarios.

No se debe publicar ni considerar el sistema terminado: emisión comercial, estados posteriores, PDF final conservado y despliegue de producción aún están pendientes.
