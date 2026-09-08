import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

// Model can be swapped via env without touching call sites.
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

// Every Gemini call needs a key, so fail fast with one clear error instead of a generic SDK error.
export function requireGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return apiKey;
}

export function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const overloadedPattern = /503|unavailable|high demand|overloaded|temporarily/i;
const quotaPattern = /429|RESOURCE_EXHAUSTED|quota|current quota/i;

// Temporary overload/outage: a retry shortly after usually succeeds.
export function isGeminiOverloaded(error: unknown): boolean {
  return overloadedPattern.test(messageOf(error));
}

// Free-tier or billing quota exhausted: retrying immediately will not help.
export function isGeminiQuotaExceeded(error: unknown): boolean {
  return quotaPattern.test(messageOf(error));
}
