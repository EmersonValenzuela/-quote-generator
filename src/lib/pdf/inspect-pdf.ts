import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const STANDARD_FONT_DATA_URL = new URL(
  "../../standard_fonts/",
  import.meta.resolve("pdfjs-dist/legacy/build/pdf.mjs"),
).href;

export interface InspectedPdf {
  pageCount: number;
  text: string;
  pageTexts: string[];
}

export async function inspectPdf(data: Uint8Array): Promise<InspectedPdf> {
  const loadingTask = getDocument({
    data: Uint8Array.from(data),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    );
  }

  const result = {
    pageCount: pdf.numPages,
    text: pages.join("\n"),
    pageTexts: pages,
  };
  await loadingTask.destroy();
  return result;
}
