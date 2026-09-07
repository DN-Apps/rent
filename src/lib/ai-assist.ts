import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import type { MietvertragApiData } from "@/utils/validation";
import {
  buildVertragstextPrompt,
  getMissingContractDetails,
  getActiveVertragPrompt,
  missingDetailPlaceholder,
  requiredContractHeadings,
} from "@/lib/ai-prompts";

export type GeneratedVertragstext = {
  text: string;
  promptVersion: number;
  source: "mock" | "gemini" | "anthropic" | "local-fallback";
};

function isGeminiUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /503|unavailable|high demand|overloaded|temporarily/i.test(message);
}

function isCompleteContractDraft(
  text: string,
  data: MietvertragApiData,
): boolean {
  const headingCount = requiredContractHeadings.filter((heading) =>
    text.includes(heading),
  ).length;
  const requiredValuesPresent = [
    data.vermieter_name,
    data.mieter_name,
    data.mietobjekt_adresse,
    data.mietbeginn,
  ].every((value) => text.includes(value));
  const missingDetailsMarked = getMissingContractDetails(data).every((detail) =>
    text.includes(detail.label) && text.includes(missingDetailPlaceholder),
  );

  return (
    text.length >= 1800 &&
    headingCount >= 12 &&
    requiredValuesPresent &&
    missingDetailsMarked
  );
}

function generateMockVertragstext(data: MietvertragApiData): string {
  const rentInEuros = (data.miethoehe_cent / 100).toFixed(2);
  const additionalCostsInEuros = (data.nebenkosten_cent / 100).toFixed(2);
  const depositInEuros = (data.kaution_cent / 100).toFixed(2);
  const totalInEuros = (
    (data.miethoehe_cent + data.nebenkosten_cent) /
    100
  ).toFixed(2);
  const contractTypeText = {
    UNBEFRISTET: "Unbefristeter Mietvertrag",
    BEFRISTET: "Befristeter Mietvertrag",
    STAFFEL: "Staffelmietvertrag",
    INDEX: "Indexmietvertrag",
    UNTERMIETE: "Untermietvertrag",
  }[data.vertragstyp];

  const contractTypeDetails = {
    UNBEFRISTET:
      "Das Mietverhaeltnis wird auf unbestimmte Zeit geschlossen und endet durch Kuendigung nach den gesetzlichen Vorschriften.",
    BEFRISTET: `Das Mietverhaeltnis wird befristet geschlossen. Als Befristungsgrund ist angegeben: ${data.befristungsgrund}. Die rechtlichen Voraussetzungen der Befristung sind vor Verwendung zu pruefen.`,
    STAFFEL:
      "Die konkreten Staffelbeträge und Zeitpunkte sind vor Unterzeichnung zu ergänzen und rechtlich zu prüfen.",
    INDEX:
      "Die konkrete Indexvereinbarung und die Bezugnahme auf den Verbraucherpreisindex sind vor Unterzeichnung zu ergänzen und rechtlich zu prüfen.",
    UNTERMIETE: `Dies ist ein Untermietvertrag. Hauptmieter: ${data.hauptmieter_name}. Zustimmung des Vermieters liegt laut Eingabe vor: ${data.vermieter_zustimmung ? "ja" : "nein"}.`,
  }[data.vertragstyp];
  const missingDetails = getMissingContractDetails(data)
    .map((detail) => `- ${detail.label}: ${missingDetailPlaceholder}`)
    .join("\n");

  return `ENTWURF - keine Rechtsberatung

MIETVERTRAG

1. Vertragsparteien
Vertragsart: ${contractTypeText}
Vermieter: ${data.vermieter_name}
Anschrift des Vermieters: ${data.vermieter_adresse}
Mieter: ${data.mieter_name}
Anschrift des Mieters: ${data.mieter_adresse}

2. Mietobjekt
Das Mietobjekt befindet sich in ${data.mietobjekt_adresse}.
Die Wohnflaeche betraegt ${data.wohnflaeche_qm.toFixed(2)} qm.

3. Mietzins und Betriebskosten
Die monatliche Nettokaltmiete betraegt ${rentInEuros} EUR.
Die monatlichen Betriebskosten betragen ${additionalCostsInEuros} EUR.
Die monatliche Gesamtzahlung betraegt ${totalInEuros} EUR.

4. Kaution
Die vereinbarte Kaution betraegt ${depositInEuros} EUR.

5. Mietbeginn und Laufzeit
Das Mietverhaeltnis beginnt am ${data.mietbeginn} und hat eine Laufzeit von ${data.laufzeit_monate} Monaten.

6. Vertragsartspezifische Regelungen
${contractTypeDetails}

7. Nutzung und Sorgfalt
Das Mietobjekt ist pfleglich zu behandeln und ausschliesslich im vereinbarten Rahmen zu nutzen. Veraenderungen am Mietobjekt beduerfen der vorherigen Abstimmung mit dem Vermieter.

8. Kuendigung und Vertragsende
Die Kuendigung und die Abwicklung des Vertragsendes richten sich nach den gesetzlichen Vorschriften und den noch zu ergaenzenden Vereinbarungen der Vertragsparteien.

9. Uebergabe und sonstige Vereinbarungen
Uebergabedatum, Schluesselanzahl, Hausordnung und weitere Zusatzvereinbarungen sind vor Unterzeichnung zu ergaenzen.

10. Offene Angaben
${missingDetails}

Dieser automatisch erzeugte Text ist ein technischer Entwurf und muss vor einer Verwendung vollstaendig geprueft und rechtlich bewertet werden.`;
}

