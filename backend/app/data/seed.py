import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.services.pois import fetch_pois_from_overpass
from app.services.liveability import compute_all_liveability


def seed():
    print("=== Fetching POIs from OpenStreetMap Overpass API ===")
    fetch_pois_from_overpass()

    print("\n=== Computing liveability scores for all properties ===")
    db = SessionLocal()
    compute_all_liveability(db)
    db.close()

    print("\n=== Seeding complete! ===")


if __name__ == "__main__":
    seed()
