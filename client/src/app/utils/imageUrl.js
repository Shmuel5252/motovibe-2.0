const IMG_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:5000";

/**
 * imgSrc — פותר URL מלא לתמונה שמגיעה מהשרת (יחסי או מוחלט).
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function imgSrc(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${IMG_BASE}${url}`;
}
