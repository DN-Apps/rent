# Copilot Build Instructions – Monteurzimmer App (Next.js Rebuild)

> Dieses Dokument ist dein Schritt-für-Schritt-Leitfaden für GitHub Copilot.
> Hake jeden Schritt ab wenn er fertig ist. Gib Copilot immer den relevanten Abschnitt als Kontext.

---

## Kontext für Copilot (immer mitgeben)

```
Du hilfst mir eine Monteurzimmer-Buchungsapp neu zu bauen.
Es handelt sich um eine gewerbliche Unterkunft für Monteure, Handwerker und Bauarbeiter.
Es gibt genau 3 Zimmer zu vermieten.
Stack: Next.js 14 (App Router), React, TypeScript, PostgreSQL, Directus CMS, Tailwind CSS.
Wir arbeiten Schritt für Schritt nach einer Checkliste. Ich gebe dir jeweils den aktuellen Schritt.
Antworte immer mit vollständigem, produktionsreifem TypeScript-Code.
Verwende niemals `any` als Typ. Nutze Zod für alle Validierungen.
```

---

## Phase 1 – Projektsetup

### Schritt 1.1 – Next.js Projekt anlegen

- [ ] Erstelle neues Next.js Projekt mit folgendem Befehl:
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
- [ ] Überprüfe dass `tsconfig.json`, `tailwind.config.ts` und `app/` Ordner vorhanden sind.

**Copilot-Prompt:**

> "Erkläre mir die generierte Ordnerstruktur von Next.js 14 mit App Router und `src/` Verzeichnis. Was ist der Unterschied zwischen Server Components und Client Components?"

---

### Schritt 1.2 – Abhängigkeiten installieren

- [ ] Installiere alle benötigten Pakete:
  ```bash
  npm install @directus/sdk next-intl react-hook-form @hookform/resolvers zod
  npm install react-day-picker date-fns react-icons
  npm install nodemailer
  npm install --save-dev @types/nodemailer prisma
  npx prisma init
  ```

**Copilot-Prompt:**

> "Erkläre mir kurz die Rolle jedes installierten Pakets in unserem Stack."

---

### Schritt 1.3 – Ordnerstruktur anlegen

- [ ] Erstelle folgende Ordner unter `src/`:
  ```
  src/
  ├── app/
  │   └── [locale]/
  ├── components/
  │   ├── ui/
  │   ├── rooms/
  │   ├── booking/
  │   └── contact/
  ├── lib/
  ├── actions/
  ├── types/
  └── messages/
  ```

**Copilot-Prompt:**

> "Erstelle ein Bash-Skript das alle diese Verzeichnisse inklusive `.gitkeep` Dateien anlegt."

---

## Phase 2 – Datenbank & CMS

### Schritt 2.1 – PostgreSQL Datenbank aufsetzen

- [ ] Starte PostgreSQL lokal (Docker empfohlen):
  ```bash
  docker run --name pg-monteur -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=monteur -p 5432:5432 -d postgres:16
  ```
- [ ] Erstelle `.env.local` mit:
  ```env
  DATABASE_URL="postgresql://postgres:secret@localhost:5432/monteur"
  DIRECTUS_URL="http://localhost:8055"
  DIRECTUS_TOKEN=""
  MAIL_HOST=""
  MAIL_PORT=""
  MAIL_USER=""
  MAIL_PASS=""
  MAIL_FROM=""
  MAIL_TO=""
  NEXT_PUBLIC_BASE_URL="http://localhost:3000"
  ```

---

### Schritt 2.2 – Prisma Schema definieren

- [ ] Öffne `prisma/schema.prisma` und ersetze den Inhalt:

**Copilot-Prompt:**

> "Erstelle ein Prisma Schema für PostgreSQL mit folgenden Models:
>
> - `Booking`: id (UUID), createdAt, checkIn (DateTime), checkOut (DateTime), totalPrice (Decimal),
>   status (enum: PENDING/CONFIRMED/CANCELLED), guestName, guestEmail, guestPhone,
>   guestAddress (Json), company (String, Pflichtfeld), invoiceAddress (Json, optional,
>   für abweichende Firmen-Rechnungsadresse), rooms (Relation zu BookingRoom)
> - `BookingRoom`: id (UUID), bookingId, roomId (String, aus Directus), roomName,
>   pricePerNight (Decimal), numberOfGuests (Int)
>
> Verwende UUID als id-Typ."