export async function generateVertragstext(
  data: MietvertragApiData,
): Promise<GeneratedVertragstext> {
  const mode = process.env.AI_ASSIST_MODE ?? "mock";

  if (mode === "mock") {
    return {
      text: generateMockVertragstext(data),
      promptVersion: 0,
      source: "mock",
    };
  }

  const activePrompt = await getActiveVertragPrompt();
  const prompt = buildVertragstextPrompt(data, activePrompt?.prompt);
  const promptVersion = activePrompt?.version ?? 0;

  if (mode === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    try {
      const gemini = new GoogleGenAI({ apiKey });
      const response = await gemini.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 3000,
          temperature: 0.2,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error("Gemini returned an empty contract draft");
      }

      if (!isCompleteContractDraft(text, data)) {
        const retryResponse = await gemini.models.generateContent({
          model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
          contents: `${prompt}

DEIN ERSTER ENTWURF WAR ZU KURZ ODER UNVOLLSTAENDIG. ERSTELLE IHN ERNEUT.
Verwende jede der folgenden 15 Überschriften wortgleich und in dieser Reihenfolge:
${requiredContractHeadings.join("\n")}
Schreibe unter jede Überschrift mindestens einen vollständigen Absatz.
Die fertige Ausgabe muss mindestens 1800 Zeichen enthalten. Gib keine Zusammenfassung aus.`,
          config: {
            maxOutputTokens: 5000,
            temperature: 0.1,
          },
        });

        const retryText = retryResponse.text?.trim();
        if (!retryText || !isCompleteContractDraft(retryText, data)) {
          return {
            text: generateMockVertragstext(data),
            promptVersion,
            source: "local-fallback",
          };
        }

        return { text: retryText, promptVersion, source: "gemini" };
      }

      return { text, promptVersion, source: "gemini" };
    } catch (error) {
      if (isGeminiUnavailable(error)) {
        return {
          text: generateMockVertragstext(data),
          promptVersion,
          source: "local-fallback",
        };
      }

      throw error;
    }
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    typeof msg.content[0] === "object" && "text" in msg.content[0]
      ? msg.content[0].text
      : "";

  return { text: text.trim(), promptVersion, source: "anthropic" };
}