# Technische Spezifikation & Deployment-Anforderungen – 25.04.2026

## 🎯 Übersicht

Dieses Dokument spezifiziert alle technischen Anforderungen für das Hosting auf **Ionos VPS mit Docker, Nginx Proxy Manager und GitHub Actions Deployment**.

---

## 1) Anwendungs-Stack

### Frontend & Backend

| Komponente           | Version | Funktion                        |
| -------------------- | ------- | ------------------------------- |
| **Next.js**          | 14.2.33 | App Router, SSR/ISR, API Routes |
| **React**            | 19.x    | UI-Komponenten, React Hook Form |
| **TypeScript**       | Latest  | Type Safety                     |
| **Zod**              | Latest  | Validierungsschemas             |
| **i18n (next-intl)** | Latest  | Mehrsprachigkeit (DE/EN)        |
| **React Hook Form**  | Latest  | Formularverwaltung              |
| **react-icons**      | Latest  | Icon-Rendering                  |

### Backend-Integrations

| Service                  | Funktion                             | Protokoll             |
| ------------------------ | ------------------------------------ | --------------------- |
| **Directus CMS**         | Inhaltsverwaltung, Zimmerausstattung | REST API (HTTP)       |
| **Nodemailer**           | E-Mail-Versand                       | SMTP                  |
| **Cloudflare Turnstile** | CAPTCHA-Schutz                       | HTTP POST             |
| **Nominatim (OSM)**      | Geolocation (PLZ→Stadt)              | HTTP GET (Public API) |

### Datenbank

| Layer                 | Technologie                          | Funktion                                        |
| --------------------- | ------------------------------------ | ----------------------------------------------- |
| **CMS Backend**       | Directus REST API                    | Öffentliche API (kein Token erforderlich)       |
| **Datenbank-Backend** | PostgreSQL                           | Persistente Datenspeicherung (Directus Backend) |
| **Host**              | Ionos Managed DB / Docker PostgreSQL | PostgreSQL-Instance für Directus                |

---

## 2) Docker-Container-Struktur

### Container 1: Next.js Application

```yaml
Image: ghcr.io/{GITHUB_OWNER}/neu_22042026_rent:latest
Container Name: neu-booking-app
Network: nginx-net (Bridge)
Ports:
  - 3000:3000 (intern, via Nginx Proxy Manager exposed)
Environment:
  - NODE_ENV=production
  - NEXT_PUBLIC_BASE_URL=https://{DOMAIN}
  - NEXT_PUBLIC_TURNSTILE_SITE_KEY={CLOUDFLARE_PUBLIC}
  - DIRECTUS_URL={DIRECTUS_INTERNAL_URL} (öffentlich, kein Token)
  - MAIL_HOST={SMTP_HOST}
  - MAIL_PORT=587 (oder 465 für SSL)
  - MAIL_USER={SMTP_USER}
  - MAIL_PASS={SECURE_PASS}
  - MAIL_FROM={sender@example.com}
  - MAIL_TO={admin@example.com} (Standard-Ziel für Buchungen/Kontakte)
  - MAIL_BOOKING_TO={booking-team@example.com} (optional, Override)
  - MAIL_CONTACT_TO={contact-team@example.com} (optional, Override)
  - TURNSTILE_SECRET_KEY={CLOUDFLARE_SECRET}

### Container 3: Directus CMS (existing)
```

Host: directus.internal (DNS) oder directus-container:8055
Port: 8055 (intern)
Network: nginx-net
Database: PostgreSQL (separater Container oder Ionos Managed DB)

````

### Container 4: Nginx Proxy Manager (existing)

```yaml
Image: jc21/nginx-proxy-manager:latest
Container Name: nginx-pm
Network: nginx-net (Bridge)
Ports:
  - 80:80 (HTTP → Redirect zu HTTPS)
  - 443:443 (HTTPS, SSL via Let's Encrypt)
  - 81:81 (Nginx PM Admin UI)
Volumes:
  - /data/npm/data:/data
  - /data/npm/letsencrypt:/etc/letsencrypt
Restart: unless-stopped
Resources:
  CPU: 500m
  Memory: 256Mi–512Mi
````

---

## 3) Nginx Proxy Manager – Konfiguration

### Proxy Host für Booking-App

```
Domain: {BOOKING_DOMAIN} (z. B. booking.example.com)
Scheme: http
Forward Hostname/IP: neu-booking-app:3000
Forward Port: 3000
Enable HTTPS: Yes
HTTP/2 Support: Yes
Force HTTPS: Yes
HSTS Enabled: Yes (31536000 Sekunden)
SSL Certificate: Letsencrypt (Auto-Renew)
```

### Proxy Host für Directus CMS

```
Domain: {CMS_DOMAIN} (z. B. cms.example.com)
Scheme: http
Forward Hostname/IP: directus-container:8055
Forward Port: 8055
Enable HTTPS: Yes
SSL Certificate: Letsencrypt (Auto-Renew)
Custom Locations / Advanced:
  - Auth Basic (optional, falls nicht öffentlich)
