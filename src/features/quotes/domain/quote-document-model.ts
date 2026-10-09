export type QuoteTaxMode = "with-igv" | "without-igv";

export interface QuoteDocumentItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

export interface QuoteDocumentModel {
  documentPurpose?: "draft";
  quoteNumber: string;
  revisionNumber: number;
  issueDate: string;
  taxMode: QuoteTaxMode | null;
  appliedTaxRate: string;
  company: {
    name: string;
    taxId: string;
    address: string;
    phone: string;
    bankDetails: string;
  };
  customer: {
    id?: string | null;
    name: string;
    taxId: string;
    address: string;
    contact: string;
  };
  service: string;
  items: QuoteDocumentItem[];
  materials: string[];
  conditions: {
    payment: string;
    validity: string;
    execution: string;
  };
}
