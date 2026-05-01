# FEWS Web Next Prototype Plan

## Purpose

This is a readjusted, code-first plan for a **prototype** of FEWS Web Next.

It is intentionally different from the earlier strategic plan in one key way:

- **For now, all relevant information lives inside the webpage/app code itself**
- **The prototype does not pull live data from stations or external FEWS services**
- **Station metadata, example readings, alerts, forecasts, glossary content, and help content are seeded locally**

That makes the prototype less efficient and less "real," but far more buildable, reviewable, and demoable in the short term.

## Prototype Goal

Build a web-only FEWS prototype that proves:

- a clearer information architecture than the current FEWS web
- faster perceived loading than the current ArcGIS-heavy experience
- multiple role-oriented views without needing separate apps
- a prototype data model that can later be swapped from local seed data to real APIs
- a more understandable presentation of stations, alerts, forecasts, basins, and historical context

## What Changes From Claude's Plan

Claude's version mixes:

- long-term architecture
- infrastructure decisions
- real-time streaming
- production migration
- public-sector rollout concerns

For the prototype, we should shrink that into something actually codable now.

### Replace

- `REST + SSE + live stations`

With:

- `local typed seed data + local state + mock refresh behavior`

### Replace

- `12-month phased platform migration`

With:

- `4 prototype milestones`

### Replace

- `production infrastructure decisions`

With:

- `frontend architecture + content model + demo scenarios`

### Keep

- web-only strategy
- role-based UX
- modular screens
- mobile-first responsiveness
- emphasis on alerts, stations, basins, and forecasts

## What We Learned From The Reference Sample

From the local sample in [fews.ideam.gov.co/index.html](D:\Sammy\Code\FEWS\fews.ideam.gov.co\index.html) and [fews.ideam.gov.co/visorfews/Bienvenida.js](D:\Sammy\Code\FEWS\fews.ideam.gov.co\visorfews\Bienvenida.js):

- the current FEWS web is shipped as a **Create React App bundle**
- it uses a **large minified JS payload** with strong **ArcGIS** dependence
- it includes a **welcome/tutorial popup**
- it references the FEWS web root at `https://fews.ideam.gov.co/visorfews/`
- the bundle clearly contains ArcGIS map infrastructure and at least some FEWS/domain strings like `estacion`

Practical takeaway:

- the current product appears map-first and heavy
- the prototype should instead be **content-first and workflow-first**
- mapping should be present, but should not dominate the first usable experience

### Extraction Note

I could confirm platform-level details and some FEWS/domain strings from the local shipped bundle, but **I could not cleanly extract a trustworthy station catalog from the minified code alone** without calling live services. So the prototype plan below assumes we will create a **seed station dataset** manually or semi-manually inside the app.

## Prototype Product Definition

### Core idea

The prototype is a **single web app** with all demo data embedded locally, designed to feel like a plausible "next FEWS web" instead of a static mockup.

### Users covered in the prototype

1. Hydrology analyst
2. Civil protection operator
3. Public/basic viewer

Farmer mode can be deferred unless time allows. Public mode can already cover much of that simplicity.

## Prototype Scope

### In scope

- basin overview
- station directory
- station detail pages
- active alerts view
- forecast summary view
- historical trend view with mock data
- role switcher
- responsive layout
- embedded glossary/help/tutorial content
- embedded sample bulletins and explanatory text

### Out of scope for v1 prototype

- live station ingestion
- real authentication
- SSE/WebSockets
- user-saved dashboards in backend
- exports backed by real services
- production GIS editing workflows
- full national coverage if it slows the prototype down

## Recommended Prototype Slice

Use a focused geography first.

### Start with 1-2 basins

- Magdalena
- Cauca

### Seed 12-20 stations total

Enough to show:

- normal state
- warning state
- critical state
- rising trend
- falling trend
- missing/late data

This is much better for a prototype than pretending to support 90+ stations with weak content.

## Product Structure

### App shell

- left navigation on desktop
- bottom/tab navigation on mobile
- top status bar with last update time, selected role, selected basin

### Main sections

1. Overview
2. Stations
3. Alerts
4. Forecasts
5. History
6. Learn

## Screen-by-Screen Plan

### 1. Overview

Purpose:

- give immediate orientation
- show current hydrological situation
- let the user drill into the important areas fast

Content:

- national or basin snapshot
- alert counters by severity
- highlighted stations in warning/critical states
- next 72-hour forecast summary
- last update timestamp
- top bulletin or advisory

### 2. Stations

Purpose:

- make stations discoverable without forcing map interaction first

Content:

- searchable station list
- filters by basin, department, municipality, variable, status
- optional map/list toggle
- status chips like `Normal`, `Warning`, `Critical`, `Offline`

Each station card should show:

- station name
- code
- basin
- department / municipality
- variables measured
- current status
- latest reading time

### 3. Station Detail

Purpose:

- turn each station into a useful operational page

Content:

- station metadata
- current values
- trend mini-charts
- thresholds
- alert history
- related basin forecast
- notes/explanations

### 4. Alerts

Purpose:

- make actionability clearer than the current map-heavy approach

Content:

- current active alerts
- severity grouping
- impacted basins/areas
- recommended actions
- source timestamp
- related stations

### 5. Forecasts

Purpose:

- separate forecast interpretation from raw station inspection

Content:

- 24h / 48h / 72h outlook
- plain-language summary
- confidence label
- expected basin behavior
- comparison cards for optimistic / expected / adverse scenarios

### 6. History

Purpose:

- show context, not just current numbers

Content:

- recent trends for seed stations
- event comparison module
- benchmark comparisons like `above seasonal average`
- historical notable events module

### 7. Learn