```

### Custom Locations (Optional für Booking-App)

```
Path: /api/healthcheck
Scheme: http
Forward to: neu-booking-app:3000
(Zur internen Überwachung)
```

---

## 4) GitHub Actions – Deployment via GHCR

### Workflow-Datei: `.github/workflows/docker-deploy.yml`

```yaml
name: Build & Push to GHCR

on:
  push:
    branches: [main, production]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_ENV=production
            NEXT_PUBLIC_BASE_URL=https://${{ secrets.BOOKING_DOMAIN }}
```

### Deployment auf VPS (Manual via SSH + Docker Pull)

**Option A: SSH-Trigger (nach GitHub Actions Push)**

```bash
# Auf VPS ausführen
docker pull ghcr.io/{GITHUB_OWNER}/neu_22042026_rent:latest
docker stop neu-booking-app || true
docker rm neu-booking-app || true
docker run -d \
  --name neu-booking-app \
  --network nginx-net \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_BASE_URL="https://${BOOKING_DOMAIN}" \
  -e NEXT_PUBLIC_TURNSTILE_SITE_KEY="${TURNSTILE_PUBLIC_KEY}" \
  -e DIRECTUS_URL="http://directus-container:8055" \
  -e MAIL_HOST="${MAIL_HOST}" \
  -e MAIL_PORT="${MAIL_PORT}" \
  -e MAIL_USER="${MAIL_USER}" \
  -e MAIL_PASS="${MAIL_PASS}" \
  -e MAIL_FROM="${MAIL_FROM}" \
  -e MAIL_TO="${MAIL_TO}" \
  -e MAIL_BOOKING_TO="${MAIL_BOOKING_TO}" \
  -e MAIL_CONTACT_TO="${MAIL_CONTACT_TO}" \
  --health-cmd="curl -f http://localhost:3000/health || exit 1" \
  --health-interval=30s \
  ghcr.io/{GITHUB_OWNER}/neu_22042026_rent:latest
