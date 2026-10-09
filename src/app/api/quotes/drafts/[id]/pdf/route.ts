import "server-only";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { getQuoteDraft } from "@/features/quotes/server/quote-draft.service";
import { getAuth } from "@/lib/auth/auth";
import { logEvent } from "@/lib/logging/logger";
import { reactPdfRenderer } from "@/lib/pdf/renderers/react-pdf-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  let userId: string | null = null;

  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session || !session.user.isActive || session.user.mustChangePassword) {
      return Response.json(
        { message: "Tu sesión venció. Inicia sesión nuevamente." },
        { status: 401 },
      );
    }
    userId = session.user.id;

    const { id } = await params;
    if (!/^c[a-z0-9]{24}$/.test(id)) {
      return Response.json({ message: "No encontramos ese borrador." }, { status: 404 });
    }

    const draft = await getQuoteDraft(id);
    if (!draft) {
      return Response.json({ message: "No encontramos ese borrador." }, { status: 404 });
    }

    const pdf = await reactPdfRenderer.render(draft.model);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="borrador-${id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    logEvent("error", "quote.draft_pdf_failed", {
      requestId,
      userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { message: `No pudimos generar el PDF. Referencia: ${requestId}` },
      { status: 500 },
    );
  }
}
