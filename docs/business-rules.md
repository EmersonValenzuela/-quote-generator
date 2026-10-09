# Reglas del negocio

Fuente de verdad de permisos, importes, revisiones y estados.

## 5. Usuarios y permisos

Roles iniciales propuestos:

| Acción | Administrador | Cotizador |
| --- | --- | --- |
| Consultar clientes y cotizaciones | Sí | Sí |
| Crear y editar clientes | Sí | Sí |
| Crear, editar y duplicar borradores | Sí | Sí |
| Emitir y descargar cotizaciones | Sí | Sí |
| Registrar aceptación o rechazo | Sí | Sí |
| Anular una cotización emitida | Sí | No |
| Configurar empresa y plantilla | Sí | No |
| Gestionar usuarios | Sí | No |

En esta versión los cotizadores comparten las cotizaciones de la empresa. Si se necesita limitar la visibilidad a documentos propios, se cambiará esta regla antes de desarrollar las consultas.

No habrá registro público. El administrador inicial se crea mediante seed controlado. La v1 no envía correo: alta y recuperación asistidas por administrador, conforme a `operations.md`. No integrar Resend en esta etapa.

## 6. Flujo principal

1. El usuario inicia sesión y abre **Nueva cotización**.
2. Selecciona un cliente existente o registra uno sin perder el borrador.
3. Completa el servicio, la fecha, los conceptos, materiales y condiciones; selecciona expresamente **Con IGV** o **Sin IGV**.
4. El sistema muestra importes provisionales y el estado del guardado.
5. Guarda el borrador; el servidor valida, recalcula y conserva los datos.
6. Revisa la vista previa y descarga el PDF de prueba del borrador guardado si necesita comprobar la impresión exacta. El archivo se marca como **BORRADOR · NO EMITIDA** y descargarlo no cambia el estado.
7. Presiona **Emitir cotización**. El sistema valida todos los requisitos, asigna el número definitivo y congela la revisión.
8. Genera el PDF de esa revisión. Si falla el motor de documentos, la cotización permanece emitida y permite reintentar la generación.
9. Descarga el PDF y lo envía al cliente por su medio habitual.
10. Registra manualmente la respuesta: aceptada o rechazada; el administrador puede anularla con un motivo.

**Guardar**, **Emitir** y **Descargar** son acciones distintas. El PDF descargable del borrador es solo una previsualización; no sustituye el PDF conservado de una revisión emitida. Descargar no cambia el estado comercial. La aplicación nunca mostrará “enviada” si no tiene evidencia de un envío.

## 7. Estados y revisiones

| Estado persistido | Significado | Edición del contenido |
| --- | --- | --- |
| Borrador | Documento en preparación, sin compromiso comercial definitivo | Permitida |
| Emitida | Revisión validada, numerada e inmutable | Mediante nueva revisión |
| Aceptada | Aceptación registrada por un usuario | No |
| Rechazada | Rechazo registrado por un usuario | No |
| Anulada | Retirada con motivo y usuario responsable | No |

Transiciones permitidas: Borrador → Emitida; Emitida → Aceptada, Rechazada o Anulada. Eliminar un borrador requiere confirmación; los documentos emitidos no se eliminan físicamente mediante la interfaz.

**Vencida** será una condición calculada a partir de `validUntil`, no un reemplazo del estado. Una cotización puede seguir figurando como emitida y mostrar la etiqueta “Vencida”. Registrar una aceptación fuera de vigencia requerirá confirmación explícita y quedará auditado.

Una revisión comercial utiliza el mismo número de cotización y un nuevo número de revisión. La revisión emitida anterior se conserva. Al emitir la nueva, pasa a ser la vigente y la anterior queda marcada como sustituida. No se permite emitir una revisión nueva sobre una cotización ya aceptada; se duplica como nueva cotización.

La versión del diseño (`templateVersion`) y la revisión comercial (`revisionNumber`) son conceptos diferentes. Cambiar el diseño global no modifica los PDFs emitidos.

## 8. Reglas del negocio

### 8.1 Numeración y concurrencia

Formato propuesto: `COT-2026-000001`; revisión visible `R01`, `R02`, etc. Es una propuesta configurable, no una obligación fiscal.

El número se asigna únicamente al emitir. Los borradores usan un identificador interno. La asignación del correlativo, la creación de la revisión y el cambio de estado se realizan dentro de una transacción con una restricción única en base de datos.

No se usa `count() + 1`. No se reutilizan números anulados ni se promete una secuencia sin huecos. El año se calcula con la fecha de emisión y la zona horaria de la empresa.

Las operaciones de emisión y generación se diseñarán para reintentos: un doble clic o una respuesta de red perdida no debe producir dos números ni dos revisiones.

### 8.2 Clientes y contenido

