import type { QuoteTaxMode } from "@/features/quotes/domain/quote-document-model";

export type QuoteStatus = "Borrador" | "Enviada" | "Aceptada" | "Rechazada";
export type Screen = "quotes" | "editor" | "detail" | "customers" | "settings";

export interface QuoteRow {
  id: string;
  number: string;
  customer: string;
  service: string;
  issueDate: string;
  total: string;
  status: QuoteStatus;
  taxMode: QuoteTaxMode | null;
}

export interface CustomerRow {
  id: string;
  name: string;
  documentType: string | null;
  documentNumber: string | null;
  address: string;
  contactName: string;
  email: string;
  phone: string;
  quoteCount: number;
  isActive: boolean;
}

export interface CompanySnapshot {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  taxRate: string;
  bankDetails: string;
}

export interface CompanySettingsModel {
  tradeName: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  taxRate: string;
  defaultValidityDays: number;
}
