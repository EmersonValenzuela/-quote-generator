import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  longDescriptionFixture,
  onePageFixture,
  threePageFixture,
} from "@/features/quotes/documents/fixtures";
import type { QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";
import { createChromiumPdfRenderer } from "@/lib/pdf/renderers/chromium-renderer";
import { reactPdfRenderer } from "@/lib/pdf/renderers/react-pdf-renderer";
import { inspectPdf } from "@/lib/pdf/inspect-pdf";

const chromiumRenderer = createChromiumPdfRenderer();
const fixtures: Array<{
  model: QuoteDocumentModel;
  expectedPageCount?: number;
}> = [
  { model: onePageFixture, expectedPageCount: 1 },
  { model: threePageFixture, expectedPageCount: 3 },
  { model: longDescriptionFixture },
];

describe("PDF renderers share the same document model", () => {
  beforeAll(async () => {
    await chromiumRenderer.render({
      ...onePageFixture,
      quoteNumber: "WARM-UP",
    });
  }, 60_000);

  afterAll(async () => {
    await chromiumRenderer.close();
  });

  it.each([
    ["react-pdf", reactPdfRenderer],
    ["Chromium local", chromiumRenderer],
  ] as const)("renders selectable and complete text with %s", async (_name, renderer) => {
    for (const { model, expectedPageCount } of fixtures) {
      const pdf = await renderer.render(model);
      const inspection = await inspectPdf(pdf);

      if (expectedPageCount !== undefined) {
        expect(inspection.pageCount).toBe(expectedPageCount);
      } else {
        expect(inspection.pageCount).toBeGreaterThan(1);
      }

      expect(inspection.text).toContain(model.quoteNumber);
      expect(inspection.text).toContain("COTIZACIÓN");
      expect(inspection.text).toContain("Cliente de prueba");
      expect(inspection.text).toContain("TOTAL");
      expect(
        inspection.pageTexts.every(
          (page) =>
            page.includes("Página") &&
            page.includes("Descripción") &&
            page.includes("MARCA PENDIENTE") &&
            page.includes("Datos bancarios"),
        ),
      ).toBe(true);
    }

    const onePage = await renderer.render(onePageFixture);
    const taxText = (await inspectPdf(onePage)).text;
    expect(taxText).toContain("IGV (18.00 %)");
    expect(taxText).toContain("1,180.00");

    const threePages = await renderer.render(threePageFixture);
    const threePageInspection = await inspectPdf(threePages);
    const noTaxText = threePageInspection.text;
    expect(noTaxText).toContain("IGV no incluido");
    expect(noTaxText).toContain("COTIZACIÓN SIN IGV");
    expect(noTaxText).toContain("0.00");
    expect(threePageInspection.pageTexts.at(-1)).toContain("COTIZACIÓN SIN IGV");

    const longPdf = await renderer.render(longDescriptionFixture);
    const longText = (await inspectPdf(longPdf)).text;
    expect(longText).toContain("INICIO-DESCRIPCION-EXTENSA-Ñ");
    expect(longText).toContain("FIN-DESCRIPCION-EXTENSA-ÁÉÍÓÚ");
    expect(longText.match(/Párrafo \d{3}:/g)).toHaveLength(220);
  }, 180_000);

  it("marks persisted draft previews as not issued", async () => {
    const draftPdf = await reactPdfRenderer.render({
      ...onePageFixture,
      documentPurpose: "draft",
      quoteNumber: "Borrador c123456789012345678901234",
    });
    const draftText = (await inspectPdf(draftPdf)).text;

    expect(draftText).toContain("BORRADOR · NO EMITIDA");
    expect(draftText).toContain("No válido para envío");
    expect(draftText).not.toContain("EJEMPLO SINTÉTICO");
    expect(draftText).not.toContain("Documento sintético");
  });
});