- [ ] Führe Migration aus:
  ```bash
  npx prisma migrate dev --name init
  npx prisma generate
  ```

---

### Schritt 2.3 – Directus aufsetzen

- [ ] Starte Directus via Docker:
  ```bash
  docker run --name directus -p 8055:8055 \
    -e SECRET=your-secret-key \
    -e DB_CLIENT=pg \
    -e DB_HOST=host.docker.internal \
    -e DB_PORT=5432 \
    -e DB_DATABASE=monteur \
    -e DB_USER=postgres \
    -e DB_PASSWORD=secret \
    -e ADMIN_EMAIL=admin@example.com \
    -e ADMIN_PASSWORD=admin123 \
    -d directus/directus:latest
  ```
- [ ] Öffne `http://localhost:8055` und logge dich ein.

---

### Schritt 2.4 – Directus Collections anlegen

- [ ] Lege folgende Collections in der Directus UI an:

  **`rooms`**
  | Feld | Typ | Hinweis |
  |---|---|---|
  | id | UUID (auto) | |
  | name | String | |
  | description | Text | |
  | price_per_night | Decimal | 20 EUR |
  | price_per_week | Decimal | 140 EUR |
  | price_per_month | Decimal | 400 EUR |
  | available | Boolean | |
  | detail_text | Text | |
  | sort | Integer | |

  **`pages`**
  | Feld | Typ |
  |---|---|
  | id | UUID |
  | slug | String (unique) |
  | content | JSON |

  **`faqs`**
  | Feld | Typ |
  |---|---|
  | id | UUID |
  | question | String |
  | answer | Text |
  | sort | Integer |

  **`amenities`**
  | Feld | Typ |
  |---|---|
  | id | UUID |
  | label | String |
  | icon | String |
  | sort | Integer |

- [ ] Lege einen statischen API-Token in Directus an (Settings → API Access Tokens) und trage ihn in `.env.local` ein.
- [ ] Lege die 3 Zimmer als Datensätze in der `rooms` Collection an.

---

### Schritt 2.5 – Directus SDK einrichten

- [ ] Erstelle `src/lib/directus.ts`:

**Copilot-Prompt:**

> "Erstelle `src/lib/directus.ts`. Initialisiere den Directus SDK Client mit `createDirectus`, `staticToken` und `rest` aus `@directus/sdk`. Verwende `DIRECTUS_URL` und `DIRECTUS_TOKEN` aus den Umgebungsvariablen. Exportiere einen typisierten Client. Definiere TypeScript-Interfaces für die Collections: `Room`, `Page`, `Faq`, `Amenity` basierend auf den Feldern aus Schritt 2.4."

---

## Phase 3 – Internationalisierung (next-intl)

### Schritt 3.1 – next-intl konfigurieren

- [ ] Erstelle `src/i18n.ts`:

**Copilot-Prompt:**

> "Konfiguriere `next-intl` für Next.js 14 App Router mit den Locales `de` (default) und `en`. Erstelle:
>
> 1. `src/i18n.ts` mit `getRequestConfig`
> 2. `src/middleware.ts` mit dem next-intl Middleware für Locale-Routing
> 3. `next.config.ts` mit dem next-intl Plugin
>
> Der Default-Locale ist `de`. Nutze die aktuelle next-intl Dokumentation für App Router."

---

### Schritt 3.2 – Übersetzungsdateien anlegen

- [ ] Erstelle `src/messages/de.json` und `src/messages/en.json`:

**Copilot-Prompt:**

> "Erstelle zwei Übersetzungsdateien `src/messages/de.json` und `src/messages/en.json` mit folgenden Namespaces:
>
> - `nav`: home, rooms, booking, contact
> - `home`: title, subtitle (richtet sich an Monteure, Handwerker und Bauarbeiter – günstige und praktische Unterkunft für Berufspendler und Projektteams), amenities_title
> - `booking`: title, step1, step2, step3, step4, nights, weeks, months, total, submit, company (Pflichtfeld-Label), invoiceAddress, numberOfGuests
> - `contact`: title, name, email, phone, message, submit, success
> - `common`: loading, error, close, back, next
>
> Deutsch als Primärsprache. Englisch als Übersetzung."

