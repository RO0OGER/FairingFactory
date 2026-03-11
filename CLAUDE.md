# Fairing Factory – Claude Code Kontext

## Projektübersicht

**Fairing Factory** ist ein Schweizer E-Commerce-Startup, das hochwertige Motorrad-Verkleidungen (Fairings) importiert, in der Schweiz qualitätsprüft und verkauft. Das Projekt befindet sich in der MVP-Phase.

**Gründer:** Roger Widmer  
**Branche:** Motorradzubehör / E-Commerce  
**Standort:** Schweiz  
**Sprache:** Deutsch (Schweiz), ggf. mehrsprachig (DE/FR/EN)

---

## Geschäftsmodell

### USP (Alleinstellungsmerkmal)
- Import von Fairings → Qualitätsprüfung in der Schweiz → Versand an Kunden
- **Kein Dropshipping** – Ware wird geprüft und in der Schweiz gelagert
- Transparente Preise inkl. Zoll & Versand
- Schnelle Lieferzeiten (Schweizer Lager)
- Persönlicher Kundenservice
- Community-Einbindung (Kunden senden Bike-Fotos, erhalten Rabatte)

### Zielgruppe
- Motorradfahrer:innen in der Schweiz und im deutschsprachigen Raum
- Sport- und Naked-Bike-Fahrer:innen
- Personen, die ihr Motorrad optisch individualisieren möchten
- Kaufbereit für geprüfte Qualität (höherer Preis als Direktimport)

### Produkte (Fairing-Kits für populäre Modelle)
- Kawasaki ZX-6R
- Yamaha YZF-R6
- Honda CBR600RR
- Suzuki GSX-R600
- (weitere Modelle geplant)

### Ertragsmodell
- Verkauf von Fairing-Kits über Online-Shop
- Kosten: Einkauf, Import/Zoll/Transport, Lager, Marketing, Versand

---

## Befehle

```bash
npm start          # Dev-Server auf http://localhost:4200
npm run build      # Production-Build → dist/
npm test           # Unit-Tests mit Vitest
ng generate component components/<name>  # Neue Komponente
```

**Supabase konfigurieren:** `src/environments/environment.ts` – `url` und `anonKey` eintragen (aus dem Supabase-Dashboard unter Settings → API).

---

## Technischer Stack (MVP)

### Frontend
- **Framework:** Angular
- Einfache, übersichtliche Webseite als Demoversion
- Responsive Design (Motorrad-Community nutzt Mobile)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- Zweck MVP: Interessenten-Daten und Feedback speichern
- Kein vollständiges Shopsystem in Phase 1

### MVP-Features
1. Landingpage mit Logo, Beschreibung, Produktbildern
2. Erklärung des Bestellprozesses
3. Kontakt-/Vorbestellformular (→ Supabase)
4. Grobe Preisübersicht
5. Kurzer Feedback-Fragebogen (→ Supabase)

### Geplante Erweiterungen (Post-MVP)
- Vollständiger Online-Shop mit Bestellabwicklung
- Motorradmodell-Konfigurator (Farbe, Design, individuell)
- Community-Galerie (Kunden-Bike-Fotos)
- Rabattsystem für eingereichte Fotos

---

## Marke & Design

### Name
**Fairing Factory**

### Tagline
> „Geprüfte Fairings. Klar geliefert."

### Logo
- Schriftzug „Fairing Factory" (klare, moderne Schrift)
- Grafisches Element: Motorradfront (Frontansicht)
- Schweizer Kreuz als Qualitätsmerkmal

### Farben
| Farbe | Hex (Richtwert) | Bedeutung |
|-------|----------------|-----------|
| Rot   | `#D10000`      | Schweizer Flagge, Dynamik, Sportlichkeit |
| Weiss | `#FFFFFF`      | Qualität, Klarheit, Vertrauen |
| Schwarz (optional) | `#1A1A1A` | Professionalität, Kontrast |

### Designprinzipien
- Schlicht und auffällig
- Gut sichtbar auf Website, Social Media, Verpackungen, Aufklebern
- Passt zur Motorrad-Szene (sportlich, vertrauenswürdig)

---

## Datenmodell (Supabase – MVP)

```sql
-- Vorbestellungen / Interessenten
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  bike_model TEXT,         -- z.B. "Kawasaki ZX-6R"
  fairing_interest TEXT,   -- z.B. "Rot/Weiss", "Custom"
  message TEXT,
  newsletter BOOLEAN DEFAULT false
);

-- Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  would_buy BOOLEAN,
  price_ok BOOLEAN,
  swiss_quality_important BOOLEAN,
  free_text TEXT
);

-- Community-Fotos (Post-MVP)
CREATE TABLE community_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_name TEXT,
  email TEXT,
  bike_model TEXT,
  photo_url TEXT,         -- Supabase Storage URL
  approved BOOLEAN DEFAULT false,
  discount_sent BOOLEAN DEFAULT false
);
```

---

## Projektstruktur (Angular MVP)

```
fairing-factory/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── hero/           # Landingpage Hero-Bereich
│   │   │   ├── how-it-works/   # Prozess-Erklärung (3 Schritte)
│   │   │   ├── products/       # Fairing-Übersicht / Preise
│   │   │   ├── contact-form/   # Vorbestell- / Kontaktformular
│   │   │   ├── feedback-form/  # Feedback-Fragebogen
│   │   │   └── community/      # Community-Galerie (Post-MVP)
│   │   ├── services/
│   │   │   └── supabase.service.ts
│   │   └── app.component.ts
│   ├── environments/
│   │   ├── environment.ts      # Supabase URL + anon key
│   │   └── environment.prod.ts
│   └── assets/
│       ├── logo/
│       └── fairings/           # Produktbilder
├── CLAUDE.md                   # Diese Datei
└── README.md
```

---

## Wichtige Hinweise für Claude Code

### Sprache
- UI-Texte auf **Deutsch (Schweiz)** – kein „ß", stattdessen „ss"
- Codekommentare können auf Deutsch oder Englisch sein
- Fehlermeldungen für Nutzer auf Deutsch


### Saisonalität
- Motorradsaison in der Schweiz: ca. März–Oktober
- Marketing und Kampagnen ggf. saisonal planen

### Datenschutz (Schweiz)
- Schweizer Datenschutzgesetz (revDSG) beachten
- Supabase Row Level Security (RLS) aktivieren
- Keine unnötigen Daten sammeln

---

## Bekannte Risiken / Herausforderungen
- Abhängigkeit von ausländischen Lieferanten
- Lagerkosten in der Schweiz
- Saisonabhängigkeit des Marktes
- Preissensibilität (günstigere Direktimporte als Konkurrenz)

---

## Nächste Schritte
1. ~~Angular MVP-Webseite aufsetzen~~ ✓
2. Supabase-Projekt anlegen + Tabellen migrieren (SQL in «Datenmodell» oben)
3. ~~Kontakt- und Feedbackformular implementieren~~ ✓
4. Supabase URL + anon key in `src/environments/environment.ts` eintragen
5. Feedback von Motorradfahrern und Werkstätten einholen
6. Angebot basierend auf Feedback anpassen
