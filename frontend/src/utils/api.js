/**
 * Single place where the frontend resolves the backend base URL.
 *
 * Default: same origin (empty base) - requests go to /api/... and are proxied
 * to the backend by the Vite dev server (see vite.config.js) or by the reverse
 * proxy in production. This keeps previews, staging and production hosts
 * working without hardcoding localhost, and means no secret ever has to travel
 * through the browser.
 *
 * Set VITE_API_BASE_URL only when the API is genuinely on another origin,
 * e.g. VITE_API_BASE_URL=https://api.hackaware.example
 */
const rawBase = import.meta.env.VITE_API_BASE_URL || "";

export const apiBaseUrl = rawBase.replace(/\/$/, "");

/** Build an absolute or same-origin API URL for a path such as "/api/news". */
export const apiUrl = (path) => `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

export default apiBaseUrl;
