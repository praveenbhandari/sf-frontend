import {
  CONTACT_FIELDS,
  contactInputSchema,
  formDataToValues,
  zodFieldErrors,
} from "@/lib/contacts/schema";

function values(overrides: Record<string, string> = {}) {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    company: "",
    job_title: "",
    photo: "",
    notes: "",
    addresses: "[]",
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
      values({ first_name: "a".repeat(101), company: "b".repeat(201) }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
      company: "Company must be 200 characters or fewer",
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

  it("parses the addresses JSON the form submits", () => {
    const addresses = JSON.stringify([
      { type: "Work", street: "1 Market St", city: "San Francisco" },
    ]);

    expect(contactInputSchema.parse(values({ addresses })).addresses).toEqual([
      {
        type: "Work",
        street: "1 Market St",
        city: "San Francisco",
        state: null,
        postal_code: null,
        country: null,
      },
    ]);
  });

  it("rejects an address type the API does not accept", () => {
    const result = contactInputSchema.safeParse(
      values({ addresses: JSON.stringify([{ type: "Office" }]) }),
    );

    expect(result.success).toBe(false);
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
      [...CONTACT_FIELDS.map((field) => field.name), "photo", "addresses"].sort(),
    );
  });
});
