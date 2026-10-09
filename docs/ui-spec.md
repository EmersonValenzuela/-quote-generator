# UI y experiencia de usuario

## 9. UI y experiencia de uso

### 9.1 Dirección visual

Interfaz sobria y clara, con fondo neutro, tarjetas blancas y azul profundo como acento. El diseño de la aplicación facilitará el trabajo; el diseño decorativo de la cotización se reservará para el documento.

Se usarán una escala de tipografía consistente, números tabulares para precios, estados acompañados de texto y controles con nombres comprensibles. Evitar gradientes, animaciones o tarjetas que dificulten leer formularios y tablas.

### 9.2 Pantallas

| Pantalla | Contenido y acción principal |
| --- | --- |
| Acceso | Formulario simple, errores claros y recuperación cuando esté configurada |
| Cotizaciones | Buscar por número, cliente y servicio; filtrar por estado, fecha y vigencia; crear nueva |
| Editor | Datos generales, conceptos, especificaciones opcionales, condiciones comerciales; vista previa y guardar borrador |
| Detalle | Documento, estado, revisión vigente, descargas e historial |
| Clientes | Buscar, crear, editar y desactivar |
| Configuración | Empresa, logo, bancos, valores predeterminados y usuarios |

La pantalla inicial será el listado de cotizaciones. No se construirá primero un dashboard de gráficos si no ayuda a la tarea principal.

### 9.3 Editor

En escritorio: formulario a la izquierda y vista previa a la derecha. La vista previa tendrá zoom y contador de páginas. Los botones **Guardar borrador** y **Emitir** permanecerán accesibles sin tapar campos. La cabecera y el pie de la previsualización reutilizan las curvas azul marino y gris azulado del PDF; el contenido se mantiene aproximado y se identifica como borrador no emitido.

En móvil: pestañas **Editar** y **Vista previa**. Cada concepto se muestra como tarjeta editable; no se fuerza una tabla ancha dentro de una pantalla pequeña.

Las condiciones comerciales se muestran precargadas y editables: forma de pago, validez de la cotización y plazo de ejecución del servicio. Las especificaciones son una sección separada y opcional; aparecen en la vista previa y PDF solo si contienen texto.

Cada campo tendrá etiqueta visible y sus errores debajo. Los conceptos podrán reordenarse mediante botones accesibles; arrastrar será opcional. Se podrán agregar filas con teclado y el foco pasará a la nueva descripción.

El sistema distinguirá entre **Cambios sin guardar**, **Guardando**, **Guardado** y **No se pudo guardar**. En la primera etapa el guardado será explícito; el autoguardado se añadirá solo si está probado y no provoca conflictos.

La vista previa local refleja el formulario. El PDF definitivo se genera únicamente desde la revisión guardada. Si hay cambios sin guardar, se indicará antes de emitir o descargar una prueba.

### 9.4 Accesibilidad y fallos

- Navegación por teclado, foco visible y etiquetas asociadas.
- Contraste suficiente y estados que no dependan solo del color.
- Diálogos con foco controlado; no confirmar operaciones con un simple toast.
- Estados vacíos con una acción útil, por ejemplo “Crea tu primera cotización”.
- Mensajes concretos sin exponer SQL, tokens o errores internos.
- Advertencia al abandonar un formulario con cambios.
- Fallos del PDF permiten reintentar sin perder el documento.
- No se cargan datos comerciales sensibles en `localStorage` por defecto.


## Adiciones a la primera versión

El campo descripción incluye sugerencias de conceptos anteriores con acceso por teclado, estado de búsqueda y acción explícita para reutilizar un precio. No desplazar el foco al recibir resultados.

En el detalle, junto a Descargar PDF, mostrar “Compartir por WhatsApp”. Antes de abrirlo, permitir revisar teléfono y texto e indicar “Descarga el PDF y adjúntalo en WhatsApp”. No sugerir que el archivo se envía automáticamente.

Mostrar Con IGV / Sin IGV junto al resumen de importes. La vista definitiva del PDF corresponde al documento generado; cualquier vista HTML aproximada debe identificarse como tal.
