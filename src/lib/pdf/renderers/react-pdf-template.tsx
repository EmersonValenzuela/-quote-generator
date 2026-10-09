import {
  Document,
  G,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { calculateQuoteTotals } from "@/features/quotes/domain/calculate-quote-totals";
import type { QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";
import { formatCurrency, formatDate } from "@/features/quotes/documents/quote-pdf-format";

const colors = {
  ink: "#172b49",
  muted: "#59677b",
  blue: "#102b59",
  wave: "#71819a",
  waveLight: "#b4becd",
  paleBlue: "#edf1f6",
  border: "#d9dfe8",
  row: "#e2e7ee",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 96,
    paddingRight: 38,
    paddingBottom: 75,
    paddingLeft: 38,
    color: colors.ink,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  runningHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  headerArtworkSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 595.28,
    height: 140,
    zIndex: -1,
  },
  title: {
    marginBottom: 4,
    color: colors.ink,
    fontSize: 21,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  subtitle: {
    marginBottom: 17,
    color: colors.muted,
    fontSize: 8,
    textAlign: "center",
  },
  sectionLabel: {
    marginBottom: 5,
    color: colors.blue,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  detailColumn: {
    flex: 1,
  },
  detailLine: {
    marginBottom: 3,
    fontSize: 8,
    lineHeight: 1.3,
  },
  date: {
    marginBottom: 8,
    color: colors.muted,
    fontSize: 8,
    textAlign: "right",
  },
  serviceBox: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: colors.paleBlue,
  },
  serviceLabel: {
    marginBottom: 3,
    color: colors.blue,
    fontSize: 7,
    fontWeight: 700,
  },
  service: {
    fontSize: 8.5,
    lineHeight: 1.35,
  },
  table: {
    marginBottom: 11,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 5,
    backgroundColor: colors.blue,
    color: colors.white,
    fontSize: 7,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    fontSize: 7.5,
    lineHeight: 1.3,
  },
  alternateRow: {
    backgroundColor: colors.row,
  },
  description: {
    width: "47%",
    paddingRight: 5,
  },
  quantity: {
    width: "9%",
    textAlign: "right",
  },
  unit: {
    width: "10%",
    textAlign: "center",
  },
  unitPrice: {
    width: "16%",
    paddingLeft: 3,
    textAlign: "right",
  },
  amount: {
    width: "18%",
    textAlign: "right",
  },
  headingDescription: {
    width: "47%",
  },
  headingQuantity: {
    width: "9%",
    textAlign: "right",
  },
  headingUnit: {
    width: "10%",
    textAlign: "center",
  },
  headingUnitPrice: {
    width: "16%",
    textAlign: "right",
  },
  headingAmount: {
    width: "18%",
    textAlign: "right",
  },
  detailBlock: {
    marginBottom: 9,
  },
  blockText: {
    fontSize: 7.5,
    lineHeight: 1.4,
  },
  totals: {
    width: 220,
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 8,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
    paddingVertical: 8,
    paddingHorizontal: 9,
    backgroundColor: "#536580",
    color: colors.white,
    fontSize: 10,
    fontWeight: 700,
  },
  taxNotice: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 7,
    textAlign: "right",
  },
  conditions: {
    marginTop: 2,
  },
  runningFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
  },
  footerArtworkSvg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 595.28,
    height: 75,
    zIndex: -1,
  },
  footerContent: {
    position: "absolute",
    top: 35,
    left: 38,
    right: 38,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  footerLeft: {
    maxWidth: "58%",
  },
  footerRight: {
    maxWidth: "39%",
    textAlign: "right",
  },
  footerText: {
    marginBottom: 3,
    color: colors.white,
    fontSize: 7,
  },
  pageNumber: {
    marginTop: 4,
    color: colors.white,
    fontSize: 7,
    textAlign: "right",
  },
});

