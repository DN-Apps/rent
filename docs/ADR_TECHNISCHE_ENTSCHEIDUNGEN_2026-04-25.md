# Architecture Decision Records (ADR) – Technische Entscheidungen 2026

## ADR-001: Zentrale API-Response-Struktur (`apiSuccess` / `apiError`)

**Status**: ✅ Implementiert  
**Datum**: 25.04.2026

### Entscheidung

Alle API-Routen (Booking, Contact) nutzen einheitliche Helper-Funktionen für Success- und Error-Responses.

### Kontext

- Booking-Route und Contact-Route hatten unterschiedliche Response-Formate
- Frontend-Fehlerbehandlung war redundant und fehleranfällig
- Logging und Debugging erschwert durch inkonsistente Struktur

### Begründung

- **Konsistenz**: Alle API-Clients erwarten das gleiche Format
- **Wartbarkeit**: Error-Handling kann zentral geändert werden
- **Testing**: Vereinfachte Unit-Tests für Response-Struktur
- **Debugging**: Einheitliche Log-Ausgaben

### Konsequenzen

- ✅ Frontend kann mit vereinfachter Try-Catch-Logik arbeiten
- ✅ Neue API-Routen können sofort Konsistenz einhalten
- ⚠️ Bestehende Client-Integrationen müssen verifiziert werden
- ℹ️ Helper in `src/lib/api-response.ts` zentral gepflegt

---

## ADR-002: Serverseitige Verfügbarkeitsprüfung bei Buchungen

**Status**: ✅ Implementiert  
**Datum**: 25.04.2026

### Entscheidung

Booking-API prüft verfügbare Zimmer erneut vor dem Speichern (Double-Check).

### Kontext

- Frontend zeigt verfügbare Zimmer basierend auf geladenem State
- Race Condition: Zwischen Frontend-Auswahl und API-Speicherung kann ein Zimmer ausgebucht sein
- Ohne serverseitige Prüfung: Ungültige Buchungen in der Datenbank

### Begründung

- **Datenkonsistenz**: Verhindert Race Conditions
- **Geschäftslogik-Schutz**: Backend ist Single Source of Truth
- **User Experience**: Klare Fehlermeldung wenn verfügbar ausgebuchter Raum gewählt
- **Compliance**: Buchungsgarantien können gewährleistet werden

### Konsequenzen

- ✅ Nur gültige Buchungen in der Datenbank
- ✅ Weniger Stornierungsanfragen
- ⚠️ Leicht höhere Latenz (zusätzliche DB-Query)
- ℹ️ Implementiert in `src/app/api/booking/route.ts`

---

## ADR-003: requestAnimationFrame-Verzögerung für Turnstile-Mount

**Status**: ✅ Implementiert  
**Datum**: 25.04.2026

### Entscheidung

Turnstile-Widget wird mit `requestAnimationFrame`-Verzögerung ins DOM gemountet (nach Paint-Phase).

### Kontext

- Error 600010 auf Pixel 7 Emulator: "Could not measure captcha container size"
- Turnstile versuchte Size-Messung bevor Container DOM-Position stabil war
- Nur auf mobilen Layouts/Emulatoren auftretend (Desktop-Views stabil)

### Begründung

- **Browser-Rendering-Pipeline**: requestAnimationFrame verzögert Mount bis nach Paint
- **Container-Stabilität**: Beim Callback ist Layout inklusive Media Queries vollständig berechnet
- **Cross-Browser**: Standard-Methode, nicht Browser-spezifisch
- **Low-Risk**: Verzögerung unmerklich für Nutzer (<16ms)

### Konsequenzen

- ✅ Error 600010 auf mobilen Emulatoren behoben
- ✅ Robustheit für Edge-Cases
- ⚠️ Noch nicht in echter Produktion validiert (HTTPS, echte Mobile-Geräte)
- ℹ️ Implementiert in `src/components/booking/BookingWizard.tsx`

---

## ADR-004: HTML-Escaping und Header-Normalisierung bei E-Mails

**Status**: ✅ Implementiert  
**Datum**: 25.04.2026

### Entscheidung

Alle Nutzer-Inputs in E-Mail-Inhalten werden escaped (HTML), E-Mail-Header werden normalisiert.

### Kontext

- E-Mail-Inhalte enthalten Nutzer-Eingaben (Name, Nachricht, PLZ)
- Risiko: HTML-Injection oder CRLF-Injection in Headers
- Besonders kritisch für Header wie From, Reply-To

### Begründung

- **Sicherheit**: Verhindert XSS in E-Mail-Clients (auch wenn gering)
- **Standardkonformität**: RFC-5322 compliant (keine CRLF-Injection)
- **Spam-Filter-Bypass**: Verhindert Missbrauch über Header-Injection
- **Zentralisierung**: Ein Ort für Sanitization-Logik

### Konsequenzen