Purpose:

- embed all supporting information in the app itself

Content:

- what FEWS is
- what each alert level means
- how to read station cards
- glossary
- tutorial video link/content
- FAQ

## Data Strategy For The Prototype

All prototype data should be stored locally in the codebase.

### Recommended data files

- `stations.ts` or `stations.json`
- `station-readings.ts`
- `alerts.ts`
- `forecasts.ts`
- `historical-series.ts`
- `bulletins.ts`
- `glossary.ts`
- `basins.ts`

### Recommended data model

#### Station metadata

- `id`
- `code`
- `name`
- `basinId`
- `department`
- `municipality`
- `latitude`
- `longitude`
- `variables`
- `status`
- `description`

#### Current reading

- `stationId`
- `timestamp`
- `waterLevel`
- `flow`
- `rainfall`
- `qualityFlag`
- `trend`

#### Alert

- `id`
- `severity`
- `title`
- `summary`
- `affectedBasins`
- `affectedStationIds`
- `recommendedActions`
- `issuedAt`
- `expiresAt`

#### Forecast

- `id`
- `basinId`
- `window`
- `summary`
- `confidence`
- `scenario`
- `expectedImpact`

#### Historical point

- `stationId`
- `timestamp`
- `value`
- `variable`

## How To Keep It "Inside The Webpage"

For this prototype, "inside the webpage" should mean:

- seed data imported into the frontend bundle
- no server dependency required to demo the main flows
- optional `public/data/*.json` files if we want content editable without recompiling

Best recommendation:

- keep the structured data in local JSON or TS modules
- treat them as a fake backend boundary
- access them through small frontend data adapters so later we can swap local data for real API calls

That gives us a clean future migration path.

## Suggested Technical Shape

Because the current FEWS sample is already React-based, the most practical prototype path is:

- **React + TypeScript**
- **local JSON/TS seed data**
- **lightweight charting**
- **simple map layer or optional static map shell**
- **no backend required for prototype v1**

### Important note

Even though the old debate mentions vanilla JS and HTMX, that is not required for the prototype. Since the reference product is already React-based and this is a demo/prototype, **React is the more codable choice** unless the current repo strongly suggests otherwise.

## UI Direction

The prototype should not feel like a generic dashboard.

### Visual thesis

An operational hydrology workspace: calm, high-contrast, map-aware, and data-dense without looking bureaucratic or cluttered.

### Design rules

- map is supportive, not the only entry point
- typography should do most of the hierarchy work
- avoid card overload
- prioritize alert state and trend recognition
- use one accent scale for severity
- mobile layout must preserve scanning speed

## Prototype Architecture

### Recommended app layers

1. `app shell`
2. `seed data adapters`
3. `feature modules`
4. `shared visualization components`

### Feature modules

- `overview`
- `stations`
- `alerts`
- `forecasts`
- `history`
- `learn`

## Build Order

### Milestone 1: Information Foundation

- define routes
- define seed data schema
- create basin, station, alert, forecast, glossary datasets
- build app shell and navigation

Deliverable:

- navigable FEWS prototype with placeholder but structured content

### Milestone 2: Operational Core

- build overview
- build station list
- build station detail
- build alert center

Deliverable:

- prototype feels usable for analyst/operator demo

### Milestone 3: Interpretation Layer

- build forecast view
- build history view
- connect related records across stations, alerts, and basins
- add role switcher

Deliverable:

- prototype explains not just data, but decisions

### Milestone 4: Polish For Demo

- responsive tuning
- tutorial/help content
- mock refresh states
- accessibility pass
- seed-content refinement

Deliverable:

- presentation-ready FEWS Web Next prototype

## Mock Behavior To Simulate "Live" FEWS

Without calling real stations, we can still simulate freshness.

### Add

- last updated clock
- fake periodic refresh of values from local arrays
- status transitions for demo mode
- selectable scenarios like `Normal Day`, `Heavy Rain Event`, `Flood Warning`

This will make the prototype feel alive without building real ingestion.

## Content Seeding Plan

Since reliable station extraction from the minified sample was limited, use a mixed seeding approach:

### Source A

Manual seed dataset based on:

- basin names
- station naming conventions
- FEWS concepts already visible in the current product

### Source B

Reference content from the current FEWS web experience:

- tutorial/help ideas
- FEWS terminology
- alert framing
- basin/station-oriented workflows

### Source C

Prototype-only explanatory content:

- glossary
- alert definitions
- forecast explanation text

## "Codable" Deliverables

Instead of promising the full FEWS transformation, the prototype should explicitly aim to produce:

1. A working frontend app
2. A local seed dataset that models FEWS entities
3. A role-based navigation model
4. Demo scenarios for alerts and forecasts
5. A clear swap path from local data to real APIs later

## Future Swap Plan

Design every data read through a thin adapter layer.

### Today

- `getStations()` reads local seed data
- `getAlerts()` reads local seed data
- `getForecasts()` reads local seed data

### Later

The exact same functions can call:

- FEWS APIs
- ArcGIS services
- internal aggregation endpoints

That is the cleanest bridge from prototype to production.

## Final Recommendation

If the goal is to make FEWS Web Next feel buildable now, the prototype should be framed as:

**"A self-contained FEWS web prototype with embedded station, alert, forecast, and historical content, structured so the local seed data can later be replaced by real services."**

That is much more codable than trying to prototype:

- live ingestion
- SSE
- full national infrastructure
- multi-system migration

## Suggested Next Step

The best immediate next move is to turn this plan into:

1. a frontend file structure
2. a seed data schema
3. a first-pass screen implementation order

If you want, I can do that next and turn this plan into an actual scaffold for the prototype app.
