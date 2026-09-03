# AI Housing Intelligence Platform

AI-powered real estate analytics platform for Mumbai and Pune. Compare liveability scores, commute times, neighborhood data, and get personalized property recommendations.

## Features

- **Interactive Map** — Color-coded properties by rent range on Mapbox
- **Liveability Scoring** — 5-dimension scoring (Transport, Education, Healthcare, Shopping, Environment) using Gaussian distance decay across 7,600+ POIs
- **Commute Analysis** — Driving, transit, and walking times via Mapbox Directions API
- **AI Recommendations** — MAUT-based match scoring with 4 persona profiles (Student, Professional, Family, Senior)
- **Price Trends** — 12-month simulated rent history per property
- **Property Comparison** — Side-by-side table with all metrics
- **Affordability Check** — Rent-to-income ratio evaluation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Mapbox GL JS, Chart.js |
| Backend | FastAPI, Python, SQLAlchemy, PostGIS |
| Database | PostgreSQL with PostGIS extension |
| APIs | Mapbox Directions, Overpass (OpenStreetMap) |

## Project Structure

```
AI-Housing-2/
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API client
│   │   └── index.css       # Tailwind + custom styles
│   └── vite.config.js
├── backend/                # FastAPI server
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic (liveability, commute, affordability)
│   │   ├── ml/             # Recommendation engine
│   │   ├── models/         # SQLAlchemy models
│   │   └── schemas/        # Pydantic schemas
│   ├── data/               # Sample property CSV
│   └── alembic/            # DB migrations
└── .gitignore
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL with PostGIS

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure database in .env
# DB_URL=postgresql://postgres:postgres@localhost:5432/ai_housing_project

# Create database
psql -U postgres -c "CREATE DATABASE ai_housing_project;"
psql -U postgres -d ai_housing_project -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run migrations
alembic upgrade head

# Ingest sample data
python -c "from app.data.ingest import ingest; ingest()"

# Start server
uvicorn app.main:app --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` with API proxy to `localhost:8000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | List properties with optional filters |
| GET | `/api/properties/{id}` | Single property detail |
| GET | `/api/properties/{id}/liveability` | Liveability breakdown |
| GET | `/api/properties/{id}/price-trends` | Price trend data |
| GET | `/api/properties/{id}/commute` | Commute times to a workplace |
| POST | `/api/recommend` | AI-ranked property recommendations |
| POST | `/api/affordability/check` | Rent affordability evaluation |
| GET | `/api/liveability/map-data` | All properties with scores for map |
| GET | `/api/personas` | Available persona profiles |
| GET | `/api/localities` | Localities with avg scores |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/config` | Mapbox token |

## Sample Data

41 properties across Mumbai and Pune with:
- Rent, bedrooms, area, property type, amenities
- Latitude/longitude coordinates
- 12 months of simulated price history per property
- Pre-computed liveability scores for all properties