---

### Schritt 3.3 – Locale-Layout anlegen

- [ ] Erstelle `src/app/[locale]/layout.tsx`:

**Copilot-Prompt:**

> "Erstelle das Root-Layout `src/app/[locale]/layout.tsx` für next-intl. Es soll:
>
> - Den `locale` Parameter aus den Route-Params lesen
> - `NextIntlClientProvider` mit den Nachrichten für den aktuellen Locale wrappen
> - Eine `<html lang={locale}>` Root-Struktur haben
> - Tailwind CSS global importieren"

---

## Phase 4 – UI Komponenten

### Schritt 4.1 – Layout-Komponenten

- [ ] Erstelle `src/components/ui/Header.tsx`:

**Copilot-Prompt:**

> "Erstelle eine Header-Komponente `src/components/ui/Header.tsx` als Client Component.
> Anforderungen:
>
> - Navigation mit Links zu: /, /rooms, /booking, /contact (mit Locale-Prefix)
> - Responsives Burger-Menü für mobile Ansicht (mit useState)
> - Sprachumschalter: DE / EN Buttons die via next-intl `useRouter` und `usePathname` die Sprache wechseln
> - Tailwind CSS Styling
> - Übersetzungen via `useTranslations('nav')`"

- [ ] Erstelle `src/components/ui/Footer.tsx`:

**Copilot-Prompt:**

> "Erstelle eine Footer-Komponente mit einem Impressum-Button der ein Modal öffnet. Das Modal ist eine Client Component mit useState. Nutze Tailwind CSS."

---

### Schritt 4.2 – Datenschutz-Banner

- [ ] Erstelle `src/components/ui/PrivacyBanner.tsx`:

**Copilot-Prompt:**

> "Erstelle einen Datenschutz-Hinweis-Banner als Client Component. Er soll:
>
> - Beim ersten Besuch angezeigt werden (localStorage: `privacyAccepted`)
> - Einen 'Akzeptieren' Button haben der den Banner schließt und den Key setzt
> - Fixed am unteren Bildschirmrand positioniert sein
> - Mit next-intl übersetzt sein"

---

### Schritt 4.3 – Startseite

- [ ] Erstelle `src/app/[locale]/page.tsx`:

**Copilot-Prompt:**

> "Erstelle die Startseite `src/app/[locale]/page.tsx` als Server Component.
> Sie soll:
>
> 1. Ausstattungsmerkmale aus Directus Collection `amenities` laden (via Directus SDK)
> 2. Eine Bildergalerie/Slideshow als Client Component einbinden (`src/components/ui/Slideshow.tsx`)
> 3. Einen Kontaktblock mit Adresse, E-Mail und Telefon anzeigen (Werte aus Umgebungsvariablen oder Directus)
> 4. Eine eingebettete Google Maps Karte anzeigen (als iframe). Ergänze neben der Karte einen Infoblock mit Angaben zur Verkehrsanbindung: Entfernung zur nächsten Autobahn, Bahnhof und umliegenden Industriegebieten – das ist für Monteure und Berufspendler relevanter als touristische Informationen.
> 5. Übersetzungen via `getTranslations('home')` nutzen"

---

## Phase 5 – Zimmerseite

### Schritt 5.1 – Zimmer aus Directus laden

- [ ] Erstelle `src/lib/rooms.ts`:

**Copilot-Prompt:**

> "Erstelle `src/lib/rooms.ts` mit einer Funktion `getRooms()` die alle Zimmer aus der Directus Collection `rooms` lädt. Nutze den Directus SDK Client aus `src/lib/directus.ts`. Gib ein Array vom Typ `Room[]` zurück. Füge `{ cache: 'no-store' }` hinzu damit Verfügbarkeiten immer aktuell sind."

---

### Schritt 5.2 – Zimmerseite

- [ ] Erstelle `src/app/[locale]/rooms/page.tsx`:

**Copilot-Prompt:**

> "Erstelle die Zimmerseite `src/app/[locale]/rooms/page.tsx` als Server Component.
> Sie soll:
>
> 1. Alle 3 Zimmer via `getRooms()` laden
> 2. Jedes Zimmer als Karte anzeigen mit: Name, Beschreibung, Preisübersicht (20 EUR/Nacht · 140 EUR/Woche · 400 EUR/Monat), Verfügbarkeitsstatus (grün/rot Badge)
> 3. Einen 'Jetzt buchen' Link zum Buchungsformular pro Zimmer
> 4. Tailwind CSS Styling"

