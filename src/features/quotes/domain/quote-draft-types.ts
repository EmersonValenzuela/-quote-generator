import type { QuoteTaxMode } from "./quote-document-model";

export interface QuoteDraftSummary {
  id: string;
  version: number;
  number: string;
  customer: string;
  service: string;
  issueDate: string;
  total: string;
  status: "Borrador";
  taxMode: QuoteTaxMode | null;
}

export interface PersistedQuoteDraft {
  version: number;
  model: import("./quote-document-model").QuoteDocumentModel;
}
