from dataclasses import dataclass


@dataclass
class PersonaWeights:
    price: float
    commute: float
    liveability: float
    amenity: float


PERSONA_PROFILES = {
    "student": PersonaWeights(price=0.30, commute=0.25, liveability=0.20, amenity=0.25),
    "professional": PersonaWeights(price=0.20, commute=0.30, liveability=0.25, amenity=0.25),
    "family": PersonaWeights(price=0.20, commute=0.15, liveability=0.30, amenity=0.35),
    "senior": PersonaWeights(price=0.25, commute=0.10, liveability=0.35, amenity=0.30),
}

AMENITY_PREFERENCES = {
    "student": {"gym": 0.3, "parking": 0.2, "lift": 0.2, "swimming_pool": 0.1, "garden": 0.2},
    "professional": {"gym": 0.25, "parking": 0.2, "swimming_pool": 0.15, "clubhouse": 0.15, "lift": 0.15, "security": 0.1},
    "family": {"parking": 0.15, "garden": 0.2, "gym": 0.1, "swimming_pool": 0.1, "clubhouse": 0.15, "security": 0.15, "lift": 0.15},
    "senior": {"garden": 0.25, "lift": 0.25, "parking": 0.15, "security": 0.15, "gym": 0.05, "swimming_pool": 0.05, "clubhouse": 0.1},
}


def get_persona_weights(persona: str) -> PersonaWeights:
    return PERSONA_PROFILES.get(persona, PERSONA_PROFILES["student"])


def compute_price_score(rent: int, budget: int) -> float:
    if rent > budget:
        return max(0, 1 - (rent - budget) / budget)
    ratio = rent / budget
    return round(1 - (ratio * 0.5), 4)


def compute_commute_score(transit_minutes: float | None, driving_minutes: float | None) -> float:
    minutes = transit_minutes or driving_minutes
    if minutes is None:
        return 0.5
    if minutes <= 15:
        return 1.0
    elif minutes <= 30:
        return 0.8
    elif minutes <= 45:
        return 0.6
    elif minutes <= 60:
        return 0.4
    elif minutes <= 90:
        return 0.2
    return 0.1


def compute_amenity_score(property_amenities: list, persona: str) -> float:
    prefs = AMENITY_PREFERENCES.get(persona, AMENITY_PREFERENCES["student"])
    if not property_amenities:
        return 0.0

    score = 0.0
    total_weight = 0.0

    for amenity, weight in prefs.items():
        total_weight += weight
        if amenity in property_amenities:
            score += weight

    return round(score / total_weight, 4) if total_weight > 0 else 0.0


def compute_match_score(
    rent: int,
    budget: int,
    liveability_overall: float,
    transit_minutes: float | None,
    driving_minutes: float | None,
    property_amenities: list,
    persona: str,
) -> dict:
    weights = get_persona_weights(persona)

    price_score = compute_price_score(rent, budget)
    commute_score = compute_commute_score(transit_minutes, driving_minutes)
    liveability_norm = liveability_overall / 100.0
    amenity_score = compute_amenity_score(property_amenities, persona)

    match = (
        weights.price * price_score
        + weights.commute * commute_score
        + weights.liveability * liveability_norm
        + weights.amenity * amenity_score
    )

    match_percent = round(min(match * 100, 100), 2)

    return {
        "match_score": match_percent,
        "price_score": round(price_score * 100, 2),
        "commute_score": round(commute_score * 100, 2),
        "liveability_score": round(liveability_norm * 100, 2),
        "amenity_score": round(amenity_score * 100, 2),
    }
