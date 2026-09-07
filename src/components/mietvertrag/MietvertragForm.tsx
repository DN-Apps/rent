"use client";

import { useState, type FormEvent } from "react";

type MietvertragResult = {
  id: string | number | null;
  status: string;
  vertragstext: string | null;
};

type FormState = {
  vermieter_name: string;
  vermieter_adresse: string;
  mieter_name: string;
  mieter_adresse: string;
  mietobjekt_adresse: string;
  miethoehe_euro: string;
  wohnflaeche_qm: string;
  nebenkosten_euro: string;
  kaution_euro: string;
  vertragstyp: "UNBEFRISTET" | "BEFRISTET" | "STAFFEL" | "INDEX" | "UNTERMIETE";
  befristungsgrund: string;
  hauptmieter_name: string;
  vermieter_zustimmung: boolean;
  mietbeginn: string;
  laufzeit_monate: string;
};

const initialForm: FormState = {
  vermieter_name: "",
  vermieter_adresse: "",
  mieter_name: "",
  mieter_adresse: "",
  mietobjekt_adresse: "",
  miethoehe_euro: "",
  wohnflaeche_qm: "",
  nebenkosten_euro: "",
  kaution_euro: "",
  vertragstyp: "UNBEFRISTET",
  befristungsgrund: "",
  hauptmieter_name: "",
  vermieter_zustimmung: false,
  mietbeginn: "",
  laufzeit_monate: "",
};

export default function MietvertragForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<MietvertragResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/mietvertraege", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "tenant-001",
          vermieter_name: form.vermieter_name,
          vermieter_adresse: form.vermieter_adresse,
          mieter_name: form.mieter_name,
          mieter_adresse: form.mieter_adresse,
          mietobjekt_adresse: form.mietobjekt_adresse,
          miethoehe_cent: Math.round(Number(form.miethoehe_euro) * 100),
          wohnflaeche_qm: Number(form.wohnflaeche_qm),
          nebenkosten_cent: Math.round(Number(form.nebenkosten_euro) * 100),
          kaution_cent: Math.round(Number(form.kaution_euro) * 100),
          vertragstyp: form.vertragstyp,
          befristungsgrund: form.befristungsgrund,
          hauptmieter_name: form.hauptmieter_name,
          vermieter_zustimmung: form.vermieter_zustimmung,
          mietbeginn: form.mietbeginn,
          laufzeit_monate: Number(form.laufzeit_monate),
          status: "DRAFT",
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        id?: string | number | null;
        status?: string;
        vertragstext?: string | null;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Der Vertrag konnte nicht erstellt werden.");
      }

      setResult({
        id: data.id ?? null,
        status: data.status ?? "DRAFT",
        vertragstext: data.vertragstext ?? null,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Der Vertrag konnte nicht erstellt werden.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Vertragsdaten</h2>
          <p className="mt-1 text-sm text-zinc-500">Alle Angaben werden als Entwurf gespeichert.</p>
        </div>

        <label className="block text-sm font-medium text-zinc-700">
          Vermieter
          <input
            required
            value={form.vermieter_name}
            onChange={(event) => updateField("vermieter_name", event.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Adresse des Vermieters
          <input
            required
            value={form.vermieter_adresse}
            onChange={(event) => updateField("vermieter_adresse", event.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Mieter
          <input
            required
            value={form.mieter_name}
            onChange={(event) => updateField("mieter_name", event.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Adresse des Mieters
          <input
            required
            value={form.mieter_adresse}
            onChange={(event) => updateField("mieter_adresse", event.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Mietobjekt-Adresse
          <textarea
            required
            rows={3}
            value={form.mietobjekt_adresse}
            onChange={(event) => updateField("mietobjekt_adresse", event.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Vertragsart
          <select
            required
            value={form.vertragstyp}
            onChange={(event) =>
              updateField("vertragstyp", event.target.value as FormState["vertragstyp"])
            }
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 font-normal"
          >
            <option value="UNBEFRISTET">Unbefristeter Mietvertrag</option>
            <option value="BEFRISTET">Befristeter Mietvertrag</option>
            <option value="STAFFEL">Staffelmietvertrag</option>
            <option value="INDEX">Indexmietvertrag</option>
            <option value="UNTERMIETE">Untermietvertrag</option>
          </select>
        </label>

        {form.vertragstyp === "BEFRISTET" && (
          <label className="block text-sm font-medium text-zinc-700">
            Befristungsgrund
            <textarea
              required
              rows={3}
              value={form.befristungsgrund}
              onChange={(event) => updateField("befristungsgrund", event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
            />
          </label>
        )}

        {form.vertragstyp === "UNTERMIETE" && (
          <>
            <label className="block text-sm font-medium text-zinc-700">
              Name des Hauptmieters
              <input
                required
                value={form.hauptmieter_name}
                onChange={(event) => updateField("hauptmieter_name", event.target.value)}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
              />
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={form.vermieter_zustimmung}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    vermieter_zustimmung: event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              Zustimmung des Vermieters liegt vor
            </label>
          </>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700">
            Monatliche Miete in EUR
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.miethoehe_euro}
              onChange={(event) => updateField("miethoehe_euro", event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Wohnflaeche in qm
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={form.wohnflaeche_qm}
              onChange={(event) => updateField("wohnflaeche_qm", event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Nebenkosten in EUR
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.nebenkosten_euro}
              onChange={(event) => updateField("nebenkosten_euro", event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Kaution in EUR
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.kaution_euro}
              onChange={(event) => updateField("kaution_euro", event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Mietbeginn
            <input
              required
              type="date"
              value={form.mietbeginn}
              onChange={(event) => updateField("mietbeginn", event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-zinc-700">
          Laufzeit in Monaten
          <input
            required
            min="1"
            step="1"
            type="number"
            value={form.laufzeit_monate}
            onChange={(event) => updateField("laufzeit_monate", event.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal"
          />
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        {isSubmitting && (
          <div
            aria-live="polite"
            className="rounded border border-zinc-200 bg-zinc-50 p-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"
              />
              <span>Der Mietvertragsentwurf wird gerade generiert ...</span>
            </div>
            <div
              aria-hidden="true"
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200"
            >
              <div className="h-full w-2/5 animate-pulse rounded-full bg-zinc-900" />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Die Anfrage wird geprüft, der Entwurf erstellt und anschließend gespeichert.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Entwurf wird erstellt ..." : "Mietvertragsentwurf erstellen"}
        </button>
      </form>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="text-xl font-semibold text-zinc-900">Ergebnis</h2>
        {!result ? (
          <p className="mt-3 text-sm text-zinc-500">Der generierte Entwurf erscheint hier.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-zinc-600">
              Gespeichert als Entwurf, ID: <strong>{result.id ?? "nicht verfügbar"}</strong>
            </p>
            <pre className="mt-5 max-h-[34rem] overflow-auto whitespace-pre-wrap rounded border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-800">
              {result.vertragstext}
            </pre>
            {result.id !== null && (
              <a
                href={`/api/mietvertraege/${result.id}/export`}
                download
                className="mt-4 inline-flex rounded bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                DOCX herunterladen
              </a>
            )}
          </>
        )}
      </section>
    </div>
  );
}
