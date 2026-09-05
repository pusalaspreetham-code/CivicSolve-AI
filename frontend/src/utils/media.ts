/**
 * BUGFIX (#9): `reports.image_path` used to contain a raw filesystem
 * path written by the AI pipeline (e.g. "C:\...\uploads\abc.jpg" on
 * Windows), which no browser can ever load in an <img> tag. The
 * pipeline now stores a relative, web-usable path like
 * "/uploads/abc.jpg", and the Node backend proxies that path through
 * to the AI pipeline's static file server (see backend/src/app.ts).
 *
 * This helper turns that relative path into a full, loadable URL,
 * regardless of whether VITE_API_URL includes a trailing "/api".
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export function getEvidenceImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;

  // Already a full URL (e.g. an old absolute record, or http(s) link).
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  // Legacy rows may still contain a raw OS filesystem path from before
  // this fix — there's nothing we can serve for those.
  if (/^[A-Za-z]:\\/.test(imagePath) || imagePath.includes("\\")) return null;

  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${API_ORIGIN}${path}`;
}