- ✅ E-Mails sind sicher vor Injection-Angriffen
- ✅ Konsistente Sanitization über `getSanitizedContactFields()`
- ⚠️ Potenziell schwer lesbar bei speziellen Zeichen (z. B. Umlaute in HTML)
- ℹ️ Implementiert in `src/lib/mail.ts`

---

## ADR-005: Zod-Validierung mit Trim und Normalisierung

**Status**: ✅ Implementiert  
**Datum**: 25.04.2026

### Entscheidung

Alle Zod-Schemas für Buchung und Kontakt verwenden `.trim()` und normalisieren optionale Felder zu `undefined`.

### Kontext

- Nutzer geben ggf. Leerzeichen ein (vor/nach Text)
- Inconsistente Datentypen: manchmal `""`, manchmal `null`, manchmal `undefined`
- Validierung war an verschiedenen Stellen unterschiedlich streng

### Begründung

- **Datenqualität**: Saubere Daten in der Datenbank
- **UX**: Benutzer sieht nicht ihre Leerzeichen gespiegelt
- **Konsistenz**: Überall gleiche Normalisierungsregeln
- **Testing**: Vorhersagbare Eingaben für Unit-Tests

### Konsequenzen

- ✅ Saubere Daten
- ✅ Weniger DB-Speicher durch Leerzeichen-Normalisierung
- ⚠️ Leerzeichen-only Input (z. B. `"   "`) wird zu `undefined` → möglicherweise überraschend für Nutzer
- ℹ️ Schemas definiert in `src/utils/validation.ts`

---

## ADR-006: Geolocation-Input Guard (Länge + Trim)

**Status**: ✅ Implementiert  
**Datum**: 25.04.2026

### Entscheidung

Nominatim-Geolocation-Lookup wird nur für Eingaben zwischen 1–12 Zeichen durchgeführt (nach Trim).

### Kontext

- Geolocation-API (Nominatim) kann mit sehr langen oder unsinnigen Eingaben überlastet werden
- `zip` Feld sollte PLZ sein, z. B. DE: 5 Ziffern
- Ohne Guard: DOS-Anfragen möglich

### Begründung

- **Performance**: Verhindert API-Überflutung mit unsinnigen Queries
- **Realistische Eingaben**: PLZs sind typisch 5–10 Zeichen
- **Security**: Einfache DOS-Prävention
- **UX**: Fehlerbehandlung greift früh

### Konsequenzen

- ✅ Geolocation-API geschützt
- ✅ Schnellere Fehlerbehandlung
- ⚠️ Nutzer mit sehr langen PLZs (z. B. Ausland) können manuell eingeben
- ℹ️ Guard implementiert in `src/lib/geolocation.ts`

---

## ADR-007: Komponenten-Refactoring mit BookingSelectionSummary

**Status**: ✅ Implementiert  
**Datum**: 25.04.2026

### Entscheidung

Gemeinsame Anzeige von Buchungsdetails (Datum, Zimmer, Gäste, Preis) in separate Komponente ausgelagert.

### Kontext

- Booking-Steps 2, 3, 4 zeigen teilweise die gleichen Daten
- Code-Duplikation: Datumsformat, Zeitraumberechnung, Preisanzeige
- Maintenance Burden: Änderungen mussten an 3 Stellen gemacht werden

### Begründung

- **DRY**: Single Source of Truth für Anzeigelogik
- **Konsistenz**: Alle Steps zeigen identische Darstellung
- **Wartbarkeit**: Änderungen nur noch an 1 Stelle
- **Testbarkeit**: Komponente kann isoliert getestet werden

### Konsequenzen

- ✅ Weniger Code-Duplikation
- ✅ Einfachere zukünftige Änderungen
- ⚠️ Neue Komponenten-Abhängigkeit (leicht erhöhte Komplexität)
- ℹ️ Implementiert in `src/components/booking/BookingSelectionSummary.tsx`

---

## Zusammenfassung: Architektur-Prinzipien

| Prinzip                         | Umsetzung                                                        |
| ------------------------------- | ---------------------------------------------------------------- |
| **DRY (Don't Repeat Yourself)** | Helper für API, Mail, Validierung; wiederverwendbare Komponenten |
| **Single Responsibility**       | Jede Datei hat eine klare Aufgabe                                |
| **Security by Default**         | Input-Sanitization, Serverseitige Checks, HTML-Escaping          |
| **Consistency**                 | Einheitliche API-Struktur, Kommentierungsstil, Fehlerbehandlung  |
| **Testability**                 | Kleine, isolierbare Module mit klaren Schnittestellen            |

---

## Nächste Entscheidungen (zu klären)

- **Monitoring-Strategie**: Wie werden Fehler und Performance in Produktion beobachtet?
- **Skalierung**: Wie skaliert die App bei hohem Buchungsaufkommen?
- **Caching**: Sollte Verfügbarkeitsdaten gecacht werden?
- **Internationalisierung**: Weitere Sprachen oder nur DE/EN?
