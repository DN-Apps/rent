import type { NextRequest } from "next/server";
import type { ZodType } from "zod";

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  error: string;
  status: number;
};

export async function parseAndValidateJson<T>(
  req: NextRequest,
  schema: ZodType<T>,
  invalidMessage: string,
): Promise<ParseSuccess<T> | ParseFailure> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    // Ungueltiges JSON von Schema-Validierungsfehlern unterscheiden.
    return {
      success: false,
      error: "Invalid JSON",
      status: 400,
    };
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    // Erstes Schema-Problem zurueckgeben, damit API-Feedback fuer Clients kompakt bleibt.
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? invalidMessage,
      status: 422,
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
