import subprocess
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import SessionLocal
from app.models.models import POI

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

OVERPASS_QUERIES = {
    "transport": "[out:json][timeout:120];(node[\"railway\"=\"station\"](18.4,72.7,19.5,74.0);node[\"railway\"=\"halt\"](18.4,72.7,19.5,74.0);node[\"highway\"=\"bus_station\"](18.4,72.7,19.5,74.0);node[\"public_transport\"=\"station\"](18.4,72.7,19.5,74.0);node[\"public_transport\"=\"stop_position\"](18.4,72.7,19.5,74.0);node[\"station\"=\"subway\"](18.4,72.7,19.5,74.0);node[\"station\"=\"tram\"](18.4,72.7,19.5,74.0););out body;",
    "education": "[out:json][timeout:120];(node[\"amenity\"=\"school\"](18.4,72.7,19.5,74.0);node[\"amenity\"=\"college\"](18.4,72.7,19.5,74.0);node[\"amenity\"=\"university\"](18.4,72.7,19.5,74.0);node[\"amenity\"=\"library\"](18.4,72.7,19.5,74.0);node[\"amenity\"=\"kindergarten\"](18.4,72.7,19.5,74.0););out body;",
    "healthcare": "[out:json][timeout:120];(node[\"amenity\"=\"hospital\"](18.4,72.7,19.5,74.0);node[\"amenity\"=\"clinic\"](18.4,72.7,19.5,74.0);node[\"amenity\"=\"pharmacy\"](18.4,72.7,19.5,74.0);node[\"amenity\"=\"doctors\"](18.4,72.7,19.5,74.0););out body;",
    "shopping": "[out:json][timeout:120];(node[\"shop\"=\"supermarket\"](18.4,72.7,19.5,74.0);node[\"shop\"=\"grocery\"](18.4,72.7,19.5,74.0);node[\"shop\"=\"convenience\"](18.4,72.7,19.5,74.0);node[\"amenity\"=\"marketplace\"](18.4,72.7,19.5,74.0);node[\"shop\"=\"mall\"](18.4,72.7,19.5,74.0););out body;",
    "environment": "[out:json][timeout:120];(node[\"leisure\"=\"park\"](18.4,72.7,19.5,74.0);node[\"leisure\"=\"garden\"](18.4,72.7,19.5,74.0);node[\"leisure\"=\"nature_reserve\"](18.4,72.7,19.5,74.0);node[\"landuse\"=\"forest\"](18.4,72.7,19.5,74.0);node[\"leisure\"=\"playground\"](18.4,72.7,19.5,74.0););out body;",
}


def fetch_overpass(query: str) -> list:
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", OVERPASS_URL, "-d", f"data={query}"],
        capture_output=True, text=True, timeout=180,
    )
    if result.returncode != 0:
        return []
    data = json.loads(result.stdout)
    return data.get("elements", [])


def fetch_pois_from_overpass():
    db = SessionLocal()
    total_inserted = 0

    for category, query in OVERPASS_QUERIES.items():
        try:
            elements = fetch_overpass(query)
            count = 0

            for el in elements:
                osm_id = str(el["id"])
                existing = db.query(POI).filter_by(osm_id=osm_id).first()
                if existing:
                    continue

                tags = el.get("tags", {})
                name = tags.get("name", f"{category}_{el['id']}")
                subcategory = (
                    tags.get("railway")
                    or tags.get("highway")
                    or tags.get("public_transport")
                    or tags.get("station")
                    or tags.get("amenity")
                    or tags.get("shop")
                    or tags.get("leisure")
                    or tags.get("landuse")
                    or category
                )

                poi = POI(
                    osm_id=osm_id,
                    name=name,
                    category=category,
                    subcategory=subcategory,
                    latitude=el["lat"],
                    longitude=el["lon"],
                )
                db.add(poi)
                count += 1
                total_inserted += 1

            db.commit()
            print(f"Fetched {len(elements)} POIs for {category}, inserted {count} new")

        except Exception as e:
            print(f"Error fetching {category}: {e}")

    print(f"Total new POIs inserted: {total_inserted}")
    db.close()
    return total_inserted


if __name__ == "__main__":
    fetch_pois_from_overpass()
