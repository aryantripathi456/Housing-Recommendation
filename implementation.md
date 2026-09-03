# AI Housing Intelligence Platform — Implementation Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Database Design](#database-design)
5. [Backend API](#backend-api)
6. [Liveability Scoring Engine](#liveability-scoring-engine)
7. [Commute Analysis Engine](#commute-analysis-engine)
8. [Recommendation System (MAUT)](#recommendation-system)
9. [Frontend](#frontend)
10. [Deployment on Render/Railway](#deployment)

---

## Project Overview

An AI-driven real estate analytics platform that combines property listings with geo-spatial intelligence, liveability scoring, commute analysis, and personalized recommendations across four user personas (Student, Professional, Family, Senior Citizen).

**Tech Stack:**
- Backend: Python 3.12 / FastAPI / SQLAlchemy / GeoAlchemy2
- Database: PostgreSQL 15 + PostGIS
- Frontend: React 18 / Vite / Tailwind CSS / Mapbox GL JS / Chart.js
- ML/Scoring: scikit-learn, numpy, pandas
- External APIs: Mapbox Directions/Matrix, OpenStreetMap Overpass

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ with PostGIS extension
- Mapbox API key (free tier works)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd AI-Housing-2
```

### 2. Database Setup

```bash
# Start PostgreSQL (Ubuntu)
sudo pg_ctlcluster 16 main start

# Create database and enable PostGIS
sudo -u postgres createdb ai_housing_project
sudo -u postgres psql -d ai_housing_project -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env   # Edit .env with your DB credentials and Mapbox key

# Run database migrations
alembic upgrade head

# Ingest sample property data (41 properties across Mumbai/Pune)
python -m app.data.ingest

# Fetch POIs from OpenStreetMap and compute liveability scores
python -m app.data.seed

# Generate synthetic price trends
python -m app.data.price_trends

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend available at: http://localhost:5173

### 5. Quick Start (Both Servers)

```bash
chmod +x start.sh
./start.sh
```

---

## Architecture

### Why 4-Tier Modular Architecture

We chose a modular 4-tier architecture for three reasons:

1. **Separation of concerns**: Each layer (data, intelligence, ML, UI) can be developed, tested, and modified independently
2. **Scalability**: The liveability engine can be recomputed without touching the API layer; the frontend can be replaced without changing backend logic
3. **Academic clarity**: Each module maps directly to a chapter in the project synopsis

### Architecture Layers

```
┌──────────────────────────────────────────────────────────────┐
│                   Interactive Application Layer               │
│              React + Tailwind + Mapbox GL JS + Chart.js       │
├──────────────────────────────────────────────────────────────┤
│                   ML Recommendation Layer                     │
│         MAUT + Cosine Similarity + Persona Weighting          │
├──────────────────────────────────────────────────────────────┤
│                   Spatial Intelligence Core                    │
│    Liveability Engine │ Commute Engine │ Affordability Eval    │
├──────────────────────────────────────────────────────────────┤
│                  Data Ingestion & Storage                      │
│     PostgreSQL + PostGIS │ CSV Import │ Overpass API │ Mapbox  │
└──────────────────────────────────────────────────────────────┘
```

### Why FastAPI over Django/Express

- **Async support**: Mapbox API calls are non-blocking, improving response times when computing commute for multiple properties
- **Auto-documentation**: Swagger UI at `/docs` eliminates the need for separate API documentation
- **Pydantic validation**: Request/response schemas are enforced automatically
- **Performance**: Starlette-based, comparable to Node.js for I/O-bound work
- **Python ML ecosystem**: Direct access to numpy, pandas, scikit-learn without bridging languages

### Why PostgreSQL + PostGIS over MongoDB

- **Geospatial queries**: PostGIS supports `ST_DWithin` for radius-based POI searches (find all hospitals within 5km of a property), which is the core of liveability scoring
- **Referential integrity**: Foreign keys ensure data consistency between properties, liveability scores, and commute results
- **SQL joins**: Complex queries across properties + liveability + commute results are straightforward
- **Production-ready**: PostgreSQL handles concurrent reads well, important when multiple users query simultaneously

### Why Mapbox over Google Maps OSRM

- **Free tier**: 100,000 free requests/month is sufficient for a semester project
- **Matrix API**: Can compute travel times from multiple properties to a single destination in one call
- **Traffic data**: Driving-traffic profile includes real-time congestion patterns
- **No billing setup**: Unlike Google Maps, no credit card required for the free tier

---

## Database Design

### Entity Relationship

```
properties (1) ──── (1) liveability_scores
properties (1) ──── (N) commute_results
properties (1) ──── (N) price_trends
pois (standalone, queried spatially)
user_profiles (standalone, used for recommendations)
```

### Key Tables

| Table | Records | Purpose |
|---|---|---|
| `properties` | 41 | Property listings with PostGIS geometry column |
| `pois` | 7,693 | OpenStreetMap points of interest (hospitals, schools, etc.) |
| `liveability_scores` | 41 | Pre-computed 5-dimension scores per property |
| `commute_results` | Dynamic | Cached commute times from Mapbox API |
| `price_trends` | 492 | 12 months of synthetic rent history per property |
| `user_profiles` | N/A | User persona preferences for recommendations |

### Why PostGIS Geometry Column on Properties

The `location` column (Geometry type, SRID 4326) enables spatial queries like:

```sql
-- Find all POIs within 5km of a property
SELECT * FROM pois
WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    5000
);
```

This is faster and more accurate than calculating haversine distances in Python for large datasets. The Python haversine is used as a fallback when PostGIS is not available.

---

## Backend API

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/properties` | List properties with filters (city, locality, budget, bedrooms) |
| `GET` | `/api/properties/{id}` | Property detail with liveability breakdown |
| `GET` | `/api/properties/{id}/liveability` | Full liveability score breakdown |
| `GET` | `/api/properties/{id}/price-trends` | 12-month price trend data |
| `POST` | `/api/recommend` | Get ranked recommendations based on persona + budget |
| `POST` | `/api/affordability/check` | Rent-to-income analysis |
| `GET` | `/api/liveability/map-data` | All properties with scores for map rendering |
| `GET` | `/api/personas` | Persona definitions and weight profiles |
| `GET` | `/api/localities` | Available cities and localities |
| `GET` | `/api/dashboard/stats` | Dashboard summary statistics |

### Example: Get Recommendations

```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "persona": "student",
    "budget": 20000,
    "bedrooms": 2,
    "monthly_income": 30000,
    "workplace_lat": 18.5590,
    "workplace_lon": 73.7868
  }'
```

Response includes ranked properties with:
- `match_score`: Overall match percentage (0-100%)
- `price_score`, `commute_score`, `liveability_score`, `amenity_score`: Sub-scores
- `affordability_label`: "Affordable" / "Moderate Risk" / "Over Budget"
- `commute`: Driving/transit/walking times
- `liveability`: 5-dimension breakdown

---

## Liveability Scoring Engine

### Algorithm

The liveability score is computed using a **Gaussian distance decay function** combined with **weighted aggregation** across 5 dimensions.

#### Step 1: Distance Decay

For each POI near a property, compute a decay score:

```
score = exp(-distance² / (2 * σ²))
where σ = 500m (standard deviation)
```

| Distance | Score |
|---|---|
| 200m | 0.92 |
| 500m | 0.61 |
| 1km | 0.14 |
| 2km | 0.01 |

**Why Gaussian decay instead of linear?**
Linear decay treats a hospital at 1km the same regardless of whether alternatives exist. Gaussian decay naturally weights nearby amenities much higher, which better reflects real-world behavior — people walk to nearby amenities but rarely walk 2km to a grocery store.

#### Step 2: Category Normalization

Each dimension is normalized to 0-100 using:

```
dimension_score = (avg_decay_score × 0.7 + density_bonus × 0.3) × 100
```

The `density_bonus` rewards areas with many POIs (a neighborhood with 10 schools scores higher than one with 1 school, even if the nearest is equally close).

#### Step 3: Weighted Aggregation

```
Overall = 0.25 × Transport
        + 0.20 × Education
        + 0.20 × Healthcare
        + 0.15 × Shopping
        + 0.20 × Environment
```

**Why these weights?**
Based on the literature review in the project synopsis — transport access is the most critical factor for urban housing decisions (Song et al., 2018), followed by education and healthcare (essential services), then environment quality, and shopping convenience.

### POI Data Source

POIs are fetched from **OpenStreetMap Overpass API** covering the Mumbai-Pune metropolitan region (bounding box: 18.4°N to 19.5°N, 72.7°E to 74.0°E). Categories:

| Category | Query Tags | Typical Count |
|---|---|---|
| Transport | railway stations, bus stops, metro, tram | ~1,500 |
| Education | schools, colleges, universities, libraries | ~700 |
| Healthcare | hospitals, clinics, pharmacies, doctors | ~4,000 |
| Shopping | supermarkets, grocery, convenience, mall | ~800 |
| Environment | parks, gardens, playgrounds | ~400 |

---

## Commute Analysis Engine

### How It Works

1. User provides workplace coordinates (lat/lon)
2. For each property, call **Mapbox Matrix API** with origin (property) → destination (workplace)
3. Results include travel time in 3 modes: driving, driving-traffic (transit), walking
4. Results are cached in `commute_results` table to avoid redundant API calls

### Mapbox Integration

```python
# Profile options
"driving"           # Standard driving time
"driving-traffic"   # Includes real-time traffic congestion
"walking"           # Pedestrian routes
```

API call pattern:
```
GET https://api.mapbox.com/directions/v5/mapbox/driving/{lon1},{lat1};{lon2},{lat2}?access_token=...
```

### Commute Score Translation

Raw minutes are converted to a 0-100 score:

| Commute Time | Score | Meaning |
|---|---|---|
| < 15 min | 100% | Excellent |
| 15-30 min | 80% | Good |
| 30-45 min | 60% | Moderate |
| 45-60 min | 40% | Poor |
| 60-90 min | 20% | Very Poor |
| > 90 min | 10% | Terrible |

### Graceful Fallback

If the Mapbox API is unavailable (rate limit, network error), the system falls back to zero scores and the recommendation still works — just without commute data. This prevents a single API failure from breaking the entire platform.

---

## Recommendation System

### MAUT (Multi-Attribute Utility Theory)

The recommendation engine uses MAUT, a well-established decision-making framework from operations research. It's ideal for this use case because:

1. **Multi-criteria**: Housing decisions involve trade-offs across price, commute, liveability, and amenities
2. **Persona-specific**: Different users weight criteria differently
3. **Transparent**: Each sub-score is visible to the user, not a black box

### Match Score Formula

```
Match Score = w₁ × Price_Affordability
           + w₂ × Commute_Score
           + w₃ × Liveability_Index
           + w₄ × Amenity_Similarity
```

### Persona Weight Profiles

| Persona | Price | Commute | Liveability | Amenity | Rationale |
|---|---|---|---|---|---|
| **Student** | 0.30 | 0.25 | 0.20 | 0.25 | Budget-constrained, needs transport to campus |
| **Professional** | 0.20 | 0.30 | 0.25 | 0.25 | Commute to office is top priority |
| **Family** | 0.20 | 0.15 | 0.30 | 0.35 | Schools, parks, safety matter most |
| **Senior** | 0.25 | 0.10 | 0.35 | 0.30 | Green spaces, healthcare access critical |

### Sub-Score Calculations

#### Price Affordability Score
```python
if rent > budget:
    score = max(0, 1 - (rent - budget) / budget)
else:
    ratio = rent / budget
    score = 1 - (ratio × 0.5)
```
Properties over budget get penalized but not zeroed out. Within budget, lower rent = higher score.

#### Commute Score
Based on transit time (falls back to driving if transit unavailable):
- < 15 min → 100%
- 15-30 min → 80%
- 30-45 min → 60%
- 45-60 min → 40%
- 60-90 min → 20%
- > 90 min → 10%

#### Amenity Similarity Score (Cosine Similarity)

Each persona has an amenity preference vector:

```python
# Student preferences
{"gym": 0.3, "parking": 0.2, "lift": 0.2, "swimming_pool": 0.1, "garden": 0.2}

# Family preferences
{"parking": 0.15, "garden": 0.2, "gym": 0.1, "swimming_pool": 0.1,
 "clubhouse": 0.15, "security": 0.15, "lift": 0.15}
```

The property's amenity list is compared against these preferences using weighted overlap:
```
amenity_score = Σ(weight_i × present_i) / Σ(weight_i)
```

### Why Not Collaborative Filtering?

For a semester project with no real user interaction data, collaborative filtering would produce meaningless results (cold start problem). MAUT works immediately with zero user history. The system is designed so collaborative filtering can be added later as user data accumulates.

---

## Frontend

### Component Architecture

```
App
├── Header (navigation: Explore | Recommend | Compare)
├── Sidebar
│   ├── Explore Mode → Filter panel (city, bedrooms, budget)
│   └── Recommend Mode → Persona selector, budget slider, income input
├── MapView (Mapbox GL JS with color-coded markers)
├── PropertyList (scrollable cards with liveability badges)
├── RecommendationView (ranked cards with match scores)
├── PropertyDetail
│   ├── Radar chart (liveability breakdown)
│   ├── Score progress bars (price, commute, liveability, amenity)
│   ├── Commute display (driving/transit/walking)
│   ├── Line chart (12-month price trends)
│   └── Amenities tags
└── ComparisonMatrix (side-by-side table for up to 3 properties)
```

### Map Color Coding

- **Explore mode**: Markers colored by rent (green=cheap, blue=moderate, orange=expensive, red=luxury)
- **Recommend mode**: Markers colored by match score (green=high match, red=low match)
- Marker labels show `₹XXK` (explore) or `XX%` (recommend)

### Proxy Configuration

The Vite dev server proxies `/api` requests to the FastAPI backend:

```js
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:8000',
  },
}
```

This avoids CORS issues during development and means the frontend code uses relative URLs (`/api/properties`) that work in both dev and production (when served from the same origin).

---

## Deployment on Render or Railway

### Option A: Render (Recommended for Semester Projects)

Render offers a free tier for web services and managed PostgreSQL.

#### Step 1: Push to GitHub

```bash
cd AI-Housing-2
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/AI-Housing-2.git
git push -u origin main
```

#### Step 2: Create PostgreSQL Database on Render

1. Go to [render.com](https://render.com) → **New** → **PostgreSQL**
2. Name: `ai-housing-db`
3. Plan: **Free** (90 days, then paid)
4. Note the **Internal Database URL** (format: `postgresql://user:password@...`)

#### Step 3: Deploy Backend (Web Service)

1. **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `ai-housing-backend`
   - **Runtime**: Python 3
   - **Build Command**:
     ```bash
     cd backend && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     cd backend && alembic upgrade head && python -m app.data.ingest && python -m app.data.seed && python -m app.data.price_trends && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Environment Variables**:
     ```
     DATABASE_URL=postgresql://user:password@your-render-db-host:5432/ai_housing_db
     MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token
     ```

4. Click **Create Web Service**

The build command runs migrations, seeds data, and starts the server on every deploy.

#### Step 4: Deploy Frontend (Static Site)

1. **New** → **Static Site**
2. Connect same GitHub repo
3. Settings:
   - **Name**: `ai-housing-frontend`
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Publish Directory**: `frontend/dist`
   - **Rewrites/Routes**: Add a rewrite rule:
     - Source: `/*`
     - Destination: `/index.html`
     (This enables client-side routing)

4. **Environment Variable** (if needed for API URL):
   ```
   VITE_API_URL=https://ai-housing-backend.onrender.com
   ```

5. Update `frontend/src/services/api.js` to use the production URL:
   ```js
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || '/api',
     timeout: 30000,
   });
   ```

#### Step 5: Update CORS

In `backend/app/main.py`, add the Render frontend URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-housing-frontend.onrender.com",
    ],
    ...
)
```

#### Render Cost Estimate

| Service | Plan | Monthly Cost |
|---|---|---|
| PostgreSQL | Free (90 days) → Starter | $0 → $7/mo |
| Backend Web Service | Free (sleeps after inactivity) → Starter | $0 → $7/mo |
| Frontend Static Site | Free | $0 |
| **Total** | | **$0-14/mo** |

---

### Option B: Railway

Railway provides a simpler deployment experience with automatic detection.

#### Step 1: Create `railway.json` in project root

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && alembic upgrade head && python -m app.data.ingest && python -m app.data.seed && python -m app.data.price_trends && uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

#### Step 2: Create Procfile (for Railway)

```
web: cd backend && alembic upgrade head && python -m app.data.ingest && python -m app.data.seed && python -m app.data.price_trends && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Step 3: Deploy

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your repo
3. Railway auto-detects Python and Node.js
4. Add a **PostgreSQL plugin**:
   - Click **New** → **Database** → **PostgreSQL**
   - Railway auto-generates `DATABASE_URL`
5. Set environment variables:
   ```
   DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
   MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token
   ```
6. Railway will build and deploy automatically

#### Step 4: Add Frontend as Separate Service

1. In the same Railway project, **New** → **GitHub Repo** (same repo, different root directory)
2. Or create a separate Railway project for the frontend
3. Build: `cd frontend && npm install && npm run build`
4. Start: `npx serve frontend/dist -l 3000`
5. Or use Vercel for the frontend (free, faster) and Railway for the backend only

#### Railway Cost Estimate

| Resource | Plan | Monthly Cost |
|---|---|---|
| Backend (512MB RAM) | Hobby | $5/mo |
| PostgreSQL | Hobby | $5/mo |
| Frontend (Static) | Hobby | $1/mo |
| **Total** | | **~$11/mo** |

Railway has a $5 free trial credit per month. After that, Hobby plan starts at $5/mo per service.

---

### Production Considerations

#### Environment Variables (Both Platforms)

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
MAPBOX_ACCESS_TOKEN=pk.your_token
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
```

#### Database Migrations on Deploy

Both Render and Railway run the start command on every deploy. The `alembic upgrade head` in the start command ensures migrations are applied automatically. For production, you should:

1. Use `alembic` in a separate build step (not runtime)
2. Or use a pre-deploy hook if the platform supports it

#### CORS Configuration

Update `allow_origins` in `main.py` to include your production frontend URL:

```python
allow_origins=[
    "http://localhost:5173",
    "https://your-frontend.onrender.com",
    "https://your-frontend.up.railway.app",
]
```

#### Performance Optimization for Production

1. **Database indexes**: Already added on `city`, `locality`, `rent` columns
2. **POI caching**: The `pois` table is seeded once and rarely changes
3. **Commute caching**: Results are stored in `commute_results` table
4. **Static frontend**: Serve the built `dist/` folder, not the dev server

#### Switching to Production Frontend API URL

```js
// frontend/src/services/api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});
```

Set `VITE_API_URL` in your hosting platform to `https://your-backend.onrender.com` or `https://your-backend.up.railway.app`.

---

### Deployment Checklist

- [ ] Push code to GitHub
- [ ] Add your Mapbox API key to `.env`
- [ ] Set up PostgreSQL database (Render/Railway managed)
- [ ] Deploy backend service with correct start command
- [ ] Verify `/api/health` returns `{"status": "healthy"}`
- [ ] Verify `/api/properties` returns property data
- [ ] Deploy frontend static site
- [ ] Set CORS origins for production frontend URL
- [ ] Test full flow: persona selection → recommendations → property detail
- [ ] Verify Mapbox map loads with property markers
