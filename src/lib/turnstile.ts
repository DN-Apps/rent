export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Bei fehlendem Server-Secret sicherheitshalber fehlschlagen.
    return false;
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
    },
  );

  const data = (await response.json()) as { success: boolean };
  // Nur explizites success=true von Cloudflare akzeptieren.
  return data.success === true;
}
