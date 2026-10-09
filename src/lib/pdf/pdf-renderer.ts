import type { QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";

export interface PdfRenderer {
  readonly engine: "react-pdf" | "chromium";
  readonly rendererVersion: string;
  readonly templateVersion: string;
  render(model: QuoteDocumentModel): Promise<Uint8Array>;
}
