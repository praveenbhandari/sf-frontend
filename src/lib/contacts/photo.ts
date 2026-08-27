/** Matches the API's decoded photo cap (`PHOTO_MAX_BYTES` in sf-backend). */
export const PHOTO_MAX_BYTES = 512 * 1024;

/** Encoded length of a payload that is exactly `PHOTO_MAX_BYTES` (or one byte over). */
export const PHOTO_MAX_ENCODED_CHARS = Math.floor((PHOTO_MAX_BYTES + 2) / 3) * 4;

const PHOTO_PREFIX_MAX_CHARS = "data:image/jpeg;base64,".length;

/** Coarse string cap so a multi-megabyte payload never reaches decoding. */
export const PHOTO_MAX_CHARS = PHOTO_PREFIX_MAX_CHARS + PHOTO_MAX_ENCODED_CHARS;

/** Decoded byte count of a base64 data URL, accounting for `=` padding. */
export function decodedPhotoBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const encoded = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  return Math.floor((encoded.length * 3) / 4) - padding;
}
