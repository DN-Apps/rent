import type { MietvertragApiData } from "@/utils/validation";
import { getMissingContractDetails, missingDetailPlaceholder } from "@/lib/ai-prompts";
import {
  createGeminiClient,
  getGeminiModel,
  isGeminiOverloaded,
  isGeminiQuotaExceeded,
} from "@/lib/gemini";

export type ContractReviewResult = {
  valid: boolean;
  issues: string[];
  source: "deterministic" | "gemini";
};

// Checks the values a template can't reliably self-report: presence of core data and required placeholders.
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

  // Case-insensitive: no prompt actually mandates the literal uppercase "ENTWURF" string.
  if (!/entwurf/i.test(vertragstext)) {
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

  // Only escalate to the paid Gemini review when the cheap local check already passed and Gemini is in use.
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
    const gemini = createGeminiClient(apiKey);
    const response = await gemini.models.generateContent({
      model: getGeminiModel(),
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

    // Models sometimes wrap JSON in a markdown code fence despite the plain-JSON instruction.
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    try {
      const parsed = JSON.parse(jsonText) as {
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
      // Review response wasn't parseable JSON: that's a Gemini output problem, not a finding about the
      // contract, so defer to the deterministic result instead of blocking the save.
      return deterministicReview;
    }
  } catch (error) {
    // Gemini review unavailable or over quota: don't block saving, defer to the deterministic result.
    if (isGeminiOverloaded(error) || isGeminiQuotaExceeded(error)) {
      return deterministicReview;
    }

    throw error;
  }
}