function QuotePdf({ model }: { model: QuoteDocumentModel }) {
  const totals = calculateQuoteTotals(model);
  const hasTax = model.taxMode === "with-igv";
  const isDraft = model.documentPurpose === "draft";

  return (
    <Document
      title={`Cotización ${model.quoteNumber}`}
      author={model.company.name}
      subject={isDraft ? "Previsualización de borrador no emitido" : "Muestra sintética para evaluación del motor PDF"}
      language="es-PE"
    >
      <Page size="A4" style={styles.page} wrap>
        <View fixed style={styles.runningHeader}>
          <Svg
            style={styles.headerArtworkSvg}
            viewBox="0 0 595.28 140"
            preserveAspectRatio="none"
          >
            <Path
              d="M0 0H595.28V38C540 17 504 16 458 29C397 45 359 28 303 24C226 18 169 34 110 29C66 25 31 21 0 36Z"
              fill={colors.waveLight}
            />
            <Path
              d="M0 0H415C369 12 341 28 303 42C250 61 210 84 169 108C119 137 66 140 0 140Z"
              fill={colors.blue}
            />
            <Path
              d="M0 0H381C341 10 316 24 281 38C231 56 190 79 151 103C106 132 54 136 0 136Z"
              fill={colors.wave}
            />
            <Path
              d="M0 0H347C311 9 284 22 252 35C207 53 169 74 133 98C94 125 45 130 0 131Z"
              fill={colors.blue}
            />
            <G style={{ fontFamily: "Helvetica", fontSize: 11, fontWeight: 700 }}>
              <Text x={33} y={36} fill={colors.white}>MARCA PENDIENTE</Text>
            </G>
            <G style={{ fontFamily: "Helvetica", fontSize: 6 }}>
              <Text x={33} y={48} fill="#e2e8f0">
                {isDraft ? "BORRADOR · NO EMITIDA" : "EJEMPLO SINTÉTICO · NO COMERCIAL"}
              </Text>
            </G>
            <G style={{
              fontFamily: "Helvetica",
              fontSize: model.company.name.length > 36 ? 8 : 11,
              fontWeight: 700,
            }}>
              <Text x={558} y={47} fill={colors.ink} textAnchor="end">
                {model.company.name}
              </Text>
            </G>
            <G style={{ fontFamily: "Helvetica", fontSize: 7 }}>
              <Text x={558} y={61} fill={colors.muted} textAnchor="end">
                {model.company.address}
              </Text>
            </G>
          </Svg>
        </View>

        <Text style={styles.date}>Fecha: {formatDate(model.issueDate)}</Text>
        <Text style={styles.title}>COTIZACIÓN</Text>
        <Text style={styles.subtitle}>
          {model.quoteNumber} · Revisión {String(model.revisionNumber).padStart(2, "0")}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailColumn}>
            <Text style={styles.sectionLabel}>Cliente</Text>
            <Text style={styles.detailLine}>{model.customer.name}</Text>
            <Text style={styles.detailLine}>Documento: {model.customer.taxId}</Text>
            <Text style={styles.detailLine}>{model.customer.address}</Text>
            <Text style={styles.detailLine}>{model.customer.contact}</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.sectionLabel}>{isDraft ? "Emisor" : "Emisor de ejemplo"}</Text>
            <Text style={styles.detailLine}>{model.company.name}</Text>
            <Text style={styles.detailLine}>Documento: {model.company.taxId}</Text>
            <Text style={styles.detailLine}>{model.company.phone}</Text>
          </View>
        </View>

        <View style={styles.serviceBox}>
          <Text style={styles.serviceLabel}>SERVICIO</Text>
          <Text style={styles.service}>{model.service}</Text>
        </View>

        <View style={styles.table}>
          <View fixed style={styles.tableHeader}>
            <Text style={styles.headingDescription}>Descripción</Text>
            <Text style={styles.headingQuantity}>Cant.</Text>
            <Text style={styles.headingUnit}>Unidad</Text>
            <Text style={styles.headingUnitPrice}>P. unitario</Text>
            <Text style={styles.headingAmount}>Importe</Text>
          </View>
          {model.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                ...(index % 2 === 1 ? [styles.alternateRow] : []),
              ]}
            >
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Text style={styles.unit}>{item.unit}</Text>
              <Text style={styles.unitPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.amount}>{formatCurrency(totals.lineAmounts[index])}</Text>
            </View>
          ))}
        </View>

        {model.materials.length > 0 && (
          <View style={styles.detailBlock}>
            <Text style={styles.sectionLabel}>Especificaciones</Text>
            {model.materials.map((material) => (
              <Text key={material} style={styles.blockText}>
                • {material}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalLine}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text>{hasTax ? `IGV (${totals.taxRate} %)` : "IGV no incluido"}</Text>
            <Text>{formatCurrency(totals.taxAmount)}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text>TOTAL</Text>
            <Text>{formatCurrency(totals.total)}</Text>
          </View>
          {!hasTax && <Text style={styles.taxNotice}>COTIZACIÓN SIN IGV</Text>}
        </View>

        <View style={styles.conditions}>
          <Text style={styles.sectionLabel}>Condiciones comerciales</Text>
          <Text style={styles.blockText}>Forma de pago: {model.conditions.payment}</Text>
          <Text style={styles.blockText}>Validez de la cotización: {model.conditions.validity}</Text>
          <Text style={styles.blockText}>Plazo de ejecución del servicio: {model.conditions.execution}</Text>
        </View>

        <View fixed style={styles.runningFooter}>
          <Svg
            style={styles.footerArtworkSvg}
            viewBox="0 0 595.28 75"
            preserveAspectRatio="none"
          >
            <Path
              d="M0 28C58 30 95 19 146 10C207 -1 250 6 295 17C345 29 383 35 432 24C486 10 535 7 595.28 17V75H0Z"
              fill={colors.wave}
            />
            <Path
              d="M0 39C61 40 102 29 151 21C207 11 250 17 296 27C348 38 387 45 435 34C489 22 541 17 595.28 27V75H0Z"
              fill={colors.blue}
            />
          </Svg>
        </View>
        <View fixed style={styles.footerContent}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>{model.company.bankDetails}</Text>
            <Text style={styles.footerText}>
              {isDraft ? "BORRADOR · NO EMITIDA · No válido para envío" : "Documento sintético · Datos no válidos para pagos"}
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerText}>{model.company.name}</Text>
            <Text style={styles.footerText}>{model.company.address}</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            } />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export { QuotePdf };