---

### Schritt 5.3 – Grundriss-Komponente (optional)

- [ ] Erstelle `src/components/rooms/FloorPlan.tsx`:

**Copilot-Prompt:**

> "Erstelle eine interaktive SVG-Grundriss-Komponente als Client Component. Sie soll klickbare Bereiche (Hotspots) haben die beim Klick eine Bildergalerie in einem Modal öffnen. Die Hotspot-Koordinaten und zugehörigen Bilder kommen als Props. Nutze useState für das Modal."

---

## Phase 6 – Buchungsformular

### Schritt 6.1 – Zod Schema für Buchung

- [ ] Erstelle `src/lib/validation.ts`:

**Copilot-Prompt:**

> "Erstelle `src/lib/validation.ts` mit Zod-Schemas für:
>
> 1. `bookingSchema`:
>    - checkIn (Date), checkOut (Date, muss nach checkIn liegen)
>    - rooms (Array, min 1, max 3): roomId, roomName, pricePerNight, numberOfGuests (Int, min 1)
>    - company (String, Pflichtfeld – gewerbliche Buchung)
>    - guestName, guestEmail, guestPhone
>    - guestAddress: street, zip, city, country
>    - invoiceAddress (optional, abweichende Rechnungsadresse der Firma): street, zip, city, country
>
> 2. `contactSchema`: name, email, phone (optional), street, zip, city, message (max 500 Zeichen), captcha
>
> Exportiere auch die abgeleiteten TypeScript-Typen mit `z.infer`."

---

### Schritt 6.2 – Buchungs-Server-Action

- [ ] Erstelle `src/actions/booking.ts`:

**Copilot-Prompt:**

> "Erstelle eine Next.js Server Action `src/actions/booking.ts` mit `'use server'`.
> Die Funktion `submitBooking(data: BookingFormData)` soll:
>
> 1. Eingabe mit `bookingSchema` (Zod) validieren
> 2. Aufenthaltsdauer in Nächten berechnen (checkOut - checkIn)
> 3. Preis pro Zimmer nach folgender Logik berechnen (feste Preise):
>    - 20 EUR / Nacht
>    - 140 EUR / Woche (7 Nächte)
>    - 400 EUR / Monat (30 Nächte)
>    - Berechne immer die günstigste Kombination: zuerst volle Monate, dann volle Wochen, dann Einzelnächte
>    - Beispiel: 45 Nächte = 1 Monat (400 EUR) + 2 Wochen (280 EUR) + 1 Nacht (20 EUR) = 700 EUR
> 4. Gesamtpreis über alle gebuchten Zimmer summieren
> 5. Buchung in PostgreSQL speichern via Prisma
> 6. Bestätigungsmail an Gast senden via Nodemailer
> 7. Benachrichtigungsmail an Betreiber senden
> 8. `{ success: true, bookingId }` oder `{ success: false, error }` zurückgeben"

---

### Schritt 6.3 – Buchungsformular UI

- [ ] Erstelle `src/components/booking/BookingWizard.tsx`:

**Copilot-Prompt:**

> "Erstelle einen mehrstufigen Buchungs-Wizard als Client Component `src/components/booking/BookingWizard.tsx`.
> Es gibt genau 3 Zimmer, maximal alle 3 buchbar.
>
> 4 Schritte:
>
> 1. Zeitraum wählen (react-day-picker DateRange, Mindestdatum = heute). Zeige direkt eine Preisvorschau basierend auf der Nächteanzahl (Monat/Woche/Nacht-Optimierung aus der Preislogik in Schritt 6.2).
> 2. Zimmer wählen (alle 3 Zimmer aus Props anzeigen, einzeln hinzufügen/entfernen, Anzahl Personen pro Zimmer angeben). Zeige aktualisierte Gesamtpreisvorschau.
> 3. Kontaktdaten:
>    - Firmenname (Pflichtfeld)
>    - Name des Ansprechpartners
>    - E-Mail, Telefon
>    - Aufenthaltsadresse (PLZ-Autofill via OpenStreetMap Nominatim API)
>    - Checkbox 'Abweichende Rechnungsadresse' – bei Aktivierung erscheint ein zweites Adressformular für die Firmen-Rechnungsadresse
> 4. Zusammenfassung + Absenden: zeigt Zeitraum, gewählte Zimmer, Preisaufschlüsselung (Monate/Wochen/Nächte pro Zimmer), Firmenangaben, ggf. Rechnungsadresse
>
> Nutze react-hook-form mit bookingSchema (Zod). Zeige eine Fortschrittsanzeige. Beim Absenden rufe die Server Action `submitBooking` auf."

