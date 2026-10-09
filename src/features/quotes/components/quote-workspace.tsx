"use client";

import { useMemo, useState } from "react";
import { loadPersistedQuoteDraft, savePersistedQuoteDraft } from "@/features/quotes/server/quote-draft.actions";
import type { QuoteDraftSummary } from "@/features/quotes/domain/quote-draft-types";
import type { QuoteDocumentItem, QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";
import { CustomersScreen } from "./customers-screen";
import { EditorScreen } from "./editor-screen";
import { QuoteDetail } from "./quote-detail";
import { QuotesScreen } from "./quotes-screen";
import { SettingsScreen } from "./settings-screen";
import { WorkspaceLayout } from "./workspace-layout";
import { createDraft, createEmptyItem, getTotals, toQuoteRow } from "./workspace-formatters";
import type { CompanySettingsModel, CompanySnapshot, CustomerRow, QuoteRow, Screen } from "./workspace-types";

export function QuoteWorkspace({
  userName,
  userRole,
  initialQuotes,
  initialCompany,
  initialSettings,
  initialCustomers,
}: {
  userName: string;
  userRole: string;
  initialQuotes: QuoteDraftSummary[];
  initialCompany: CompanySnapshot;
  initialSettings: CompanySettingsModel;
  initialCustomers: CustomerRow[];
}) {
  const [screen, setScreen] = useState<Screen>("quotes");
  const [quotes, setQuotes] = useState(initialQuotes.map(toQuoteRow));
  const [customers, setCustomers] = useState(initialCustomers);
  const [companySettings, setCompanySettings] = useState(initialSettings);
  const [companySnapshot, setCompanySnapshot] = useState(initialCompany);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuoteDocumentModel>(() => createDraft(initialCompany));
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingQuoteId, setLoadingQuoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [notice, setNotice] = useState("");

  const activeQuote = quotes.find((quote) => quote.id === activeQuoteId);
  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return quotes.filter((quote) => {
      const matchesSearch =
        !query ||
        `${quote.number} ${quote.customer} ${quote.service}`
          .toLocaleLowerCase("es")
          .includes(query);
      const matchesStatus =
        statusFilter === "Todos" || quote.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  function showQuotes() {
    setScreen("quotes");
    setActiveQuoteId(null);
    setNotice("");
  }

  function startDraft() {
    setDraft(createDraft(companySnapshot));
    setActiveQuoteId(null);
    setDraftVersion(null);
    setScreen("editor");
    setMobilePreview(false);
    setNotice("");
  }

  function updateCompanySettings(settings: CompanySettingsModel) {
    setCompanySettings(settings);
    setCompanySnapshot((current) => ({
      ...current,
      name: settings.legalName || settings.tradeName,
      taxId: settings.taxId,
      address: settings.address,
      phone: settings.phone,
      taxRate: settings.taxRate,
    }));
  }

  async function openQuote(quote: QuoteRow) {
    setLoadingQuoteId(quote.id);
    setNotice("");
    try {
      const result = await loadPersistedQuoteDraft(quote.id);
      if (!result.success) {
        setNotice(result.message);
        return;
      }
      setDraft(result.draft.model);
      setDraftVersion(result.draft.version);
      setActiveQuoteId(quote.id);
      setScreen("editor");
    } catch {
      setNotice("No se pudo abrir el borrador por un problema de conexión. Intenta nuevamente.");
    } finally {
      setLoadingQuoteId(null);
    }
  }

  function updateDraft<K extends keyof QuoteDocumentModel>(
    key: K,
    value: QuoteDocumentModel[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateItem(
    itemId: string,
    key: keyof QuoteDocumentItem,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function moveItem(itemId: string, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.items.findIndex((item) => item.id === itemId);
      const destination = index + direction;
      if (destination < 0 || destination >= current.items.length) return current;
      const items = [...current.items];
      [items[index], items[destination]] = [items[destination], items[index]];
      return { ...current, items };
    });
  }

  async function saveDraft() {
    if (!getTotals(draft)) {
      setNotice("Revisa las cantidades y los precios: deben ser números válidos y la cantidad mayor que cero.");
      return;
    }
    setIsSaving(true);
    setNotice("");
    try {
      const result = await savePersistedQuoteDraft({
        id: activeQuoteId ?? undefined,
        expectedVersion: draftVersion ?? undefined,
        model: draft,
      });
      if (!result.success) {
        setNotice(result.message);
        return;
      }

      setDraftVersion(result.version);
      const row = toQuoteRow(result.summary);
      setQuotes((current) => [
        row,
        ...current.filter((quote) => quote.id !== row.id),
      ]);
      setActiveQuoteId(result.summary.id);
      setNotice(result.message);
    } catch {
      setNotice("No se pudo guardar el borrador por un problema de conexión. Tus cambios siguen en pantalla; intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  }

  function setNavigation(next: Screen) {
    setScreen(next);
    setActiveQuoteId(null);
    setNotice("");
  }

  return (
    <WorkspaceLayout
      userName={userName}
      companyName={companySettings.tradeName}
      quoteCount={quotes.length}
      screen={screen}
      notice={notice}
      onNavigate={setNavigation}
      onHelp={() => setNotice("La ayuda estará disponible al completar la configuración del sistema.")}
      onDismissNotice={() => setNotice("")}
    >
          {screen === "quotes" && (
            <QuotesScreen
              quotes={filteredQuotes}
              allQuotes={quotes}
              search={search}
              statusFilter={statusFilter}
              loadingQuoteId={loadingQuoteId}
              onSearch={setSearch}
              onStatusFilter={setStatusFilter}
              onCreate={startDraft}
              onOpen={openQuote}
            />
          )}
          {screen === "editor" && (
            <EditorScreen
              model={draft}
              title={activeQuoteId ? "Editar borrador" : "Nueva cotización"}
              isSaving={isSaving}
              mobilePreview={mobilePreview}
              onBack={showQuotes}
              onSave={() => void saveDraft()}
              onMobilePreview={setMobilePreview}
              onChange={updateDraft}
              onChangeItem={updateItem}
              onAddItem={() => updateDraft("items", [...draft.items, createEmptyItem()])}
              onRemoveItem={(itemId) => updateDraft("items", draft.items.filter((item) => item.id !== itemId))}
              onMoveItem={moveItem}
              customers={customers}
              onSelectCustomer={(customerId) => {
                const customer = customers.find(
                  (item) => item.id === customerId && item.isActive,
                );
                updateDraft("customer", customer
                  ? {
                      id: customer.id,
                      name: customer.name,
                      taxId: customer.documentNumber ?? "",
                      address: customer.address,
                      contact: customer.contactName,
                    }
                  : { id: null, name: "", taxId: "", address: "", contact: "" });
              }}
            />
          )}
          {screen === "detail" && activeQuote && (
            <QuoteDetail quote={activeQuote} onBack={showQuotes} onEdit={startDraft} />
          )}
          {screen === "customers" && <CustomersScreen customers={customers} onCustomersChange={setCustomers} />}
          {screen === "settings" && <SettingsScreen settings={companySettings} canEdit={userRole === "admin"} onSaved={updateCompanySettings} />}
    </WorkspaceLayout>
  );
}
