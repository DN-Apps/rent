import { NextResponse } from "next/server";

type ApiSuccessPayload = Record<string, unknown>;

// Zentrales Success-Format fuer alle API-Routen.
export function apiSuccess(payload: ApiSuccessPayload = {}, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...payload,
    },
    { status },
  );
}

// Zentrales Error-Format fuer konsistente Client-Behandlung.
export function apiError(error: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status },
  );
}
