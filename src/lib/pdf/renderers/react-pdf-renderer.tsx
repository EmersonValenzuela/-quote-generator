import { renderToBuffer } from "@react-pdf/renderer";
import type { QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";
import type { PdfRenderer } from "@/lib/pdf/pdf-renderer";
import { QuotePdf } from "./react-pdf-template";

export const reactPdfRenderer: PdfRenderer = {
  engine: "react-pdf",
  rendererVersion: "4.9.0",
  templateVersion: "stage-2-curved-header-v2",
  async render(model: QuoteDocumentModel): Promise<Uint8Array> {
    return renderToBuffer(<QuotePdf model={model} />);
  },
};
