# Especificación del PDF y selección de motor

## 10. Diseño del PDF

### 10.1 Composición de la plantilla

| Zona | Diseño de referencia | Datos variables |
| --- | --- | --- |
| Encabezado | Logo a la izquierda, nombre comercial a la derecha y curvas en azules | Logo y nombre |
| Título | “COTIZACIÓN” centrado con jerarquía fuerte | Número y revisión añadidos de forma discreta |
| Identificación | Fecha alineada a la derecha; etiquetas de cliente y servicio a la izquierda | Fecha, cliente, documento, dirección, servicio y contacto |
| Tabla | Encabezado azul grisáceo y filas alternadas; descripción más ancha | Conceptos, cantidades, unidades, precios e importes |
| Especificaciones | Bloque opcional de materiales debajo de la tabla | Lista de materiales y acabados; omitir el bloque si no se ingresaron |
| Totales | Subtotal e impuesto a la derecha; total en caja azul | Modalidad con/sin IGV, tasa e importes calculados |
| Condiciones comerciales | Texto compacto con jerarquía clara; siempre se muestra en borradores nuevos | Forma de pago, validez y plazo de ejecución, editables por cotización |
| Pie | Curvas azules, bancos a la izquierda y datos fiscales a la derecha | Cuentas, razón social, documento y dirección |

Antes de cerrar el diseño se comprobará el tamaño de página real del archivo. A4 vertical será la base propuesta si coincide con el documento o el usuario lo acepta. El logo original y las fuentes deberán obtenerse para una reproducción precisa; no se sustituirán por una imagen inventada.

Se tomarán medidas y colores del documento. Se eliminarán defectos accidentales de composición, como texto recortado o elementos que se pisan, conservando la identidad visual. Los importes se calcularán dinámicamente; no se copiarán como texto fijo de la referencia.

### 10.2 Paginación

La plantilla no tendrá una altura rígida que oculte contenido. Se reservará espacio para el pie y se repetirá el encabezado de columnas al continuar la tabla.

- Mantener cada fila completa cuando quepa en una página.
- Si una descripción supera una página, permitir su continuación legible y probar específicamente ese caso.
- Mantener subtotal, impuesto y total juntos.
- Si materiales y condiciones no caben, mover el bloque o continuar en otra página sin reducir indiscriminadamente la fuente.
- Usar encabezado compacto en páginas posteriores, número de cotización y paginación.
- Evitar páginas vacías creadas por márgenes o saltos forzados.
- Pie decorativo ubicado dentro del espacio reservado; nunca encima de texto comercial.

La estrategia de paginación se elegirá durante la prueba de motores descrita abajo. No calcular páginas únicamente por número de filas: influye el alto real de las descripciones.


## Prueba comparativa obligatoria en etapa 1

**Candidato preferente: `@react-pdf/renderer`.** Produce PDFs mediante sus primitivas `Document`, `Page`, `View`, `Text` y SVG. No requiere Chromium; tiene render de servidor, paginación y elementos `fixed`. No asumir que acepta HTML/CSS o componentes shadcn. Su plantilla será propia y compartirá el modelo de datos, no el DOM del editor.

**Candidato alternativo para la prueba: Puppeteer + Chromium local.** Usa HTML/CSS imprimible y no necesita un servicio contratado. Browserless queda descartado por la restricción de costo. Si Chromium resulta necesario en producción, su empaquetado para Vercel debe superar límites de tamaño, memoria y tiempo usando herramientas gratuitas; no se presume viable sin probarlo.

Ambos implementarán el mismo contrato: `PdfRenderer.render(model: QuoteDocumentModel): Promise<Uint8Array>`. `rendererVersion`, `templateVersion` y snapshot identifican la reproducción; el PDF original sigue siendo el archivo histórico autoritativo.

### Procedimiento

