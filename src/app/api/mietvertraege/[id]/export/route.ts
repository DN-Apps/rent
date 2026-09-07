import { readItem } from "@directus/sdk";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { directus, type Mietvertrag } from "@/lib/directus";

type ExportRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(
  _request: NextRequest,
  { params }: ExportRouteContext,
) {
  try {
    const mietvertrag = await directus.request(
      readItem("mietvertraege", params.id),
    ) as Mietvertrag;

    if (!mietvertrag?.vertragstext) {
      return apiError("Contract text was not found", 404);
    }

    const children = [
      new Paragraph({
        text: "Mietvertragsentwurf",
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "ENTWURF - keine Rechtsberatung",
            bold: true,
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      ...mietvertrag.vertragstext.split(/\r?\n/).map(
        (line) => new Paragraph({ text: line }),
      ),
    ];

    const document = new Document({
      sections: [{ children }],
    });
    const buffer = await Packer.toBuffer(document);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="mietvertrag-${params.id}-entwurf.docx"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Contract export failed";
    return apiError(message, 500);
  }
}