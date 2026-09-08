# Mietvertrags-Feature

## Ziel

Das Feature bildet einen vollständigen End-to-End-Workflow für Mietvertragsentwürfe ab:

```text
Formular -> API-Route -> Validierung -> Entwurfserzeugung -> Qualitätsprüfung -> Directus -> DOCX-Export
```

Der erzeugte Text ist ausdrücklich ein technischer Entwurf und keine Rechtsberatung.

## Architektur

### Frontend

Die Seite `/[locale]/mietvertraege` verwendet `MietvertragForm.tsx`.
Das Formular erfasst Vertragsparteien, Adressen, Mietobjekt, Miete, Wohnfläche, Nebenkosten, Kaution, Vertragsart und Laufzeit.
Während der Erstellung zeigt die Oberfläche einen Ladezustand an.

### API

Der Endpoint ist:

```text
POST /api/mietvertraege
```

Der Handler:

1. validiert den JSON-Request mit Zod,
2. erzeugt einen Entwurf,
3. führt die deterministische und optional die KI-Prüfung aus,
4. speichert nur einen erfolgreichen Entwurf in Directus,
5. gibt ID, Prompt-Version und Generierungsquelle zurück.

## Directus-Datenmodell

Die Collection `mietvertraege` enthält die Vertragsdaten und den erzeugten Text.
Wichtige Metadatenfelder:

```text
prompt_version
 generation_source
```

`prompt_version` zeigt die verwendete Directus-Prompt-Version. `0` bedeutet lokaler Prompt oder Mock.

`generation_source` kann unter anderem folgende Werte enthalten:

```text
mock
gemini
anthropic
local-fallback
```

Zusätzlich gibt es die Collection `ai_prompt_templates`:

```text
prompt_key
version
system_prompt
active
model_hint
notes
```

Die Anwendung lädt den höchsten aktiven Datensatz für:

```text
prompt_key = mietvertrag_entwurf
```

Wenn Directus nicht erreichbar ist oder keine aktive Vorlage existiert, wird der lokale Prompt verwendet.

## Vertragsarten

Unterstützte Vertragsarten:

```text
UNBEFRISTET
BEFRISTET
STAFFEL
INDEX
UNTERMIETE
```

Zusatzangaben werden abhängig von der Vertragsart validiert:

- `BEFRISTET`: Befristungsgrund erforderlich
- `UNTERMIETE`: Hauptmieter erforderlich
- `STAFFEL`: Staffelwerte und Zeitpunkte werden als offene Angaben markiert
- `INDEX`: Indexvereinbarung wird als offene Angabe markiert

## KI-Provider

Der Provider wird über `.env.local` ausgewählt:

```env
AI_ASSIST_MODE=mock
```

Kostenfreier lokaler Entwurf ohne externen API-Aufruf.

```env
AI_ASSIST_MODE=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=...
```

Echter Gemini-Aufruf mit dem aktuellen Prompt aus Directus.

```env
AI_ASSIST_MODE=anthropic
ANTHROPIC_API_KEY=...
```

Anthropic als alternativer Provider.

Die Provider-Logik befindet sich in `src/lib/ai-assist.ts`. Gemini-Client, Modellauswahl und Fehlerklassifizierung sind in `src/lib/gemini.ts` gebündelt und werden dort ebenso von der Qualitätsprüfung und der API-Route verwendet. Der fachliche Prompt liegt in `src/lib/ai-prompts.ts` beziehungsweise versioniert in Directus.

## Fehlende Angaben

Fehlende Angaben werden serverseitig in `getMissingContractDetails()` bestimmt.
Sie werden dem Prompt übergeben und müssen im Text mit folgendem Platzhalter erscheinen:

```text
[NOCH ZU ERGÄNZEN UND RECHTLICH ZU PRÜFEN]
```

Dadurch hängt die Erkennung offener Angaben nicht ausschließlich vom Sprachmodell ab.

## Qualitätsprüfung

Die Qualitätsprüfung besteht aus zwei Ebenen:

1. deterministische Prüfung zentraler Eingabewerte, Überschriften und offener Angaben,
2. zusätzliche Gemini-Prüfung im Gemini-Modus.

Ein fehlerhafter Entwurf wird mit HTTP 422 abgelehnt und nicht in Directus gespeichert.

Wenn Gemini während der optionalen Prüfung temporär nicht verfügbar ist, entscheidet weiterhin die deterministische Prüfung.

## Fallbacks und Fehlerbehandlung

Bei einem temporären Gemini-Ausfall während der Generierung wird ein lokaler Entwurf erzeugt und als `local-fallback` gekennzeichnet.

Quota- und Verfügbarkeitsfehler werden über `isGeminiQuotaExceeded()` und `isGeminiOverloaded()` aus `src/lib/gemini.ts` erkannt und an der API-Grenze verständlich behandelt:

- HTTP 429: kostenloses Gemini-Kontingent ausgeschöpft
- HTTP 503: Gemini momentan nicht verfügbar

API-Schlüssel werden ausschließlich serverseitig aus Umgebungsvariablen gelesen und nicht in Directus gespeichert.

## DOCX-Export

Der gespeicherte Entwurf kann über folgende Route exportiert werden:

```text
GET /api/mietvertraege/[id]/export
```

Die Route erzeugt eine DOCX-Datei mit dem Entwurfshinweis und dem gespeicherten Vertragstext.

## Testfälle

### Erfolgreicher Mock-Test

Erwartet:

```text
HTTP 200
success = true
generation_source = mock
prompt_version = 0
vertragstext vorhanden
```

### Gemini-Test

Bei verfügbarem Kontingent:

```text
HTTP 200
success = true
generation_source = gemini
prompt_version = 1
```

Bei erschöpftem Kontingent:

```text
HTTP 429
```

Für die lokale Entwicklung kann auf `AI_ASSIST_MODE=mock` gewechselt werden.

### Validierungsfehler

Ein befristeter Vertrag ohne Befristungsgrund wird mit HTTP 422 abgelehnt.

### Export-Test

Ein bestehender Datensatz wird über `/api/mietvertraege/[id]/export` geladen und als DOCX ausgeliefert.

## Bekannte Grenzen

- Der Entwurf ersetzt keine rechtliche Prüfung.
- Gemini kann durch Rate-Limits, Kontingente oder Dienstüberlastung ausfallen.
- Staffel- und Indexdetails sind in der aktuellen Version noch offene Angaben.
- `tenant_id` ist derzeit ein einfacher Mandantenwert und noch nicht an eine echte Session-Identität gekoppelt.
- Der Export ist DOCX, nicht XNP oder eine direkte Kanzleisoftware-Schnittstelle.

## Gesprächserklärung

Die Lösung bleibt bewusst pragmatisch:

- `tenant_id` verankert Multi-Tenancy früh im Datenmodell.
- Prompt-Versionen liegen in Directus und sind ohne Deployment änderbar.
- Provider sind austauschbar, weil Route und Frontend nur den gemeinsamen Helper aufrufen.
- Der Mock-Modus ermöglicht reproduzierbare Entwicklung ohne API-Kosten.
- Die deterministische Prüfung verhindert, dass fehlende Kernwerte ausschließlich dem Sprachmodell überlassen werden.
- Die KI-Prüfung ist als nächste Ausbaustufe eines agentischen Workflows bereits vorbereitet.
