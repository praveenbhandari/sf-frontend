import {
  CONTACT_FIELDS,
  PHOTO_MAX_BYTES,
  contactInputSchema,
  formDataToValues,
  zodFieldErrors,
} from "@/lib/contacts/schema";
import { decodedPhotoBytes } from "@/lib/contacts/photo";

function pngDataUrl(byteLength: number): string {
  const bytes = Buffer.alloc(byteLength);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

function values(overrides: Record<string, string> = {}) {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    company: "",
    job_title: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    photo: "",
    notes: "",
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("trims what the user typed", () => {
    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires the three fields the API requires", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
  });

  it("rejects a malformed email", () => {
    const result = contactInputSchema.safeParse(values({ email: "not-an-email" }));
    expect(zodFieldErrors(result.error!).email).toBe("Enter a valid email address");
  });

  it("enforces the API's length limits", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: "a".repeat(101), postal_code: "9".repeat(21) }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
      postal_code: "Postal code must be 20 characters or fewer",
    });
  });

  it("accepts a supported photo data URL and nulls a blank one", () => {
    const photo = "data:image/png;base64,iVBORw0KGgo=";

    expect(contactInputSchema.parse(values({ photo })).photo).toBe(photo);
    expect(contactInputSchema.parse(values()).photo).toBeNull();
  });

  it("rejects a photo that is not a supported image data URL", () => {
    const result = contactInputSchema.safeParse(
      values({ photo: "data:image/gif;base64,R0lGODlh" }),
    );

    expect(zodFieldErrors(result.error!).photo).toBe(
      "Photo must be a PNG, JPEG, or WebP image",
    );
  });

  it("rejects a photo larger than the API's 512 KB decoded cap", () => {
    const oversized = pngDataUrl(PHOTO_MAX_BYTES + 1);
    const result = contactInputSchema.safeParse(values({ photo: oversized }));

    expect(decodedPhotoBytes(oversized)).toBe(PHOTO_MAX_BYTES + 1);
    expect(zodFieldErrors(result.error!).photo).toBe(
      "Photo must be 512 KB or smaller",
    );
  });

  it("accepts a photo at the API's 512 KB decoded cap and rejects one byte over", () => {
    const atCap = pngDataUrl(PHOTO_MAX_BYTES);
    const overCap = pngDataUrl(PHOTO_MAX_BYTES + 1);

    expect(decodedPhotoBytes(atCap)).toBe(PHOTO_MAX_BYTES);
    expect(decodedPhotoBytes(overCap)).toBe(PHOTO_MAX_BYTES + 1);
    // Same encoded length, so a character-count check cannot tell these apart.
    expect(atCap.slice(atCap.indexOf(",") + 1).length).toBe(
      overCap.slice(overCap.indexOf(",") + 1).length,
    );

    expect(contactInputSchema.parse(values({ photo: atCap })).photo).toBe(atCap);
    expect(zodFieldErrors(contactInputSchema.safeParse(values({ photo: overCap })).error!).photo).toBe(
      "Photo must be 512 KB or smaller",
    );
  });
});

describe("formDataToValues", () => {
  it("pulls every known field out, defaulting to an empty string", () => {
    const formData = new FormData();
    formData.set("first_name", "Grace");
    formData.set("email", "grace@example.com");
    formData.set("ignored", "nope");

    const extracted = formDataToValues(formData);

    expect(extracted.first_name).toBe("Grace");
    expect(extracted.last_name).toBe("");
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "photo"].sort(),
    );
  });
});
