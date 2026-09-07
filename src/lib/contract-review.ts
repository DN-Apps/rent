import { GoogleGenAI } from "@google/genai";
import type { MietvertragApiData } from "@/utils/validation";
import { getMissingContractDetails, missingDetailPlaceholder } from "@/lib/ai-prompts";

export type ContractReviewResult = {
  valid: boolean;
  issues: string[];
  source: "deterministic" | "gemini";
};

function isGeminiUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|503|unavailable|high demand|overloaded|temporarily/i.test(message);
}

function reviewDeterministically(
  data: MietvertragApiData,
  vertragstext: string,
): ContractReviewResult {
  const issues: string[] = [];
  const requiredValues = [
    ["Vermieter", data.vermieter_name],
    ["Mieter", data.mieter_name],
    ["Mietobjekt", data.mietobjekt_adresse],
    ["Mietbeginn", data.mietbeginn],
  ] as const;

  for (const [label, value] of requiredValues) {
    if (!vertragstext.includes(value)) {
      issues.push(`${label} fehlt im Vertragstext.`);
    }
  }

  for (const detail of getMissingContractDetails(data)) {
    if (
      !vertragstext.includes(detail.label) ||
      !vertragstext.includes(missingDetailPlaceholder)
    ) {
      issues.push(`Offene Angabe nicht markiert: ${detail.label}.`);
    }
  }

  if (!vertragstext.includes("ENTWURF")) {
    issues.push("Der Entwurfshinweis fehlt.");
  }

  return {
    valid: issues.length === 0,
    issues,
    source: "deterministic",
  };
}

export async function reviewVertragstext(
  data: MietvertragApiData,
  vertragstext: string,
): Promise<ContractReviewResult> {
  const deterministicReview = reviewDeterministically(data, vertragstext);

  if (
    !deterministicReview.valid ||
    process.env.AI_ASSIST_MODE !== "gemini"
  ) {
    return deterministicReview;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return deterministicReview;
  }

  try {
    const gemini = new GoogleGenAI({ apiKey });
    const response = await gemini.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
      contents: `
Pruefe den folgenden Mietvertragsentwurf gegen die Eingabedaten.
Antworte ausschließlich als JSON in diesem Format:
{"valid":true,"issues":[]}

Regeln:
- valid=false, wenn zentrale Eingabedaten fehlen oder widersprüchlich sind.
- valid=false, wenn der Text nicht klar als Entwurf gekennzeichnet ist.
- valid=false, wenn offene Angaben nicht sichtbar markiert sind.
- Erfinde keine Korrekturen.

Eingabedaten:
${JSON.stringify(data)}

Vertragstext:
${vertragstext}
`,
      config: {
        maxOutputTokens: 800,
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    const raw = response.text?.trim();
    if (!raw) {
      return deterministicReview;
    }

    try {
      const parsed = JSON.parse(raw) as {
        valid?: boolean;
        issues?: unknown;
      };
      const issues = Array.isArray(parsed.issues)
        ? parsed.issues.filter(
            (issue): issue is string => typeof issue === "string",
          )
        : [];

      return {
        valid: parsed.valid === true && issues.length === 0,
        issues,
        source: "gemini",
      };
    } catch {
      return {
        valid: false,
        issues: ["Die KI-Prüfung lieferte kein gültiges Prüf-JSON."],
        source: "gemini",
      };
    }
  } catch (error) {
    if (isGeminiUnavailable(error)) {
      return deterministicReview;
    }

    throw error;
  }
}