---

### Schritt 6.4 – Buchungsseite

- [ ] Erstelle `src/app/[locale]/booking/page.tsx`:

**Copilot-Prompt:**

> "Erstelle `src/app/[locale]/booking/page.tsx` als Server Component. Lade Zimmer via `getRooms()` und übergib sie als Props an den `BookingWizard` Client Component."

---

## Phase 7 – Kontaktseite

### Schritt 7.1 – Kontakt-Server-Action

- [ ] Erstelle `src/actions/contact.ts`:

**Copilot-Prompt:**

> "Erstelle eine Server Action `src/actions/contact.ts` mit `'use server'`.
> Die Funktion `submitContact(data: ContactFormData)` soll:
>
> 1. Eingabe mit `contactSchema` validieren
> 2. Mail an Betreiber senden via Nodemailer (aus Umgebungsvariablen)
> 3. Bestätigungsmail an Absender mit Reply-To
> 4. `{ success: true }` oder `{ success: false, error }` zurückgeben"

---

### Schritt 7.2 – Kontaktformular UI

- [ ] Erstelle `src/components/contact/ContactForm.tsx`:

**Copilot-Prompt:**

> "Erstelle ein Kontaktformular als Client Component `src/components/contact/ContactForm.tsx`.
> Felder: Name, E-Mail, Telefon (optional), Straße, PLZ, Ort, Nachricht (Textarea mit Zeichenzähler max 500).
> Einfaches Captcha: Zeige eine Rechenaufgabe (z.B. 3+4) und prüfe die Antwort clientseitig vor dem Submit.
> Nutze react-hook-form + contactSchema (Zod). Rufe `submitContact` Server Action auf. Zeige Erfolgs-/Fehlermeldung.
> PLZ-Autofill wie im Buchungsformular."

---

### Schritt 7.3 – FAQ Komponente

- [ ] Erstelle `src/components/contact/FAQ.tsx`:

**Copilot-Prompt:**

> "Erstelle eine FAQ-Komponente als Server Component die FAQs aus Directus lädt. Nutze eine Akkordeon-UI (Client Component mit useState) für aufklappbare Fragen/Antworten."

---

### Schritt 7.4 – Kontaktseite

- [ ] Erstelle `src/app/[locale]/contact/page.tsx`:

**Copilot-Prompt:**

> "Kombiniere Kontaktformular und FAQ auf der Kontaktseite `src/app/[locale]/contact/page.tsx`."

---

## Phase 8 – Mail-Setup

### Schritt 8.1 – Nodemailer einrichten

- [ ] Erstelle `src/lib/mail.ts`:

**Copilot-Prompt:**

> "Erstelle `src/lib/mail.ts` mit:
>
> 1. Einem Nodemailer-Transporter der SMTP-Konfiguration aus Umgebungsvariablen liest
> 2. Funktion `sendBookingConfirmation(booking: BookingData)` – HTML-Mail an Gast mit vollständiger Preisaufschlüsselung (Monate/Wochen/Nächte pro Zimmer), Firmenname und ggf. abweichender Rechnungsadresse
> 3. Funktion `sendBookingNotification(booking: BookingData)` – Mail an Betreiber mit allen Buchungsdetails
> 4. Funktion `sendContactMail(contact: ContactData)` – Kontaktanfrage an Betreiber
> 5. Funktion `sendContactConfirmation(contact: ContactData)` – Bestätigung an Absender
>
> Alle Funktionen mit TypeScript-Typen, ohne `any`."

---

## Phase 9 – Feinschliff

### Schritt 9.1 – Error Boundaries und Loading States

