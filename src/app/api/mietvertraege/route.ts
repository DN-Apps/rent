import { NextRequest } from "next/server";
import { createItem } from "@directus/sdk";
import { directus } from "@/lib/directus";
import { parseAndValidateJson } from "@/lib/api-validation";
import { apiError, apiSuccess } from "@/lib/api-response";
import { mietvertragApiSchema } from "@/utils/validation";
import { generateVertragstext } from "@/lib/ai-assist";


export async function POST(req: NextRequest) {
  const parsed = await parseAndValidateJson(
    req,
    mietvertragApiSchema,
    "Invalid contract data",
  );

  if (!parsed.success) {
    return apiError(parsed.error, parsed.status);
  }

  const payload = parsed.data;

  try {
    const generated = await generateVertragstext(payload);

    const created = await directus.request(
      createItem("mietvertraege", {
        tenant_id: payload.tenant_id,
        vermieter_name: payload.vermieter_name,
        vermieter_adresse: payload.vermieter_adresse,
        mieter_name: payload.mieter_name,
        mieter_adresse: payload.mieter_adresse,
        mietobjekt_adresse: payload.mietobjekt_adresse,
        miethoehe_cent: payload.miethoehe_cent,
        wohnflaeche_qm: payload.wohnflaeche_qm,
        nebenkosten_cent: payload.nebenkosten_cent,
        kaution_cent: payload.kaution_cent,
        vertragstyp: payload.vertragstyp,
        befristungsgrund: payload.befristungsgrund || null,
        hauptmieter_name: payload.hauptmieter_name || null,
        vermieter_zustimmung: payload.vermieter_zustimmung,
        mietbeginn: payload.mietbeginn,
        laufzeit_monate: payload.laufzeit_monate,
        status: payload.status ?? "DRAFT",
        vertragstext: generated.text,
        prompt_version: generated.promptVersion,
      }),
    );

    return apiSuccess({
      id: created?.id ?? null,
      tenant_id: payload.tenant_id,
      vermieter_name: payload.vermieter_name,
      vermieter_adresse: payload.vermieter_adresse,
      mieter_name: payload.mieter_name,
      mieter_adresse: payload.mieter_adresse,
      mietobjekt_adresse: payload.mietobjekt_adresse,
      miethoehe_cent: payload.miethoehe_cent,
      wohnflaeche_qm: payload.wohnflaeche_qm,
      nebenkosten_cent: payload.nebenkosten_cent,
      kaution_cent: payload.kaution_cent,
      vertragstyp: payload.vertragstyp,
      befristungsgrund: payload.befristungsgrund || null,
      hauptmieter_name: payload.hauptmieter_name || null,
      vermieter_zustimmung: payload.vermieter_zustimmung,
      mietbeginn: payload.mietbeginn,
      laufzeit_monate: payload.laufzeit_monate,
      status: payload.status ?? "DRAFT",
      vertragstext: generated.text,
      prompt_version: generated.promptVersion,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Contract could not be saved";

    return apiError(message, 500);
  }
}