- Cliente: nombre o razón social obligatorio; documento y dirección exigidos según el tipo de cliente configurado.
- Para clientes peruanos, RUC y DNI se almacenan como texto, preservando ceros; su validación no significa consultar ni certificar información de SUNAT.
- La primera versión usa un servicio o asunto general y al menos un concepto.
- Cada concepto requiere descripción, cantidad positiva, unidad y precio no negativo.
- Se admiten cantidades decimales para unidades como metros; no solo cantidades enteras.
- Precio cero se permite para un concepto sin costo, pero debe ser intencional y claramente visible.
- Descripción libre con saltos de línea; no se acepta HTML arbitrario.
- Límites iniciales propuestos: 100 conceptos, 2.000 caracteres por descripción y 5.000 por bloque de condiciones. Se validarán con pruebas del motor PDF.
- Unidades iniciales: UND, M, M², KG y SERV; se almacenan mediante un catálogo controlado.
- Las condiciones comerciales iniciales de cada borrador son editables por cotización: forma de pago “50 % de anticipo al confirmar la orden y 50 % contra entrega”; validez “7 días calendario a partir de la fecha de emisión”; plazo “7 días calendario posteriores al pago de anticipo y recepción de la orden de trabajo”.
- Las especificaciones de materiales/acabados son opcionales. Solo se incluyen en el documento cuando se agrega al menos una especificación.
- Desactivar un cliente impide nuevas selecciones; conserva sus documentos anteriores.

### 8.3 Dinero e impuestos: con IGV o sin IGV

Cada cotización tendrá un selector obligatorio **Con IGV / Sin IGV**. Esta elección afecta el total, la vista previa, el PDF y los datos conservados en la revisión. Aplica a toda la cotización; no se mezclarán tratamientos de IGV por concepto en la primera versión.

La moneda inicial es PEN. Los precios unitarios se ingresan como **precios base sin IGV** en ambos modos. Con IGV significa agregar el impuesto al subtotal; sin IGV significa no agregarlo en esa cotización. No significa extraer un impuesto ya incluido en el precio. La interfaz mostrará esta explicación junto al selector para evitar ambigüedades.

No habrá conversión de moneda ni descuentos en el alcance inicial.

```text
importeLinea = redondear(cantidad × precioUnitarioBase, 2)
subtotal = suma(importesLinea)

si taxMode == WITH_IGV:
    impuesto = redondear(subtotal × tasaIgvAplicada / 100, 2)
si taxMode == WITHOUT_IGV:
    impuesto = 0

total = subtotal + impuesto
```

Ejemplo funcional con una tasa configurada de 18 %:

| Modalidad | Subtotal | IGV agregado | Total |
| --- | ---: | ---: | ---: |
| Con IGV | S/ 1,000.00 | S/ 180.00 | S/ 1,180.00 |
| Sin IGV | S/ 1,000.00 | S/ 0.00 | S/ 1,000.00 |

Cambiar de modalidad conserva cantidades y precios base y recalcula el impuesto y el total. Volver a Con IGV no debe sumar nuevamente un impuesto sobre el total anterior: siempre se calcula a partir del subtotal.

Se almacenarán `taxMode`, `appliedTaxRate`, `taxAmount`, `subtotal` y `total`. En Sin IGV, `appliedTaxRate` y `taxAmount` serán cero; en Con IGV, la tasa provendrá de la configuración permitida por el servidor. Si esta falta o es inválida, se bloqueará la emisión con un mensaje útil. No se aceptarán tasas ni totales arbitrarios del navegador.

El selector aparecerá junto al resumen monetario, sin preselección silenciosa en una nueva cotización. Duplicar conservará la modalidad del origen, claramente visible para revisión. Un borrador incompleto puede guardarse sin elegir modalidad, pero no emitirse.

Presentación en el PDF:

- Con IGV: mostrar subtotal, `IGV (tasa %)`, importe del impuesto y total.
- Sin IGV: mostrar subtotal, `IGV no incluido: S/ 0.00` y total; añadir la indicación visible **Cotización sin IGV**. El cero representa el impuesto agregado al cálculo, no una clasificación de exoneración tributaria.
- La modalidad es parte del contenido comercial congelado. Una cotización emitida requiere una nueva revisión para cambiarla.

Se usará redondeo decimal `ROUND_HALF_UP`. Cantidad admite hasta 3 decimales y precio unitario hasta 4; los importes finales se conservan con 2 decimales. Se rechazan precisión o rangos mayores en lugar de truncarlos silenciosamente.

Los valores entran y salen como cadenas decimales; se guardan en columnas PostgreSQL `NUMERIC` y se calculan con `decimal.js`. La misma función pura alimentará la estimación de la interfaz y el cálculo autoritativo del servidor.

La tasa inicial propuesta es 18 % para reproducir la referencia y será configurable. La selección comercial Sin IGV no determina por sí sola si una operación está exonerada o inafecta. El alcance es cotización, no clasificación tributaria ni facturación electrónica. Una revisión histórica nunca se recalcula con la configuración actual de impuestos.

### 8.4 Vigencia, pago y ejecución

