import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QuoteWorkspace } from "@/features/quotes/components/quote-workspace";
import { listQuoteDrafts } from "@/features/quotes/server/quote-draft.service";
import { getAuth } from "@/lib/auth/auth";
import { getPrismaClient } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || !session.user.isActive) redirect("/login");
  if (session.user.mustChangePassword) redirect("/change-password");

  const [drafts, company, customers] = await Promise.all([
    listQuoteDrafts(),
    getPrismaClient().companySettings.findUnique({
      where: { id: "main" },
      include: { bankAccounts: { where: { isActive: true }, orderBy: { position: "asc" } } },
    }),
    getPrismaClient().customer.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { quoteDrafts: true } } },
    }),
  ]);
  if (!company) throw new Error("Falta la configuración inicial de la empresa. Ejecuta el seed bootstrap.");

  const initialCompany = {
    name: company.legalName || company.tradeName,
    taxId: company.taxId,
    address: company.address,
    phone: company.phone,
    taxRate: company.taxRate.toString(),
    bankDetails: company.bankAccounts
      .map((account) => `${account.bankName}: ${account.accountNumber}`)
      .join("\n"),
  };
  const initialSettings = {
    tradeName: company.tradeName,
    legalName: company.legalName,
    taxId: company.taxId,
    address: company.address,
    phone: company.phone,
    email: company.email ?? "",
    taxRate: company.taxRate.toString(),
    defaultValidityDays: company.defaultValidityDays,
  };
  const initialCustomers = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    documentType: customer.documentType,
    documentNumber: customer.documentNumber,
    address: customer.address,
    contactName: customer.contactName,
    email: customer.email,
    phone: customer.phone,
    quoteCount: customer._count.quoteDrafts,
    isActive: customer.isActive,
  }));
  return (
    <QuoteWorkspace
      userName={session.user.name}
      userRole={session.user.role ?? "cotizador"}
      initialQuotes={drafts}
      initialCompany={initialCompany}
      initialSettings={initialSettings}
      initialCustomers={initialCustomers}
    />
  );
}
