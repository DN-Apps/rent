type NominatimResult = {
  address?: { city?: string; town?: string; village?: string };
};

export async function lookupCityByZip(
  zip: string,
  country = "Deutschland",
): Promise<string | null> {
  // Benutzereingaben normalisieren, bevor externe Query-Parameter gebaut werden.
  const normalizedZip = zip.trim();
  const normalizedCountry = country.trim();

  // Leere oder unplausible Werte abfangen, um unnoetige externe Requests zu vermeiden.
  if (!normalizedZip || normalizedZip.length > 12 || !normalizedCountry) {
    return null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("country", normalizedCountry);
  url.searchParams.set("postalcode", normalizedZip);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString());
  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as NominatimResult[];
  const first = result[0];

  // Nominatim liefert je nach Ortstyp city, town oder village.
  return (
    first?.address?.city ??
    first?.address?.town ??
    first?.address?.village ??
    null
  );
}