1. Medir la página de referencia, obtener logo y fuentes autorizadas. Registrar recursos sustituidos temporalmente.
2. Crear fixtures idénticos, sintéticos, para documento de 1 página y documento de 3 páginas; incluir con/sin IGV, tildes y precios con decimales.
3. Implementar una prueba de cada motor, con encabezados, curvas, tabla, totales y pie completos.
4. Probar una descripción mayor que una página. No aplicar `wrap={false}` a un bloque que excede el área imprimible; comprobar continuidad sin pérdida.
5. Renderizar en Node.js y desplegar react-pdf en Vercel Preview. Comparar Chromium local y probar su variante serverless gratuita si se propone para producción. Medir duración, memoria disponible/observada, tamaño del archivo y fallos.
6. Ejecutar al menos 10 renders por fixture y motor; separar primera ejecución de repeticiones. Registrar entorno y medidas sin presentar la primera ejecución como un cold start comprobado.
7. Extraer texto y rasterizar todas las páginas: comprobar selección de texto, valores, conteo, márgenes, pie, encabezado y ausencia de recortes o páginas vacías.
8. Guardar muestras y resultados sanitizados en `docs/pdf-engine-evaluation.md`; explicar elección y limitaciones.

| Criterio obligatorio | Evidencia |
| --- | --- |
| Fidelidad al documento | Comparación visual de cada página, con desviaciones descritas |
| Integridad del contenido | Texto extraído coincide con conceptos e importes del fixture |
| Paginación | Fixtures de 1 y 3 páginas correctos; encabezado y pie reservan espacio |
| Servidor | Funciona en Vercel Preview con versiones estables compatibles |
| Recursos | Duración, tamaño y memoria cuando sea medible; límites del plan contrastados |
| Operación | Dependencias, costo vigente verificado, timeout y tratamiento de errores |

Si ambos cumplen, elegir `@react-pdf/renderer` por menor dependencia operativa. Si no alcanza un requisito visual esencial, documentar el fallo reproducible y elegir Chromium solo con evidencia de funcionamiento y costo cero dentro de los límites gratuitos. Si ninguna opción cumple, presentar ajustes concretos de diseño o despliegue; no contratar un servicio. No mantener dos motores activos en producción. Una prueba de despliegue sin acceso disponible se marca pendiente; no inventar resultados ni asumir superada la comparación.

## Generación, preview y conservación

`QuoteDocumentModel` es independiente del motor. Con react-pdf, la revisión exacta se previsualiza con PDFViewer o un visor del archivo generado; compartir datos no garantiza identidad con una previsualización HTML.

Mientras solo exista el modelo persistente de borradores, la descarga disponible es una previsualización del borrador guardado. Debe indicar claramente **BORRADOR · NO EMITIDA** y no implica numeración comercial, emisión, envío ni conservación como PDF histórico. La descarga de un PDF final debe implementarse sobre una revisión emitida e inmutable.

Runtime Node.js; fuentes empaquetadas y licenciadas, imágenes validadas y texto escapado. Con Chromium no aceptar scripts ni URL arbitrarias del usuario. Con react-pdf también controlar las fuentes e imágenes remotas para evitar accesos no autorizados.

El PDF nace de una revisión guardada, nunca de totales arbitrarios del cliente. Emitir confirma en BD antes de renderizar. Estados técnicos: pending, generating, ready, failed; usar reintentos idempotentes, control de concurrencia y recuperación de generaciones interrumpidas. Un fallo de render no asigna otro correlativo.

Guardar por revisión en almacenamiento privado con checksum. Descargar una revisión lista devuelve el archivo conservado. La descarga autoriza al usuario. No convertir el archivo en público para eludir límites de respuesta; evaluar entrega privada temporal cuando el tamaño lo requiera.

## Fuentes oficiales

- https://react-pdf.org/docs/v4/advanced/page-wrapping
- https://react-pdf.org/ — confirmar documentación correspondiente al major instalado.
- https://pptr.dev/api/puppeteer.page.pdf
- https://vercel.com/docs/functions/limitations