- La vigencia se expresa en días calendario y debe ser positiva.
- Política propuesta: fecha de emisión + días de vigencia; es válida hasta el final de `validUntil` en `America/Lima`. La fecha límite se imprime para evitar ambigüedades.
- Fechas comerciales se almacenan como fecha sin hora. Eventos de auditoría se almacenan en UTC.
- La forma de pago predeterminada indica 50 % de anticipo al confirmar la orden y 50 % contra entrega. Se puede editar por cotización y no registra por sí misma pagos.
- El plazo de ejecución debe indicar desde qué evento comienza: anticipo, orden de trabajo u otro texto acordado.
- Emitir una cotización no registra automáticamente un anticipo, un pago ni el inicio del trabajo.

### 8.5 Integridad histórica y edición simultánea

Al emitir, se conserva una copia de los datos de empresa, logo, cliente, conceptos, modalidad con/sin IGV, tasa aplicada, importes, condiciones, cuentas bancarias y versión de plantilla. Se conserva además el PDF generado y su huella de integridad.

Editar el cliente, sustituir el logo o cambiar una cuenta bancaria no modifica una cotización emitida. Los archivos usados por revisiones históricas no se sobrescriben.

Los borradores usan un campo `version` para detectar ediciones simultáneas. Si otro usuario guardó cambios, el servidor devuelve un conflicto y permite recargar o conservar una copia local; no sobrescribe silenciosamente.

## 11. Modelo de datos propuesto

Los nombres siguientes expresan responsabilidades, no un esquema final de Prisma.

| Entidad | Datos principales |
| --- | --- |
| Usuarios y sesiones | Tablas de Better Auth, estado activo y rol de negocio |
| CompanySettings | Nombre comercial, razón social, documento, dirección, contacto, moneda, impuesto y valores predeterminados |
| BankAccount | Empresa, banco, moneda, titular, cuenta, CCI, posición y estado |
| Customer | Tipo de documento, número, nombre, dirección, contacto, correo, teléfono y estado |
| UnitOfMeasure | Código, etiqueta y estado |
| Quote | Cliente, creador, estado, número, revisión vigente, versión de concurrencia y fechas |
| QuoteRevision | Número de revisión, contenido congelado, fecha, vigencia, moneda, taxMode, appliedTaxRate, taxAmount, subtotal, total y versión de plantilla |
| QuoteItem | Revisión, posición, descripción, cantidad, unidad, precio e importe |
| DocumentAsset | Clave privada, tipo MIME, tamaño, checksum y referencias históricas |
| QuotePdf | Revisión, estado de generación, clave de archivo, checksum, intentos y error controlado |
| QuoteSequence | Empresa, año y siguiente correlativo |
| AuditEvent | Actor, documento, acción, fecha, motivo y metadatos mínimos |

Durante la edición, una revisión de trabajo mutable almacena el contenido del borrador. Al emitir se vuelve inmutable. Crear una revisión nueva copia ese contenido a una nueva revisión de trabajo, conservando todas las emitidas.

Los datos históricos de empresa y cliente se guardan como snapshots tipados y versionados. Los conceptos se conservan estructurados para calcular y consultar. No se almacenará todo el negocio en un JSON sin contratos ni validación.

Restricciones e índices: número único por empresa y año; revisión única por cotización; documento de cliente único cuando corresponda; referencias mediante claves foráneas; índices para cliente, estado y fecha. Las reglas monetarias se validan en aplicación y, cuando sea práctico, con restricciones de base de datos.


## Autocompletar conceptos anteriores

- Buscar entre conceptos de cotizaciones emitidas accesibles al usuario en esta empresa, excluyendo borradores y anuladas.
- A partir de 2 caracteres, búsqueda con debounce de 250 ms; máximo 10 resultados y consulta indexada/paginada en servidor.
- Normalizar espacios y mayúsculas para deduplicar; ordenar por uso reciente. No crear un catálogo administrable.
- Seleccionar una sugerencia copia descripción y unidad; precio anterior solo con acción explícita “Usar precio anterior”, mostrando fecha y moneda.
- No copiar cantidad, impuesto, cliente ni condiciones. El concepto nuevo es independiente y editable.
- Aplicar los permisos antes de consultar y evitar exponer cotizaciones que el usuario no puede ver.

## Compartir por WhatsApp

V1 usa click-to-chat: `https://wa.me/<telefonoInternacional>?text=<textoCodificado>`; el texto se codifica con `encodeURIComponent`. Número en formato internacional solo con dígitos; pedir confirmación del destinatario y del prefijo, sin inventarlos.

El botón abre WhatsApp con texto editable y no envía por sí solo. No adjunta archivos automáticamente. El mensaje inicial informa número de cotización y saludo; el usuario descarga el PDF y lo adjunta manualmente. No se inserta una URL interna inaccesible para el cliente ni se vuelve público el PDF.

No cambiar el estado a “enviada” ni afirmar entrega al abrir WhatsApp. Se puede registrar únicamente `whatsapp_opened` como interacción. Los enlaces públicos revocables para compartir documentos quedan fuera de v1.
