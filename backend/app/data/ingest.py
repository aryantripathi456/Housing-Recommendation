import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.models import Property
from sqlalchemy import text


def ingest_properties():
    db = SessionLocal()
    csv_path = os.path.join(os.path.dirname(__file__), "sample_properties.csv")

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            raw = row["amenities"].strip()
            amenities = [a.strip() for a in raw.split("|") if a.strip()] if raw else []
            prop = Property(
                name=row["name"],
                address=row["address"],
                city=row["city"],
                locality=row["locality"],
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                rent=int(row["rent"]),
                bedrooms=int(row["bedrooms"]),
                area_sqft=int(row["area_sqft"]),
                property_type=row["property_type"],
                amenities=amenities,
            )
            db.add(prop)
            count += 1

        db.commit()
        print(f"Ingested {count} properties.")

    db.execute(text("UPDATE properties SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)"))
    db.commit()
    print("Updated geometry locations for all properties.")

    db.close()


if __name__ == "__main__":
    ingest_properties()
