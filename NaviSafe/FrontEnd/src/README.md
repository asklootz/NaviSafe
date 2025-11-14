# 🛫 NaviSafe - Aviation Obstacle Reporting System

En webapplikasjon for rapportering av luftfartshindre til **Norges Nasjonale Register for Luftfartshindre (NRL)**.

**Utviklet for:** Universitetet i Agder (UiA), Kartverket og Norsk Luftambulanse

---

## 🚀 Teknologi Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS v4
- **Kart:** Leaflet.js + React Leaflet
- **UI Components:** Shadcn/ui
- **Build Tool:** Vite
- **Production Server:** Nginx (Docker)

---

## 🐳 Kjøre med Docker (Anbefalt)

### Forutsetninger
- Docker Desktop installert ([Last ned her](https://www.docker.com/products/docker-desktop))
- Docker Compose (inkludert i Docker Desktop)

### Rask start

```bash
# 1. Bygg og start applikasjonen
docker-compose up -d

# 2. Åpne i nettleser
open http://localhost:8080
```

**Container administrasjon:**
```bash
# Se logger
docker-compose logs -f

# Stopp applikasjonen
docker-compose down

# Rebuild etter kodeendringer
docker-compose up -d --build
```

### Docker kommandoer (uten Docker Compose)

```bash
# Bygg Docker image
docker build -t navisafe:latest .

# Kjør container
docker run -d \
  -p 8080:80 \
  --name navisafe-app \
  navisafe:latest

# Stopp og fjern container
docker stop navisafe-app
docker rm navisafe-app
```

---

## 💻 Lokal Utvikling (uten Docker)

### Forutsetninger
- Node.js 20+ ([Last ned her](https://nodejs.org/))
- npm eller pnpm

### Installasjon

```bash
# 1. Installer dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Åpne http://localhost:3000
```

### Tilgjengelige Scripts

```bash
npm run dev       # Start utviklingsserver (port 3000)
npm run build     # Bygg produksjonsversjon
npm run preview   # Preview produksjonsbygg lokalt
npm run lint      # Kjør ESLint
```

---

## 👥 Demo Brukere

| Brukernavn | Rolle | Organisasjon | Passord |
|------------|-------|--------------|---------|
| `pilot1` | Pilot | NLA (Norsk Luftambulanse) | `any` |
| `pilot2` | Pilot | Luftforsvaret | `any` |
| `pilot3` | Pilot | Politiet | `any` |
| `admin` | Administrator | Kartverket (NRL) | `any` |

**Merk:** Dette er mock-login. Passord kan være hva som helst.

---

## ✨ Funksjoner

### 🧑‍✈️ For Piloter og Flybesetning
- ✅ **Rapporter luftfartshindre** med GPS-posisjon
- 🗺️ **Interaktivt Leaflet-kart**
  - Punkt-geometri (enkelthinderr)
  - Linje-geometri (kraftlinjer, kabler)
- 📍 **GPS-tracking** i sanntid
- 📸 **Bildeopplasting** fra mobil/kamera
- 💾 **Lagre utkast** eller send direkte til NRL
- 📊 **Se egne rapporter** med statusoversikt
- ⚠️ **Duplikatvarsel** ved innsending

### 👨‍💼 For NRL-Administratorer
- 📋 **Se alle innsendte rapporter**
- ✅ **Godkjenn rapporter** til NRL-database
- 🔍 **Filtrer og søk** i rapporter
- ⚠️ **Automatisk duplikatdeteksjon** (100m radius)
- 📊 **Statistikk** per organisasjon
- 🗺️ **Kartvisning** av alle hindre

---

## 📁 Prosjektstruktur

```
NaviSafe/
├── components/
│   ├── AdminDashboard.tsx       # Admin dashboard
│   ├── AdminAppSidebar.tsx      # Admin sidebar
│   ├── LoginScreen.tsx          # Login skjerm
│   ├── MapComponent.tsx         # Leaflet kart komponent
│   ├── PilotDashboard.tsx       # Pilot dashboard
│   ├── PilotReportForm.tsx      # Rapportskjema
│   ├── ThemeProvider.tsx        # Mørk/lys modus
│   └── ui/                      # Shadcn/ui komponenter
├── lib/
│   ├── api.ts                   # API klient (mock)
│   ├── mockData.ts              # Mock data
│   └── types.ts                 # TypeScript types
├── styles/
│   └── globals.css              # Global CSS + Tailwind
├── guidelines/                  # Dokumentasjon
├── App.tsx                      # Hovedapp
├── Dockerfile                   # Docker build config
├── docker-compose.yml           # Docker Compose config
├── nginx.conf                   # Nginx webserver config
├── package.json                 # Dependencies
└── vite.config.ts               # Vite build config
```

---

## 🔧 Produksjonsdrift

### Docker Production Features
- ✅ **Multi-stage build** (minimerer image størrelse)
- ✅ **Nginx webserver** (battle-tested, høy ytelse)
- ✅ **Gzip kompresjon** aktivert
- ✅ **Security headers** konfigurert
- ✅ **Asset caching** (1 år for statiske filer)
- ✅ **Health checks** inkludert
- ✅ **SPA routing** støtte

### Deployment til Sky

**Docker Hub:**
```bash
docker build -t yourusername/navisafe:latest .
docker push yourusername/navisafe:latest
```

**Deploy hvor som helst:**
```bash
docker run -d -p 80:80 yourusername/navisafe:latest
```

---

## 🌍 Miljøvariabler

For fremtidig backend-integrasjon:

```bash
# .env.production
VITE_API_URL=https://api.kartverket.no/navisafe
VITE_MAP_TILES_URL=https://tiles.kartverket.no/{z}/{x}/{y}.png
```

---

## 🗺️ Kartdata

- **Basiskart:** OpenStreetMap (kan byttes til Kartverket)
- **Koordinatsystem:** WGS84 (EPSG:4326)
- **Format:** GeoJSON
- **Geometrityper:** Point, LineString

---

## 🔐 Sikkerhet

### Implementerte Security Headers
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer-when-downgrade
```

**Merk:** Dette er en prototype med mock-autentisering. For produksjon må implementeres:
- ✅ Ekte autentisering (OAuth2, SAML)
- ✅ HTTPS/TLS
- ✅ CORS-policy
- ✅ Rate limiting
- ✅ Input validering

---

## 📊 Database Schema

Se `guidelines/Backend-Integration.md` for fullstendig database-design.

**Hovedtabeller:**
- `users` - Brukere og roller
- `obstacle_reports` - Hinderrapporter
- `obstacle_report_geometries` - GeoJSON geometrier
- `obstacle_report_images` - Bildeopplastinger

---

## 🧪 Testing

```bash
# Kjør tests (når implementert)
npm test

# E2E tests
npm run test:e2e
```

---

## 🤝 Bidrag

Dette er et universitetsprosjekt utviklet i samarbeid med:

- **Universitetet i Agder (UiA)** - Utdanning og forskning
- **Kartverket** - Nasjonalt register for luftfartshindre (NRL)
- **Norsk Luftambulanse** - Operative krav fra luftfart

---

## 📄 Lisens

Utviklet som universitetsprosjekt for UiA (2025)

---

## 📧 Kontakt

For spørsmål om prosjektet:
- **UiA:** [kontakt@uia.no](mailto:kontakt@uia.no)
- **Kartverket:** [post@kartverket.no](mailto:post@kartverket.no)
- **NLA:** [post@norskluftambulanse.no](mailto:post@norskluftambulanse.no)

---

## 🚀 Quick Reference

```bash
# Development
npm install && npm run dev          # Start dev server
open http://localhost:3000           # Åpne i nettleser

# Docker Production
docker-compose up -d                 # Start i Docker
open http://localhost:8080           # Åpne i nettleser
docker-compose logs -f               # Se logger
docker-compose down                  # Stopp

# Build for production
npm run build                        # Bygg til dist/
npm run preview                      # Test produksjonsbygg
```

---

**Made with ❤️ for safer Norwegian aviation** 🇳🇴