- [ ] Erstelle `src/app/[locale]/loading.tsx` und `src/app/[locale]/error.tsx`:

**Copilot-Prompt:**

> "Erstelle Loading- und Error-Komponenten für das Next.js App Router Segment `app/[locale]/`. Loading soll ein Skeleton-UI zeigen. Error soll eine freundliche Fehlermeldung mit 'Erneut versuchen' Button anzeigen."

---

### Schritt 9.2 – Metadata und SEO

- [ ] Füge Metadata zu allen Seiten hinzu:

**Copilot-Prompt:**

> "Füge Next.js `generateMetadata` zu allen Page-Komponenten hinzu. Titel und Beschreibung sollen aus next-intl Übersetzungen kommen und Locale-spezifisch sein."

---

### Schritt 9.3 – Umgebungsvariablen absichern

- [ ] Erstelle `src/env.ts`:

**Copilot-Prompt:**

> "Erstelle `src/env.ts` das alle Umgebungsvariablen mit Zod validiert beim App-Start. Trenne PUBLIC (NEXT_PUBLIC_*) und SERVER-only Variablen. Wirf einen sprechenden Fehler wenn eine Variable fehlt."

---

### Schritt 9.4 – CORS und Security Headers

- [ ] Aktualisiere `next.config.ts`:

**Copilot-Prompt:**

> "Füge Security Headers zu `next.config.ts` hinzu: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. CSP soll Google Maps iframes erlauben."

---

## Phase 10 – Deployment-Vorbereitung

### Schritt 10.1 – Prisma für Produktion

- [ ] Aktualisiere `package.json` Scripts:
  ```json
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
  ```

### Schritt 10.2 – Docker Compose für lokale Entwicklung

- [ ] Erstelle `docker-compose.yml`:

**Copilot-Prompt:**

> "Erstelle eine `docker-compose.yml` für lokale Entwicklung mit Services: postgres (Port 5432), directus (Port 8055, abhängig von postgres). Nutze Volumes für Datenpersistenz. Alle Passwörter aus `.env` Datei."

---

### Schritt 10.3 – README

- [ ] Erstelle `README.md`:

**Copilot-Prompt:**

> "Erstelle ein README.md das erklärt:
>
> 1. Voraussetzungen (Node, Docker)
> 2. Lokales Setup (Clone, .env anlegen, docker-compose up, npm install, prisma migrate, npm run dev)
> 3. Directus Collections konfigurieren und die 3 Zimmer als Datensätze anlegen
> 4. Umgebungsvariablen-Referenz
> 5. Build & Deployment"

---

## Checkliste Gesamtüberblick

```
Phase 1 – Setup          [ ] 1.1  [ ] 1.2  [ ] 1.3
Phase 2 – DB & CMS       [ ] 2.1  [ ] 2.2  [ ] 2.3  [ ] 2.4  [ ] 2.5
Phase 3 – i18n           [ ] 3.1  [ ] 3.2  [ ] 3.3
Phase 4 – UI Basis       [ ] 4.1  [ ] 4.2  [ ] 4.3
Phase 5 – Zimmer         [ ] 5.1  [ ] 5.2  [ ] 5.3
Phase 6 – Buchung        [ ] 6.1  [ ] 6.2  [ ] 6.3  [ ] 6.4
Phase 7 – Kontakt        [ ] 7.1  [ ] 7.2  [ ] 7.3  [ ] 7.4
Phase 8 – Mail           [ ] 8.1
Phase 9 – Feinschliff    [ ] 9.1  [ ] 9.2  [ ] 9.3  [ ] 9.4
Phase 10 – Deployment    [ ] 10.1 [ ] 10.2 [ ] 10.3
```

---

## Tipps für Copilot

- Gib Copilot **immer den vollständigen Schritt** als Kontext, nicht nur den Prompt.
- Wenn Copilot einen Fehler macht: Zeige ihm die Fehlermeldung und schreibe `"Behalte den bisherigen Ansatz, behebe nur diesen Fehler:"`.
- Für komplexe Komponenten: Lass Copilot erst die **Typen und Interfaces** generieren, dann die Implementierung.
- Bei Directus-Fragen: Schreibe `"Nutze den Directus SDK v17+ mit TypeScript, App Router kompatibel."`.
- Commit nach jeder abgeschlossenen Phase.
