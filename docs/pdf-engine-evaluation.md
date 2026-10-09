# Evaluación de motores PDF — etapa 1

**Fecha:** 7 de octubre de 2026  
**Estado:** comparación local completada; selección preferida de react-pdf pendiente de confirmación en Vercel Preview.

## Referencia visual y límites de la muestra

Se inspeccionó el PDF proporcionado en `docs/`. Es A4 vertical, de dos páginas, con cabecera y pie azul oscuro de líneas curvas, título centrado, datos de cliente y servicio, tabla de conceptos, materiales, resumen de IGV y total. La segunda página contiene una fotografía.

Las muestras son sintéticas y no copian clientes, importes, datos bancarios, logo ni fotografías del original. La fotografía no se reprodujo; el logo se identifica como pendiente. La prueba compara jerarquía, paleta, cabecera/pie, tabla, selección de texto, cálculo y paginación, no una réplica final de marca.

## Método y fixtures

- Contrato compartido `PdfRenderer.render(model)` y mismo modelo fiscal en ambos motores.
- Fixtures idénticos: una página, tres páginas (56 conceptos) y una descripción larga con 220 párrafos numerados.
- Incluye caracteres acentuados y `ñ`, encabezado y pie en cada página, totales, tildes, precios decimales, modalidad con IGV y sin IGV.
- Se generaron 10 PDFs por combinación de motor y fixture. Se comprobó la estabilidad del conteo de páginas, extracción/selección de texto y presencia de texto requerido en todas las muestras.
- Se inspeccionaron visualmente los PDF finales en el visor del navegador, incluyendo inicio de documentos, paginación larga, repetición de cabeceras y pies y totales finales.
- Duraciones de primera invocación y mediana de las nueve repeticiones, medidas por el script `pnpm pdf:compare`. No son una estimación de cold start de producción.

## Resultados locales

Equipo: Windows x64, Node.js `v24.15.0`, CPU Intel Core i7-13620H, 16 GiB RAM. Versiones de paquetes y fuentes oficiales: [base de versiones](./dependency-baseline.md). Esta ejecución usa `stage-2-curved-header-v2` para react-pdf y `stage-1-synthetic-v2` para Chromium.

| Motor | Fixture | Páginas | Tamaño | Primera invocación | Mediana de 9 repeticiones |
| --- | --- | ---: | ---: | ---: | ---: |
| `@react-pdf/renderer` 4.9.0 | Una página | 1 | 5,780 B | 123.10 ms | 30.05 ms |
| `@react-pdf/renderer` 4.9.0 | Tres páginas | 3 | 15,473 B | 163.57 ms | 141.20 ms |
| `@react-pdf/renderer` 4.9.0 | Descripción larga | 14 | 45,750 B | 218.48 ms | 175.42 ms |
| Puppeteer / Chromium 25.12.0 | Una página | 1 | 71,898 B | 1,415.37 ms | 390.89 ms |
| Puppeteer / Chromium 25.12.0 | Tres páginas | 3 | 167,598 B | 420.77 ms | 408.83 ms |
| Puppeteer / Chromium 25.12.0 | Descripción larga | 11 | 140,138 B | 444.48 ms | 444.48 ms |

Esta regeneración usa `stage-2-curved-header-v2` para react-pdf; el renderer Chromium conserva `stage-1-synthetic-v2`. Los nuevos tiempos/tamaños son evidencia de regresión operativa con la plantilla actual, no una comparación controlada del rendimiento entre motores con el mismo diseño.

Las cifras completas por render, entorno y RSS del proceso Node están en `artifacts/pdf-comparison/results.json`. El RSS **no** incluye la memoria del proceso Chromium, por lo que no sirve para comparar el uso total de memoria de los motores.

## Integridad, paginación y cálculo

- Ambos motores produjeron exactamente 1 y 3 páginas para los fixtures correspondientes, con texto seleccionable y texto requerido presente.
- Ambos conservaron los 220 párrafos, incluidos los marcadores de inicio y fin de la descripción. El documento largo ocupó 14 páginas con react-pdf y 11 con Chromium por sus distintas métricas de texto y composición; no se detectó pérdida del contenido.
- Encabezados de columnas, cabecera y pie aparecen en cada página; el pie deja visibles banco ficticio, datos del emisor y número de página. El subtotal, el impuesto y el total permanecen juntos al cierre del documento.
- Con IGV: subtotal S/ 1,000.00, IGV 18 % S/ 180.00, total S/ 1,180.00. Sin IGV: subtotal y total S/ 1,961.82 para el fixture de tres páginas, IGV agregado S/ 0.00 e indicación «Cotización sin IGV».
- La revisión visual encontró inicialmente textos cubiertos/desalineados en las capas decorativas de las dos plantillas. Se corrigieron las capas y márgenes, se incrementó la versión de plantilla y se regeneraron las muestras. En la versión final inspeccionada, el encabezado y el pie son legibles y no se superponen al contenido.

## Decisión provisional

**Preferencia local: `@react-pdf/renderer`.** Ambos motores superaron las pruebas locales; react-pdf ofrece una operación más simple al no iniciar ni empaquetar Chromium. En la última corrida, sus archivos fueron entre aproximadamente 3 y 12 veces menores. Las duraciones de esa corrida no son comparables de forma controlada entre motores porque Chromium conserva la plantilla visual anterior; la comparación de rendimiento original debe consultarse como evidencia histórica, no como garantía de rendimiento general.

La decisión no es definitiva para despliegue. `@react-pdf/renderer` tiene primitivas de layout propias y no comparte el DOM/CSS del editor. Chromium conserva mejor un modelo HTML/CSS, pero su uso en producción requiere comprobar binario, límites de tamaño, memoria y tiempo en el entorno elegido. No se probaron Vercel Preview ni una variante serverless gratuita; no se presume que ninguna haya pasado.

## Pendientes y limitaciones

- La definición de terminado de `PLAN.md` exige validar el motor elegido en Vercel Preview y contrastar las restricciones gratuitas. No se desplegó: falta la autorización y el acceso necesarios. La etapa sigue pendiente de ese criterio.
- Logo autorizado, fuentes y fotografía original no forman parte de los fixtures. Se requiere revisarlos con el usuario antes de cerrar la identidad visual final.
- Durante la extracción de texto, PDF.js informa que no puede cargar sus fuentes estándar desde una URL `file:///` en este entorno Windows. La extracción de texto, el conteo de páginas y las pruebas terminan correctamente; el aviso no se oculta y queda registrado como limitación del inspector local.
- Las muestras generadas se encuentran en `artifacts/pdf-comparison/` y se excluyen de Git; son datos sintéticos de revisión, no documentos comerciales.

## Ajuste visual de curvas para la previsualización de borrador

El 7 de octubre de 2026 se revisó de nuevo el PDF de referencia adjuntado por el usuario. La plantilla react-pdf ahora dibuja en SVG las curvas superiores azul marino y gris azulado, y compone sobre ellas el rótulo de borrador y los datos de empresa para evitar que queden cubiertos. El pie inferior existente se conservó sin cambios.

- La comparación local (`pnpm pdf:compare`) pasó con 1 página, 3 páginas y descripción extensa; el texto requerido sigue seleccionable y los contenidos permanecen completos.
- Se inspeccionó visualmente el resultado de una página junto con la referencia original. La forma curva superior ya está presente y el encabezado queda legible. El logo real, fuentes de marca y fotografía no se incorporaron: siguen pendientes de integración/revisión.
- La plantilla actual de react-pdf se identifica como `stage-2-curved-header-v2`. La decisión de motor y el requisito de Vercel Preview permanecen como se documenta arriba.
