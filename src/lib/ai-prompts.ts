import { readItems } from "@directus/sdk";
import { directus } from "@/lib/directus";
import type { MietvertragApiData } from "@/utils/validation";

export const requiredContractHeadings = [
  "1. Entwurfshinweis",
  "2. Vertragsparteien",
  "3. Mietobjekt und Wohnfläche",
  "4. Vertragsart",
  "5. Mietbeginn und Laufzeit",
  "6. Mietzins, Betriebskosten und Gesamtzahlung",
  "7. Kaution",
  "8. Fälligkeit und Zahlungsweise",
  "9. Gebrauch und Pflichten des Mieters",
  "10. Instandhaltung, Schäden und Veränderungen",
  "11. Untervermietung und sonstige Nutzung",
  "12. Kündigung und Vertragsende",
  "13. Übergabe und Schlüssel",
  "14. Hausordnung und sonstige Vereinbarungen",
  "15. Schlussbestimmungen und Unterschriften",
] as const;

export type ActivePrompt = {
  prompt: string;
  version: number;
};

export async function getActiveVertragPrompt(): Promise<ActivePrompt | null> {
  try {
    const templates = await directus.request(
      readItems("ai_prompt_templates", {
        filter: {
          prompt_key: { _eq: "mietvertrag_entwurf" },
          active: { _eq: true },
        },
        sort: ["-version"],
        limit: 1,
        fetchOptions: { cache: "no-store" },
      }),
    );

    const template = templates[0];
    if (!template?.system_prompt?.trim()) {
      return null;
    }

    return {
      prompt: template.system_prompt.trim(),
      version: template.version,
    };
  } catch {
    return null;
  }
}

const localPromptInstructions = `
Du erstellst einen strukturierten Mietvertragsentwurf auf Deutsch.

WICHTIGE GRENZEN:
- Der Text ist ausschließlich ein Entwurf und keine Rechtsberatung.
- Erfinde niemals Namen, Adressen, Beträge, Fristen oder rechtliche Tatsachen.
- Wenn eine Information nicht in den Eingabedaten enthalten ist, schreibe exakt:
  [NOCH ZU ERGÄNZEN UND RECHTLICH ZU PRÜFEN]
- Verwende die Eingabedaten exakt und widersprich ihnen nicht.
- Formuliere keine Behauptung, dass der Entwurf rechtlich wirksam oder vollständig ist.

ERSTELLE DIESE ABSCHNITTE MIT ÜBERSCHRIFTEN:
${requiredContractHeadings.join("\n")}

ANFORDERUNGEN AN DIE AUSGABE:
- Schreibe pro Abschnitt mindestens einen vollständigen Absatz.
- Nutze die vorhandenen Daten sichtbar in den passenden Abschnitten.
- Markiere fehlende Angaben mit dem vorgegebenen Platzhalter, statt sie wegzulassen.
- Bei STAFFEL: Weise ausdrücklich darauf hin, dass Staffeldaten und Zeitpunkte fehlen.
- Bei INDEX: Weise ausdrücklich auf die noch zu ergänzende Indexvereinbarung hin.
- Bei BEFRISTET: Verwende den angegebenen Befristungsgrund und weise auf dessen rechtliche Prüfung hin.
- Bei UNTERMIETE: Nenne Hauptmieter und Zustimmungsstatus.
- Gib ausschließlich den Vertragstext zurück, ohne Vorbemerkung außerhalb des Dokuments.
`;

export function buildVertragstextPrompt(
  data: MietvertragApiData,
  instructions = localPromptInstructions,
): string {
  return `${instructions}

EINGABEDATEN:
Vermieter: ${data.vermieter_name}
Anschrift des Vermieters: ${data.vermieter_adresse}
Mieter: ${data.mieter_name}
Anschrift des Mieters: ${data.mieter_adresse}
Mietobjekt: ${data.mietobjekt_adresse}
Vertragsart: ${data.vertragstyp}
Befristungsgrund: ${data.befristungsgrund || "nicht angegeben"}
Hauptmieter: ${data.hauptmieter_name || "nicht angegeben"}
Vermieterzustimmung zur Untervermietung: ${data.vermieter_zustimmung ? "ja" : "nein"}
Wohnfläche: ${data.wohnflaeche_qm.toFixed(2)} qm
Nettokaltmiete: ${(data.miethoehe_cent / 100).toFixed(2)} EUR
Betriebskosten: ${(data.nebenkosten_cent / 100).toFixed(2)} EUR
Kaution: ${(data.kaution_cent / 100).toFixed(2)} EUR
Mietbeginn: ${data.mietbeginn}
Laufzeit: ${data.laufzeit_monate} Monate
`;
}
