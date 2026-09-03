import random
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.models import Property, PriceTrend


LOCALITY_GROWTH_RATES = {
    "Baner": 0.015,
    "Aundh": 0.012,
    "Kothrud": 0.008,
    "Wakad": 0.018,
    "Hinjewadi": 0.020,
    "Andheri": 0.014,
    "Powai": 0.010,
    "Thane": 0.016,
    "Goregaon": 0.013,
    "Malad": 0.011,
    "Bandra": 0.009,
    "Lower Parel": 0.007,
    "Worli": 0.006,
    "Mahalaxmi": 0.005,
    "Byculla": 0.008,
    "Mulund": 0.012,
    "Kalyan": 0.015,
    "Dombivli": 0.014,
    "Vasai": 0.017,
    "Borivali": 0.011,
}


def generate_price_trends():
    db = SessionLocal()
    properties = db.query(Property).all()

    months = []
    now = datetime.now()
    for i in range(11, -1, -1):
        d = now - timedelta(days=i * 30)
        months.append(d.strftime("%Y-%m"))

    count = 0
    for prop in properties:
        growth_rate = LOCALITY_GROWTH_RATES.get(prop.locality, 0.01)
        base_rent = prop.rent
        seasonal_factors = [0.97, 0.96, 0.98, 1.0, 1.02, 1.03, 1.04, 1.03, 1.01, 1.0, 0.99, 0.98]

        for i, month in enumerate(months):
            trend_factor = (1 + growth_rate) ** (11 - i)
            seasonal = seasonal_factors[i]
            noise = random.uniform(0.95, 1.05)
            rent = int(base_rent * trend_factor * seasonal * noise)

            locality_avg = int(rent * random.uniform(0.95, 1.10))

            trend = PriceTrend(
                property_id=prop.id,
                month=month,
                rent=rent,
                locality_avg_rent=locality_avg,
            )
            db.add(trend)
            count += 1

    db.commit()
    print(f"Generated {count} price trend records for {len(properties)} properties.")
    db.close()


if __name__ == "__main__":
    generate_price_trends()
