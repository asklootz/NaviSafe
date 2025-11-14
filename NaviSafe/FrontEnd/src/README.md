# NaviSafe - Aviation Obstacle Reporting System

NaviSafe er en webapplikasjon for rapportering av luftfartshindre til Norges Nasjonale Register for Luftfartshindre (NRL), utviklet som del av et universitetsprosjekt for UiA, Kartverket og Norsk Luftambulanse.

## 🚀 Funksjoner

### For Piloter
- **Interaktivt kart** med Leaflet for nøyaktig posisjonering
- **Live GPS-posisjonering** med nøyaktighetsvisning
- **Punkt- og linjehindre** (Tower, Power Line, Wind Turbine, Building, etc.)
- **Bildeupplasting** fra kamera eller galleri
- **Utkast og innsending** av rapporter
- **Oversikt over egne rapporter** med status

### For Administratorer (NRL)
- **Oversikt over alle rapporter** fra piloter
- **Duplikatdeteksjon** (automatisk varsling om lignende rapporter innenfor 100m)
- **Godkjenning av rapporter** for registrering i NRL
- **Sortering og filtrering** av rapporter
- **Detaljert rapportvisning** med GPS-data

## 🛠️ Teknologi

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Kart**: Leaflet.js med OpenStreetMap
- **Ikoner**: Lucide Icons
- **Backend**: Planlagt C# ASP.NET Core med MariaDB

## 📦 Installasjon

### Kjøre lokalt

1. Klon repositoryet:
```bash
git clone https://github.com/[ditt-brukernavn]/navisafe.git
cd navisafe
```

2. Åpne `index.html` i nettleseren:
```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

Ingen byggesteg eller npm install nødvendig! Applikasjonen kjører direkte i nettleseren.

### Alternativt: Bruk en lokal server

For bedre GPS-funksjonalitet og testing:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (npx)
npx serve

# PHP
php -S localhost:8000
```

Åpne deretter `http://localhost:8000` i nettleseren.

## 👤 Demo-brukere

### Piloter
- **Brukernavn**: `pilot1`, `pilot2`, `pilot3`
- **Organisasjon**: NLA, Luftforsvaret, Politiet
- **Passord**: `any` (hvilken som helst tekst)

### Administrator
- **Brukernavn**: `admin`
- **Organisasjon**: Kartverket
- **Passord**: `any` (hvilken som helst tekst)

## 🗺️ Bruk av kartet

### Punkt-hindre (Point)
1. Velg "Point" i kartverktøyet
2. Klikk på kartet der hinderet er
3. Eller bruk "Use My GPS Position" for nåværende posisjon
4. Eller skriv inn koordinater manuelt

### Linje-hindre (LineString)
1. Velg "Line" i kartverktøyet
2. Klikk flere ganger på kartet for å tegne linjen
3. Minimum 2 punkter kreves

### GPS-funksjonalitet
- GPS-posisjonen oppdateres automatisk i sanntid
- Nøyaktighet vises i meter (±)
- Fungerer på mobile enheter med GPS
- Fallback til Kristiansand, Norge hvis GPS ikke er tilgjengelig

## 📱 Responsivt design

Applikasjonen er fullt responsiv og fungerer på:
- 📱 Mobile enheter
- 💻 Tablets
- 🖥️ Desktop

## 🌓 Dark Mode

Støtter automatisk dark/light mode med toggle-knapp i høyre hjørne.

## 🔄 Dataflyt

```
Pilot rapporterer hinder
    ↓
Rapport lagres med GPS-data og geometri
    ↓
Admin mottar rapport i dashboard
    ↓
Duplikatsjekk (100m radius)
    ↓
Admin godkjenner → Registreres i NRL
```

## 📊 Datamodell

### ObstacleReport
```javascript
{
  id: string,
  reporter_id: string,
  reporter_name: string,
  organization: 'NLA' | 'Luftforsvaret' | 'Politiet',
  obstacle_type: 'Tower' | 'Power Line' | 'Wind Turbine' | 'Building' | 'Other',
  geometry_type: 'Point' | 'LineString',
  geometry: GeoJSON,
  height_meters: number,
  description: string,
  status: 'Draft' | 'Submitted' | 'Approved',
  reporter_position: GeoJSON Point,
  reporter_position_accuracy: number (meters),
  created_at: ISO8601,
  updated_at: ISO8601
}
```

### GeoJSON Format (WGS84)
```javascript
// Point
{
  type: 'Point',
  coordinates: [longitude, latitude]
}

// LineString
{
  type: 'LineString',
  coordinates: [[lon1, lat1], [lon2, lat2], ...]
}
```

## 🔮 Fremtidige forbedringer

- [ ] Koble til C# ASP.NET Core backend
- [ ] MariaDB database-integrasjon
- [ ] Autentisering med JWT tokens
- [ ] Bildelagring og komprimering
- [ ] Export til GeoJSON/KML
- [ ] Offline-støtte med Service Workers
- [ ] Push-notifikasjoner for administratorer
- [ ] Rapporthistorikk og revisjonslogg
- [ ] Mer avansert duplikatdeteksjon

## 📄 Filstruktur

```
navisafe/
├── index.html          # Hovedfil med HTML-struktur og styling
├── app.js             # All JavaScript-logikk og state management
├── README.md          # Denne filen
└── guidelines/        # Backend-integrasjonsguider (eksisterende)
    ├── MariaDB-Integration-Guide.md
    ├── Backend-Integration.md
    └── database-setup.sql
```

## 🤝 Bidrag

Dette er et universitetsprosjekt for UiA, Kartverket og Norsk Luftambulanse.

## 📝 Lisens

[Spesifiser lisens her]

## 👥 Kontakt

For spørsmål om prosjektet, kontakt UiA eller Kartverket.

---

**Utviklet med ❤️ for luftfartssikkerhet i Norge**
