import React from "react";
import { render, screen } from "@testing-library/react";
import DownloadVCardButton from "@/components/contacts/DownloadVCardButton";

describe("DownloadVCardButton", () => {
  it("links to the same-origin vCard proxy", () => {
    render(<DownloadVCardButton contactId={7} />);

    expect(
      screen.getByRole("link", { name: "Download vCard" }),
    ).toHaveAttribute("href", "/contacts/7/vcard");
  });
});
