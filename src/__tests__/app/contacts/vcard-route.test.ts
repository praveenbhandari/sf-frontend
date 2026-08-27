import { http, HttpResponse } from "msw";
import { GET } from "@/app/contacts/[id]/vcard/route";
import { server } from "../../mocks/server";
import { api } from "../../mocks/handlers";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function call(id: string) {
  return GET(new Request(`http://localhost/contacts/${id}/vcard`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /contacts/[id]/vcard", () => {
  it("streams the upstream vCard with Content-Disposition", async () => {
    const res = await call("1");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/text\/vcard/);
    expect(res.headers.get("Content-Disposition")).toContain(".vcf");
    expect(await res.text()).toContain("BEGIN:VCARD");
  });

  it("forwards a 404 from the API", async () => {
    const res = await call("4242");

    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Disposition")).toBeNull();
  });

  it("rejects a non-numeric id without calling the API", async () => {
    const res = await call("not-an-id");
    expect(res.status).toBe(404);
  });

  it("defaults Content-Disposition when the API omits it", async () => {
    server.use(
      http.get(api("/api/v1/contacts/:id/vcard"), () =>
        new HttpResponse("BEGIN:VCARD\r\nEND:VCARD\r\n", {
          headers: { "Content-Type": "text/vcard" },
        }),
      ),
    );

    const res = await call("1");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="contact-1.vcf"',
    );
  });
});
