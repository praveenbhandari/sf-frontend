import { Download } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Same-origin download of the contact's vCard. The href hits a Next.js route
 * that proxies the FastAPI attachment, so this works with JS disabled and the
 * browser never talks to the API origin.
 */
export default function DownloadVCardButton({
  contactId,
}: {
  contactId: number;
}) {
  return (
    <a href={`/contacts/${contactId}/vcard`} className={buttonClasses("secondary")}>
      <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      Download vCard
    </a>
  );
}