```

**Option B: Docker Compose (empfohlen)**

```yaml
# /opt/docker/docker-compose.yml
version: "3.9"
services:
  neu-booking-app:
    image: ghcr.io/{GITHUB_OWNER}/neu_22042026_rent:latest
    container_name: neu-booking-app
    networks:
      - nginx-net
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_BASE_URL: https://${BOOKING_DOMAIN}
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${TURNSTILE_PUBLIC_KEY}
      DIRECTUS_URL: http://directus-container:8055
      MAIL_HOST: ${MAIL_HOST}
      MAIL_PORT: ${MAIL_PORT}
      MAIL_USER: ${MAIL_USER}
      MAIL_PASS: ${MAIL_PASS}
      MAIL_FROM: ${MAIL_FROM}
      MAIL_TO: ${MAIL_TO}
      MAIL_BOOKING_TO: ${MAIL_BOOKING_TO}
      MAIL_CONTACT_TO: ${MAIL_CONTACT_TO}
      TURNSTILE_SECRET_KEY: ${TURNSTILE_SECRET_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    ports:
      - "3000:3000"
    depends_on:
      - directus-container

  # PostgreSQL wird nur als Directus-Backend verwendet
  # (via separaten Directus Container – siehe Abschnitt 1)

networks:
  nginx-net:
    driver: bridge
```

---

## 5) Environment-Variablen – Staging & Production Setup

### Staging-Setup (Test-Umgebung: rent.staging.ned-it.de)

```env
# Next.js Umgebung
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://rent.staging.ned-it.de

# Directus CMS (öffentlich, kein Token)
DIRECTUS_URL=http://directus-container:8055

# Turnstile (Test-Keys von Cloudflare)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=STAGING_PUBLIC_KEY
TURNSTILE_SECRET_KEY=STAGING_SECRET_KEY

# SMTP Email
MAIL_HOST=smtp.ionos.com
MAIL_PORT=587
MAIL_USER=staging-noreply@example.com
MAIL_PASS=STAGING_SMTP_PASSWORD
MAIL_FROM=Staging Monteurzimmer <staging-noreply@example.com>
MAIL_TO=staging-admin@example.com
MAIL_BOOKING_TO=staging-bookings@example.com
MAIL_CONTACT_TO=staging-contact@example.com
```

### Production-Setup (Live-Umgebung)

```env
# Next.js Umgebung
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://booking.example.com

# Directus CMS (öffentlich, kein Token)
DIRECTUS_URL=http://directus-container:8055

# Turnstile (Production-Keys von Cloudflare)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=PRODUCTION_PUBLIC_KEY
TURNSTILE_SECRET_KEY=PRODUCTION_SECRET_KEY

# SMTP Email
MAIL_HOST=smtp.ionos.com
MAIL_PORT=587
MAIL_USER=noreply@example.com
MAIL_PASS=PRODUCTION_SMTP_PASSWORD
MAIL_FROM=Monteurzimmer Buchung <noreply@example.com>
MAIL_TO=admin@example.com
MAIL_BOOKING_TO=booking-team@example.com
MAIL_CONTACT_TO=contact-team@example.com
```

### Sicherheits-Anforderungen für Secrets

- ✅ Alle `SECURE_*` Werte in **Ionos/VPS-Umgebungsvariablen** speichern
- ✅ **Nicht** in GitHub Repository committen (`.env.*` in `.gitignore`)
- ✅ GitHub Secrets für CI/CD verwenden (für Build-Arguments)
- ✅ Regelmäßig rotieren (min. alle 90 Tage)

### Unterschiede: Staging vs. Production

Die Anwendung nutzt **Docker Environment-Variablen** statt `.env`-Dateien für beide Umgebungen.

| Aspekt                | Staging                           | Production                                         |
| --------------------- | --------------------------------- | -------------------------------------------------- |
| **Domain**            | `rent.staging.ned-it.de`          | `booking.example.com`                              |
| **Directus**          | Staging-Instance (dev-daten)      | Production-Instance (live-daten)                   |
| **Turnstile Keys**    | Test-Keys (Sandbox)               | Production-Keys                                    |
| **Mail**              | Test-Mailbox (`staging-noreply@`) | Produktions-Mailbox (`noreply@`)                   |
| **SSL**               | Let's Encrypt (autom. renew)      | Let's Encrypt (autom. renew)                       |
| **Monitoring**        | Logs in stdout (docker logs)      | Centralized Logging (optional)                     |
| **Backup-Häufigkeit** | Täglich um 03:00                  | Täglich um 02:00 (+ stündliche Snapshots optional) |

**Deployment-Branching:**

- `staging` Branch → GitHub Actions baut → Docker Image `staging` tag → VPS Staging zieht
- `production` Branch → GitHub Actions baut → Docker Image `latest` + `v{version}` tag → VPS Prod zieht

---

## 6) Datenbank & Backups – Directus

### Datenbankstruktur (Directus-verwaltet)

Die App greift auf Daten über **Directus REST API** zu – keine direkte DB-Zugriffe.

**Verwaltete Inhalte in Directus:**

- **Rooms** – Zimmerausstattungen, Amenities, Verfügbarkeit
- **Room Pricing** – Preise pro Zimmer und Zeitraum
- **Bookings** – Buchungsdaten (via App → Directus API)
- **Contacts** – Kontaktformular-Einträge (via App → Directus API)
- **Settings** – Globale Konfiguration (Buchungsrichtlinien, etc.)

### PostgreSQL Backend

PostgreSQL läuft **nur als Direktus-Backend** (nicht direkt von der App genutzt).

```bash
# PostgreSQL im Docker Container
Container: postgres-container
Port: 5432 (intern, nicht exposed)
Database: directus
User: directus_user
```

### Backup-Strategie

**Option A: PostgreSQL Dump (vollständiges Backup)**

```bash
# Täglich um 02:00 Uhr
0 2 * * * /opt/scripts/backup-postgresql.sh

# Skript-Beispiel: /opt/scripts/backup-postgresql.sh
#!/bin/bash
BACKUP_DIR="/data/backups"
DB_CONTAINER="postgres-container"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# PostgreSQL Dump (komprimiert)
docker exec $DB_CONTAINER pg_dump -U directus_user directus | gzip > \
  $BACKUP_DIR/directus_db_$TIMESTAMP.sql.gz

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "directus_db_*.sql.gz" -mtime +30 -delete

echo "Backup erstellt: directus_db_$TIMESTAMP.sql.gz"
```

**Option B: Directus File Sync (empfohlen für Production)**

```bash
# Via Directus Admin UI oder CLI:
# Settings → Backup & Restore → Export Database
# (Automatisiert via Directus CLI in Cron)

#!/bin/bash
# /opt/scripts/backup-directus.sh
BACKUP_DIR="/data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

docker exec directus-container npx directus database snapshot \
  /data/backups/directus_snapshot_$TIMESTAMP.json

find $BACKUP_DIR -name "directus_snapshot_*.json" -mtime +30 -delete
```

### Backup-Restore

```bash
# Aus PostgreSQL Dump
docker exec -i postgres-container psql -U directus_user directus < \
  /data/backups/directus_db_20260425_020000.sql.gz

# Oder via Directus UI nach Docker Restart
```

---

## 7) Deployment-Sequenz (Checkliste für Hosting-Team)

### Phase 1: Vorbereitung (Pre-Deployment)

- [ ] Ionos VPS bereitgestellt (Ubuntu 22.04 LTS empfohlen)
- [ ] Docker & Docker Compose installiert
- [ ] Nginx Proxy Manager Container läuft
- [ ] Directus CMS Container vorbereitet
- [ ] PostgreSQL Container erstellt oder Ionos Managed DB konfiguriert
- [ ] Domain registriert & DNS auf VPS zeigend
- [ ] SSL-Zertifikat via Nginx PM Let's Encrypt angefordert

### Phase 2: Deployment

- [ ] GitHub Personal Access Token (PAT) mit `packages:read` erstellt
- [ ] Docker Login zu GHCR: `docker login ghcr.io`
- [ ] `.env.production` auf VPS mit allen Secrets gefüllt
- [ ] `docker-compose.yml` an `/opt/docker/` kopiert
- [ ] `docker-compose up -d` ausgeführt
- [ ] Container-Status geprüft: `docker-compose ps`
- [ ] Healthchecks bestätigt: `curl https://booking.example.com/health`

### Phase 3: Validierung

- [ ] Booking-Page öffnet: `https://booking.example.com`
- [ ] CMS erreichbar: `https://cms.example.com`
- [ ] Formular-Submit testet (Turnstile, Validierung, E-Mail)
- [ ] E-Mails ankommen (noreply + Bestätigungsmails)
- [ ] Nginx SSL-Zertifikat gültig (HTTPS ohne Warnung)
- [ ] Logs überprüft (keine Fehler): `docker-compose logs neu-booking-app`

### Phase 4: Monitoring & Hardening

- [ ] Docker Restart Policy: `unless-stopped`
- [ ] Logging konfiguriert (zentral oder lokal)
- [ ] Backup-Script eingerichtet & getestet
- [ ] Firewall-Regeln: SSH, HTTP (80), HTTPS (443), PostgreSQL (intern nur)
- [ ] Automated Monitoring Alert für Container-Fehler

---

## 8) Technische Anforderungen der Anwendung

### CPU / Memory (Minimal)

| Komponente  | CPU             | RAM          | Begründung                        |
| ----------- | --------------- | ------------ | --------------------------------- |
| Next.js App | 1 vCore         | 512 MB–1 GB  | Node.js Runtime + React Rendering |
| PostgreSQL  | 500m–1 vCore    | 1–2 GB       | Booking-Queries + Index-Caching   |
| Nginx PM    | 500m            | 256–512 MB   | Reverse Proxy, SSL Termination    |
| **Total**   | **2–2.5 vCore** | **2–3.5 GB** | Für Staging / kleine Production   |

**Empfohlen für Production (>100 Buchungen/Tag)**: 4 vCore, 8 GB RAM

### Storage

```
OS & Docker: 20 GB (minimal)
PostgreSQL Data: 10–50 GB (initial minimal, bei 1000 Buchungen ca. 100 MB)
Backups (30 Tage): 3–5 GB
Nginx PM & Logs: 5 GB
---
Total: 40–80 GB SSD empfohlen
```

### Netzwerk

- **Inbound**: HTTP (80), HTTPS (443), SSH (22 – nur Admin)
- **Outbound**: SMTP (587/465), HTTP/HTTPS (APIs – Directus, Turnstile, Nominatim)
- **Internal Docker**: PostgreSQL (5432), Directus (8055), Next.js (3000)

### Sicherheit

- ✅ **Firewall**: Nur Ports 80, 443 public; SSH eingeschränkt
- ✅ **SSL/TLS**: Let's Encrypt Auto-Renew via Nginx PM
- ✅ **Input Validation**: Zod Schemas + HTML-Escaping
- ✅ **CAPTCHA**: Cloudflare Turnstile für Formulare
- ✅ **Database**: Nur intern erreichbar, User-basierte Zugriffskontrolle
- ✅ **Secrets**: Environment-Variablen, nie in Code
- ✅ **CORS/CSP**: Next.js konfiguriert

---

## 9) Deployment-Fehlerbehandlung

### Häufige Fehler & Lösungen

| Fehler                          | Ursache                              | Lösung                                              |
| ------------------------------- | ------------------------------------ | --------------------------------------------------- |
| **Container startet nicht**     | Image nicht gepulled                 | `docker pull ghcr.io/...` mit Auth                  |
| **Healthcheck failed**          | App startet langsam                  | Timeout in `docker-compose.yml` erhöhen             |
| **Database Connection Refused** | PostgreSQL läuft nicht               | `docker-compose ps` + Logs checken                  |
| **SSL Certificate Error**       | Let's Encrypt nicht ernevert         | Nginx PM Admin UI → SSL Certs → Force Renew         |
| **SMTP-Fehler (E-Mail)**        | Credentials falsch                   | Test: `telnet smtp.ionos.com 587`                   |
| **Turnstile Error 600010**      | Container kann nicht erreicht werden | Host in Nginx PM Check: http://neu-booking-app:3000 |

### Monitoring-Punkte

```bash
# Regelmäßig checken:
docker-compose logs -f neu-booking-app      # Live Logs
docker-compose stats                         # CPU/Memory
curl -I https://booking.example.com         # HTTP Status
docker exec postgres-container psql -U neo_user -d neu_booking -c "SELECT COUNT(*) FROM bookings;"
```

---

## 10) Skalierung & Performance-Optimierung

### Horizontal Scaling (Mehrere App-Instanzen)

```yaml
services:
  neu-booking-app-1:
    image: ghcr.io/.../neu_22042026_rent:latest
    ports: "3001:3000"

  neu-booking-app-2:
    image: ghcr.io/.../neu_22042026_rent:latest
    ports: "3002:3000"

# Nginx PM Load Balancing:
# - Upstream: neu-booking-app-1:3000, neu-booking-app-2:3000
# - Strategy: Round Robin
```

### Caching-Strategie

- **HTTP Cache**: Nginx PM Cache für statische Assets
- **Database Query Caching**: Optional Redis für häufige Queries (Zimmerausstattung)
- **Session Management**: Cookies (Next.js default)

### CDN (Optional)

- Statische Assets (JS, CSS, Images) über **Cloudflare CDN** ausliefern
- API-Responses: Kein CDN-Caching (frische Verfügbarkeitsdaten)

---

## 11) Produktion Checkliste (Pre-Launch)

- [ ] **Code**: Alle Tests grün, Linting erfolgreich
- [ ] **Security Review**: OWASP Top 10 Anforderungen erfüllt
- [ ] **Performance**: Seitenlade-Zeit < 3s (via Lighthouse)
- [ ] **Backup**: Tägliche Backups testen
- [ ] **SSL/TLS**: HTTPS funktioniert, Grade A+ bei SSL Labs
- [ ] **DNS**: Domains richtig konfiguriert (A-Record)
- [ ] **Monitoring**: Alerts für Fehler, Disk-Space, CPU konfiguriert
- [ ] **Incident Plan**: Eskalations-Kontakte definiert
- [ ] **Support Docs**: Team trainiert (Logs, Restart, Backup-Recovery)
- [ ] **Go-Live**: Kanaries-Traffic vor 100% Roll-Out

---

## 12) Kontakt & Support

**Für Fragen zum Deployment:**

- Entwicklungs-Team: (Kontakt)
- VPS Admin: (Kontakt)
- Incident Hotline: (Kontakt)

**Dokumentation Links:**

- Directus Docs: https://directus.io/docs
- GitHub Repository: https://github.com/DN-Apps/rent/tree/qa
- Next.js Deployment: https://nextjs.org/docs/deployment
- Docker Compose: https://docs.docker.com/compose
- Nginx Proxy Manager: https://nginxproxymanager.com/guide/
