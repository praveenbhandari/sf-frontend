import { NextResponse } from "next/server";
import { ApiUnreachableError } from "@/lib/apiClient";
import { fetchContactVCard } from "@/lib/contacts/api";

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = parseId((await context.params).id);
  if (id == null) {
    return NextResponse.json({ detail: "Contact not found" }, { status: 404 });
  }

  try {
    const upstream = await fetchContactVCard(id);
    const headers = new Headers();
    const contentType = upstream.headers.get("Content-Type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    } else if (upstream.ok) {
      headers.set("Content-Type", "text/vcard; charset=utf-8");
    }

    const disposition = upstream.headers.get("Content-Disposition");
    if (disposition) {
      headers.set("Content-Disposition", disposition);
    } else if (upstream.ok) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="contact-${id}.vcf"`,
      );
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    if (error instanceof ApiUnreachableError) {
      return NextResponse.json({ detail: error.message }, { status: 502 });
    }
    throw error;
  }
}
