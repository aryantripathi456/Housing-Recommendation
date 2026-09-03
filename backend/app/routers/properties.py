from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import asyncio

from app.database import get_db
from app.models.models import Property, LiveabilityScore
from app.schemas.schemas import (
    PropertyResponse, PropertyDetail, LiveabilityBreakdown,
    RecommendRequest, MatchScoreResponse, AffordabilityRequest, AffordabilityResponse,
)
from app.ml.recommender import compute_match_score
from app.services.affordability import evaluate_affordability
from app.services.commute import compute_commute
from app.services.liveability import compute_liveability

router = APIRouter(prefix="/api", tags=["properties"])


@router.get("/properties")
def list_properties(
    city: Optional[str] = None,
    locality: Optional[str] = None,
    min_rent: Optional[int] = None,
    max_rent: Optional[int] = None,
    bedrooms: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = "SELECT p.id, p.name, p.address, p.city, p.locality, p.latitude, p.longitude, p.rent, p.bedrooms, p.area_sqft, p.property_type, p.amenities, COALESCE(ls.overall, 0) as liveability_overall FROM properties p LEFT JOIN liveability_scores ls ON p.id = ls.property_id WHERE 1=1"
    params = {}

    if city:
        query += " AND p.city = :city"
        params["city"] = city
    if locality:
        query += " AND p.locality = :locality"
        params["locality"] = locality
    if min_rent:
        query += " AND p.rent >= :min_rent"
        params["min_rent"] = min_rent
    if max_rent:
        query += " AND p.rent <= :max_rent"
        params["max_rent"] = max_rent
    if bedrooms:
        query += " AND p.bedrooms = :bedrooms"
        params["bedrooms"] = bedrooms

    query += " ORDER BY ls.overall DESC NULLS LAST"

    rows = db.execute(text(query), params).mappings().all()
    return [dict(r) for r in rows]


@router.get("/properties/{property_id}")
def get_property(property_id: int, db: Session = Depends(get_db)):
    row = db.execute(
        text("""
            SELECT p.*, COALESCE(ls.transport, 0) as transport, COALESCE(ls.education, 0) as education,
                   COALESCE(ls.healthcare, 0) as healthcare, COALESCE(ls.shopping, 0) as shopping,
                   COALESCE(ls.environment, 0) as environment, COALESCE(ls.overall, 0) as overall
            FROM properties p LEFT JOIN liveability_scores ls ON p.id = ls.property_id
            WHERE p.id = :pid
        """),
        {"pid": property_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Property not found")

    result = dict(row)
    result["liveability"] = {
        "transport": result.pop("transport"),
        "education": result.pop("education"),
        "healthcare": result.pop("healthcare"),
        "shopping": result.pop("shopping"),
        "environment": result.pop("environment"),
        "overall": result.pop("overall"),
    }
    return result


@router.get("/properties/{property_id}/liveability")
def get_liveability(property_id: int, recompute: bool = False, db: Session = Depends(get_db)):
    if recompute:
        result = compute_liveability(db, property_id)
        return {"property_id": property_id, **result}

    score = db.query(LiveabilityScore).filter_by(property_id=property_id).first()
    if not score:
        result = compute_liveability(db, property_id)
        return {"property_id": property_id, **result}

    return {
        "property_id": property_id,
        "transport": score.transport,
        "education": score.education,
        "healthcare": score.healthcare,
        "shopping": score.shopping,
        "environment": score.environment,
        "overall": score.overall,
    }


@router.post("/recommend")
async def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    query = """
        SELECT p.id, p.name, p.city, p.locality, p.rent, p.bedrooms, p.area_sqft, p.amenities,
               COALESCE(ls.overall, 0) as liveability_overall
        FROM properties p
        LEFT JOIN liveability_scores ls ON p.id = ls.property_id
        WHERE p.bedrooms = :bedrooms AND p.rent <= :budget
        ORDER BY ls.overall DESC NULLS LAST
    """
    rows = db.execute(text(query), {"bedrooms": req.bedrooms, "budget": req.budget}).mappings().all()

    results = []
    for row in rows:
        commute = None
        if req.workplace_lat and req.workplace_lon:
            try:
                commute = await compute_commute(
                    db, row["id"],
                    req.workplace_lat, req.workplace_lon,
                )
            except Exception:
                commute = None

        scores = compute_match_score(
            rent=row["rent"],
            budget=req.budget,
            liveability_overall=row["liveability_overall"],
            transit_minutes=commute.get("transit_minutes") if commute else None,
            driving_minutes=commute.get("driving_minutes") if commute else None,
            property_amenities=row["amenities"] or [],
            persona=req.persona.value,
        )

        affordability = evaluate_affordability(row["rent"], req.monthly_income)

        results.append({
            "property_id": row["id"],
            "property_name": row["name"],
            "city": row["city"],
            "locality": row["locality"],
            "rent": row["rent"],
            "bedrooms": row["bedrooms"],
            "area_sqft": row["area_sqft"],
            "match_score": scores["match_score"],
            "price_score": scores["price_score"],
            "commute_score": scores["commute_score"],
            "liveability_score": scores["liveability_score"],
            "amenity_score": scores["amenity_score"],
            "affordability_label": affordability["label"],
            "commute": commute,
            "liveability": {
                "transport": row["transport"] if "transport" in row else 0,
                "education": row["education"] if "education" in row else 0,
                "healthcare": row["healthcare"] if "healthcare" in row else 0,
                "shopping": row["shopping"] if "shopping" in row else 0,
                "environment": row["environment"] if "environment" in row else 0,
                "overall": row["liveability_overall"],
            },
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results


@router.post("/affordability/check")
def check_affordability(req: AffordabilityRequest, db: Session = Depends(get_db)):
    prop = db.execute(
        text("SELECT rent FROM properties WHERE id = :pid"),
        {"pid": req.property_id},
    ).mappings().first()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    result = evaluate_affordability(prop["rent"], req.monthly_income)
    return {"property_id": req.property_id, "rent": prop["rent"], "monthly_income": req.monthly_income, **result}


@router.get("/liveability/map-data")
def get_map_data(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT p.id, p.name, p.city, p.locality, p.latitude, p.longitude, p.rent, p.bedrooms, p.area_sqft,
               COALESCE(ls.overall, 0) as liveability_overall
        FROM properties p LEFT JOIN liveability_scores ls ON p.id = ls.property_id
    """)).mappings().all()
    return [dict(r) for r in rows]


@router.get("/personas")
def get_personas():
    return {
        "personas": [
            {"id": "student", "name": "Student", "description": "Prioritizes low rent, university proximity, budget dining, public transport"},
            {"id": "professional", "name": "Working Professional", "description": "Prioritizes commute to offices, co-working, gyms, high-speed connectivity"},
            {"id": "family", "name": "Family", "description": "Prioritizes schools, hospitals, parks, safety, residential stability"},
            {"id": "senior", "name": "Senior Citizen", "description": "Prioritizes green spaces, walking access, pharmacies, ground/elevator access"},
        ],
        "weights": {
            "student": {"price": 0.30, "commute": 0.25, "liveability": 0.20, "amenity": 0.25},
            "professional": {"price": 0.20, "commute": 0.30, "liveability": 0.25, "amenity": 0.25},
            "family": {"price": 0.20, "commute": 0.15, "liveability": 0.30, "amenity": 0.35},
            "senior": {"price": 0.25, "commute": 0.10, "liveability": 0.35, "amenity": 0.30},
        }
    }


@router.get("/localities")
def get_localities(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT DISTINCT city, locality FROM properties ORDER BY city, locality")).fetchall()
    return [{"city": r[0], "locality": r[1]} for r in rows]


@router.get("/properties/{property_id}/price-trends")
def get_price_trends(property_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        text("SELECT month, rent, locality_avg_rent FROM price_trends WHERE property_id = :pid ORDER BY month"),
        {"pid": property_id},
    ).mappings().all()

    if not rows:
        return {"months": [], "rents": [], "locality_avgs": []}

    return {
        "months": [r["month"] for r in rows],
        "rents": [r["rent"] for r in rows],
        "locality_avgs": [r["locality_avg_rent"] for r in rows],
    }


@router.get("/properties/{property_id}/commute")
async def get_commute(
    property_id: int,
    workplace_lat: float = Query(...),
    workplace_lon: float = Query(...),
    db: Session = Depends(get_db),
):
    commute = await compute_commute(db, property_id, workplace_lat, workplace_lon)
    return commute


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.execute(text("SELECT COUNT(*) FROM properties")).scalar()
    avg_rent = db.execute(text("SELECT AVG(rent) FROM properties")).scalar()
    avg_liveability = db.execute(text("SELECT AVG(overall) FROM liveability_scores")).scalar()
    city_counts = db.execute(text("SELECT city, COUNT(*) FROM properties GROUP BY city")).fetchall()
    locality_avg = db.execute(text("""
        SELECT p.locality, AVG(ls.overall) as avg_score, AVG(p.rent) as avg_rent
        FROM properties p JOIN liveability_scores ls ON p.id = ls.property_id
        GROUP BY p.locality ORDER BY avg_score DESC LIMIT 10
    """)).fetchall()

    return {
        "total_properties": total,
        "avg_rent": round(avg_rent) if avg_rent else 0,
        "avg_liveability": round(avg_liveability, 1) if avg_liveability else 0,
        "city_distribution": [{"city": r[0], "count": r[1]} for r in city_counts],
        "top_localities": [{"locality": r[0], "avg_score": round(r[1], 1), "avg_rent": round(r[2])} for r in locality_avg],
    }
