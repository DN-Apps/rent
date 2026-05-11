import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Alle Pfade matchen, ausser
    // - /api (API-Routen)
    // - /_next (Next.js-Interna)
    // - /_vercel (Vercel-Interna)
    // - /.*\\..*  (Dateien mit Endung, z. B. favicon.ico)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
