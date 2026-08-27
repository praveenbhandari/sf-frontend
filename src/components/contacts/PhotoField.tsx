"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_EDGE = 512;

/** Downscale to at most 512px and re-encode as JPEG so uploads stay tiny. */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Photo picker for the contact form. The chosen image is downscaled client-side
 * and submitted as a base64 data URL through a hidden input, so the server
 * action reads it like any other field.
 */
export default function PhotoField({ defaultValue = "" }: { defaultValue?: string }) {
  const [photo, setPhoto] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }

    try {
      setPhoto(await fileToDataUrl(file));
      setError(null);
    } catch {
      setError("That file could not be read as an image.");
    }
  }

  function removePhoto() {
    setPhoto("");
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-foreground">
        Photo
        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
          optional
        </span>
      </span>

      <div className="flex items-center gap-4">
        {photo ? (
          <img
            src={photo}
            alt="Photo preview"
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
            <ImagePlus className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            {photo ? "Change photo" : "Upload photo"}
          </Button>
          {photo ? (
            <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
              <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onFileChange}
        className="sr-only"
        aria-label="Choose photo"
      />
      <input type="hidden" name="photo" value={photo} />

      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
