import math
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.models import POI, LiveabilityScore


CATEGORY_WEIGHTS = {
    "transport": 0.25,
    "education": 0.20,
    "healthcare": 0.20,
    "shopping": 0.15,
    "environment": 0.20,
}

CATEGORY_MAP = {
    "railway_station": "transport",
    "bus_station": "transport",
    "metro_station": "transport",
    "tram_stop": "transport",
    "station": "transport",
    "stop": "transport",
    "stop_position": "transport",
    "bus_stop": "transport",
    "halt": "transport",
    "subway": "transport",
    "tram": "transport",
    "school": "education",
    "college": "education",
    "university": "education",
    "library": "education",
    "kindergarten": "education",
    "hospital": "healthcare",
    "clinic": "healthcare",
    "pharmacy": "healthcare",
    "doctors": "healthcare",
    "supermarket": "shopping",
    "grocery": "shopping",
    "marketplace": "shopping",
    "convenience": "shopping",
    "mall": "shopping",
    "park": "environment",
    "garden": "environment",
    "nature_reserve": "environment",
    "forest": "environment",
    "playground": "environment",
}

POI_RATING_WEIGHT = {
    "transport": 1.0,
    "education": 1.0,
    "healthcare": 1.2,
    "shopping": 0.8,
    "environment": 0.9,
}


def gaussian_decay(distance_m: float, sigma: float = 500.0) -> float:
    return math.exp(-(distance_m ** 2) / (2 * sigma ** 2))


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def compute_liveability(db: Session, property_id: int) -> dict:
    prop = db.execute(
        text("SELECT id, latitude, longitude FROM properties WHERE id = :pid"),
        {"pid": property_id},
    ).mappings().first()

    if not prop:
        return None

    prop_lat = prop["latitude"]
    prop_lon = prop["longitude"]

    pois = db.execute(
        text("SELECT name, category, subcategory, latitude, longitude FROM pois")
    ).mappings().all()

    category_scores = {cat: [] for cat in CATEGORY_WEIGHTS}

    for poi in pois:
        mapped_cat = CATEGORY_MAP.get(poi["subcategory"] or poi["category"], None)
        if not mapped_cat:
            continue

        dist = haversine_distance(prop_lat, prop_lon, poi["latitude"], poi["longitude"])
        if dist > 5000:
            continue

        decay = gaussian_decay(dist)
        weight = POI_RATING_WEIGHT.get(mapped_cat, 1.0)
        category_scores[mapped_cat].append(decay * weight)

    normalized = {}
    for cat, scores in category_scores.items():
        if scores:
            avg = sum(scores) / len(scores)
            density_bonus = min(len(scores) / 10, 1.0)
            normalized[cat] = round(min((avg * 0.7 + density_bonus * 0.3) * 100, 100), 2)
        else:
            normalized[cat] = 0.0

    overall = sum(normalized[cat] * CATEGORY_WEIGHTS[cat] for cat in CATEGORY_WEIGHTS)
    overall = round(overall, 2)

    existing = db.query(LiveabilityScore).filter_by(property_id=property_id).first()
    if existing:
        existing.transport = normalized["transport"]
        existing.education = normalized["education"]
        existing.healthcare = normalized["healthcare"]
        existing.shopping = normalized["shopping"]
        existing.environment = normalized["environment"]
        existing.overall = overall
    else:
        score = LiveabilityScore(
            property_id=property_id,
            transport=normalized["transport"],
            education=normalized["education"],
            healthcare=normalized["healthcare"],
            shopping=normalized["shopping"],
            environment=normalized["environment"],
            overall=overall,
        )
        db.add(score)

    db.commit()
    return {
        "transport": normalized["transport"],
        "education": normalized["education"],
        "healthcare": normalized["healthcare"],
        "shopping": normalized["shopping"],
        "environment": normalized["environment"],
        "overall": overall,
    }


def compute_all_liveability(db: Session) -> list:
    properties = db.execute(text("SELECT id FROM properties")).fetchall()
    results = []
    for row in properties:
        result = compute_liveability(db, row[0])
        if result:
            results.append({"property_id": row[0], **result})
    print(f"Computed liveability for {len(results)} properties.")
    return results
