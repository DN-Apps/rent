# Monteurzimmer Buchungsapp

Next.js 14 Buchungsapp fuer eine gewerbliche Monteurzimmer-Unterkunft mit genau 3 Zimmern. Der Stack besteht aus Next.js App Router, TypeScript, PostgreSQL, Prisma, Directus CMS, next-intl und Tailwind CSS.

## Voraussetzungen

- Node.js 20+
- npm 10+
- Docker Desktop

## Lokales Setup

1. Repository klonen und in den Projektordner wechseln.
2. Abhaengigkeiten installieren:

```bash
npm install
```

3. `.env` fuer Docker/Prisma pruefen und `.env.local` fuer die Next.js App anlegen bzw. anpassen.

Beispiel fuer `.env.local`:

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

4. Docker Services starten:

```bash
docker compose up -d
```

5. Prisma Migrationen ausfuehren:

```bash
npx prisma migrate dev
```

6. Entwicklungsserver starten:

```bash
npm run dev
```

Die App laeuft danach unter `http://localhost:3000`, Directus unter `http://localhost:8055`.

## Directus Collections konfigurieren

In Directus muessen diese Collections vorhanden sein:

- `rooms`
- `pages`
- `faqs`
- `amenities`

Lege anschliessend genau 3 Zimmer in `rooms` an. Verwendete Felder fuer `rooms`:

- `name`
- `description`
- `price_per_night`
- `price_per_week`
- `price_per_month`
- `available`
- `detail_text`
- `sort`

Lege danach einen statischen API-Token in Directus an und trage ihn in `.env.local` als `DIRECTUS_TOKEN` ein.

## Umgebungsvariablen

### `.env`

Wird von Prisma und Docker Compose verwendet.

- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `DIRECTUS_PORT`
- `DIRECTUS_SECRET`
- `DIRECTUS_ADMIN_EMAIL`
- `DIRECTUS_ADMIN_PASSWORD`

### `.env.local`

Wird von Next.js verwendet.

- `DATABASE_URL`
- `DIRECTUS_URL`
- `DIRECTUS_TOKEN`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_FROM`
- `MAIL_TO`
- `NEXT_PUBLIC_BASE_URL`

## Build und Deployment

Produktionsbuild erstellen:

```bash
npm run build
```

Produktionsserver starten:

```bash
npm run start
```

Wichtige Hinweise fuer Deployment:

- Vor dem Build wird automatisch `prisma generate` ausgefuehrt.
- Nach `npm install` wird der Prisma Client ueber `postinstall` generiert.
- Stelle sicher, dass PostgreSQL, Directus und alle Mail-Variablen in der Zielumgebung korrekt gesetzt sind.
- Fuer Server-Deployments sollte `NEXT_PUBLIC_BASE_URL` auf die produktive Domain zeigen.
