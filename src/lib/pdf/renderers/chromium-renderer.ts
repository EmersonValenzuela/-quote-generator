import puppeteer, { type Browser } from "puppeteer";
import { calculateQuoteTotals } from "@/features/quotes/domain/calculate-quote-totals";
import type { QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";
import { formatCurrency, formatDate } from "@/features/quotes/documents/quote-pdf-format";
import type { PdfRenderer } from "@/lib/pdf/pdf-renderer";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function renderParagraphs(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function renderDocument(model: QuoteDocumentModel): string {
  const totals = calculateQuoteTotals(model);
  const hasTax = model.taxMode === "with-igv";
  const rows = model.items
    .map(
      (item, index) => `
        <tr class="${index % 2 === 1 ? "alternate" : ""}">
          <td class="description">${renderParagraphs(item.description)}</td>
          <td class="quantity">${escapeHtml(item.quantity)}</td>
          <td class="unit">${escapeHtml(item.unit)}</td>
          <td class="unit-price">${formatCurrency(item.unitPrice)}</td>
          <td class="amount">${formatCurrency(totals.lineAmounts[index])}</td>
        </tr>`,
    )
    .join("");
  const specifications = model.materials.length
    ? `<section class="block">
        <h2 class="section-label">Especificaciones</h2>
        <ul>${model.materials.map((material) => `<li>${escapeHtml(material)}</li>`).join("")}</ul>
      </section>`
    : "";

  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4 portrait; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #172b49;
            font: 9px Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .date { margin: 0 0 4px; color: #59677b; text-align: right; font-size: 8px; }
          h1 { margin: 0 0 4px; color: #172b49; font-size: 21px; text-align: center; letter-spacing: 1.2px; }
          .subtitle { margin: 0 0 17px; color: #59677b; text-align: center; font-size: 8px; }
          .details { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
          .detail-column { width: 50%; }
          .section-label { margin: 0 0 5px; color: #102b59; font-size: 7px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
          .detail-line { margin: 0 0 3px; font-size: 8px; line-height: 1.3; }
          .service { margin-bottom: 12px; padding: 8px; background: #edf1f6; }
          .service .section-label { margin-bottom: 3px; }
          .service-text { font-size: 8.5px; line-height: 1.35; }
          table { width: 100%; margin: 0 0 11px; border-collapse: collapse; font-size: 7.5px; line-height: 1.3; }
          thead { display: table-header-group; }
          th { padding: 6px 5px; background: #536580; color: white; font-size: 7px; text-align: left; }
          th.quantity, th.unit-price, th.amount, td.quantity, td.unit-price, td.amount { text-align: right; }
          th.unit, td.unit { text-align: center; }
          td { padding: 5px; border-bottom: .5px solid #d9dfe8; vertical-align: top; overflow-wrap: anywhere; }
          tbody tr.alternate { background: #e2e7ee; }
          .description { width: 47%; }
          .quantity { width: 9%; }
          .unit { width: 10%; }
          .unit-price { width: 16%; }
          .amount { width: 18%; }
          .block { margin-bottom: 9px; }
          .block ul { margin: 0; padding-left: 12px; }
          .block li, .condition { margin: 0 0 3px; font-size: 7.5px; line-height: 1.4; }
          .totals { width: 220px; margin: 0 0 10px auto; break-inside: avoid; }
          .total-line { display: flex; justify-content: space-between; padding: 3px 0; font-size: 8px; }
          .total-box { display: flex; justify-content: space-between; margin-top: 3px; padding: 8px 9px; background: #536580; color: white; font-size: 10px; font-weight: 700; }
          .tax-notice { margin-top: 4px; color: #59677b; font-size: 7px; text-align: right; }
        </style>
      </head>
      <body>
        <main>
          <p class="date">Fecha: ${formatDate(model.issueDate)}</p>
          <h1>COTIZACIÓN</h1>
          <p class="subtitle">${escapeHtml(model.quoteNumber)} · Revisión ${String(model.revisionNumber).padStart(2, "0")}</p>
          <section class="details">
            <div class="detail-column">
              <h2 class="section-label">Cliente</h2>
              <p class="detail-line">${escapeHtml(model.customer.name)}</p>
              <p class="detail-line">Documento: ${escapeHtml(model.customer.taxId)}</p>
              <p class="detail-line">${escapeHtml(model.customer.address)}</p>
              <p class="detail-line">${escapeHtml(model.customer.contact)}</p>
            </div>
            <div class="detail-column">
              <h2 class="section-label">Emisor de ejemplo</h2>
              <p class="detail-line">${escapeHtml(model.company.name)}</p>
              <p class="detail-line">Documento: ${escapeHtml(model.company.taxId)}</p>
              <p class="detail-line">${escapeHtml(model.company.phone)}</p>
            </div>
          </section>
          <section class="service">
            <h2 class="section-label">Servicio</h2>
            <div class="service-text">${escapeHtml(model.service)}</div>
          </section>
          <table>
            <thead>
              <tr><th class="description">Descripción</th><th class="quantity">Cant.</th><th class="unit">Unidad</th><th class="unit-price">P. unitario</th><th class="amount">Importe</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${specifications}
          <section class="totals">
            <div class="total-line"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div>
            <div class="total-line"><span>${hasTax ? `IGV (${totals.taxRate} %)` : "IGV no incluido"}</span><span>${formatCurrency(totals.taxAmount)}</span></div>
            <div class="total-box"><span>TOTAL</span><span>${formatCurrency(totals.total)}</span></div>
            ${hasTax ? "" : '<div class="tax-notice">COTIZACIÓN SIN IGV</div>'}
          </section>
          <section class="block">
            <h2 class="section-label">Condiciones comerciales</h2>
            <p class="condition">Forma de pago: ${escapeHtml(model.conditions.payment)}</p>
            <p class="condition">Validez de la cotización: ${escapeHtml(model.conditions.validity)}</p>
            <p class="condition">Plazo de ejecución del servicio: ${escapeHtml(model.conditions.execution)}</p>
          </section>
        </main>
      </body>
    </html>`;
}

export class ChromiumPdfRenderer implements PdfRenderer {
  readonly engine = "chromium" as const;
  readonly rendererVersion = "25.12.0";
  readonly templateVersion = "stage-1-synthetic-v2";
  private browser: Browser | undefined;

  async render(model: QuoteDocumentModel): Promise<Uint8Array> {
    const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH?.trim();
    const browser =
      this.browser ??
      (this.browser = await puppeteer.launch({
        executablePath: executablePath || undefined,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      }));
    const page = await browser.newPage();

    try {
      await page.setContent(renderDocument(model), { waitUntil: "load" });
      await page.emulateMediaType("print");
      return await page.pdf({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="box-sizing:border-box;display:flex;justify-content:space-between;width:100%;height:18mm;padding:4mm 15mm 0;border-radius:0 0 20mm 38mm;background:#102b59;color:#102b59;font:8px Arial,sans-serif;-webkit-print-color-adjust:exact">
            <div><strong style="color:white;font-size:11px;letter-spacing:1px">MARCA PENDIENTE</strong><br><span style="color:#e2e8f0;font-size:7px">EJEMPLO SINTÉTICO · NO COMERCIAL</span></div>
            <div style="max-width:48%;color:white;text-align:right"><strong style="font-size:11px">${escapeHtml(model.company.name)}</strong><br><span style="color:#e2e8f0;font-size:7px">${escapeHtml(model.company.address)}</span></div>
          </div>`,
        footerTemplate: `
          <div style="box-sizing:border-box;display:flex;justify-content:space-between;width:100%;min-height:20mm;padding:4mm 15mm 2mm;border-radius:16mm 28mm 0 0 / 4mm 5mm 0 0;background:#102b59;color:white;font:7px Arial,sans-serif;-webkit-print-color-adjust:exact">
            <div style="max-width:58%">
              <div style="margin-bottom:3px">${escapeHtml(model.company.bankDetails)}</div>
              <div>Documento sintético · Datos no válidos para pagos</div>
            </div>
            <div style="max-width:39%;text-align:right">
              <div style="margin-bottom:3px">${escapeHtml(model.company.name)}</div>
              <div style="margin-bottom:3px">${escapeHtml(model.company.address)}</div>
              <div>Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
            </div>
          </div>`,
        margin: { top: "34mm", right: "15mm", bottom: "30mm", left: "15mm" },
      });
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    const browser = this.browser;
    this.browser = undefined;

    if (browser) {
      await browser.close();
    }
  }
}

export function createChromiumPdfRenderer(): ChromiumPdfRenderer {
  return new ChromiumPdfRenderer();
}
