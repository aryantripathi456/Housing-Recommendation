import httpx
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import get_settings
from app.models.models import CommuteResult

settings = get_settings()

MODE_MAPBOX = {
    "driving": "driving",
    "transit": "driving-traffic",
    "walking": "walking",
}


async def get_mapbox_commute(
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float,
    mode: str = "driving",
) -> dict:
    profile = MODE_MAPBOX.get(mode, "driving")
    url = f"{settings.mapbox_base_url}/directions/v5/mapbox/{profile}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    params = {
        "access_token": settings.mapbox_access_token,
        "geometries": "geojson",
        "overview": "false",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return None
        data = resp.json()
        route = data["routes"][0]
        return {
            "duration_min": round(route["duration"] / 60, 1),
            "distance_km": round(route["distance"] / 1000, 2),
            "geometry": route.get("geometry"),
        }


async def get_mapbox_matrix(
    origins: list[tuple[float, float]],
    dest: tuple[float, float],
    mode: str = "driving",
) -> dict:
    profile = MODE_MAPBOX.get(mode, "driving")
    coords = ";".join(f"{lon},{lat}" for lat, lon in origins)
    coords += f";{dest[1]},{dest[0]}"

    url = f"{settings.mapbox_base_url}/directions/v5/mapbox/{profile}/{coords}"
    params = {
        "access_token": settings.mapbox_access_token,
        "sources": ";".join(f"0:{i}" for i in range(len(origins))),
        "destinations": f"{len(origins)}:0",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return None
        data = resp.json()
        return data


async def compute_commute(
    db: Session,
    property_id: int,
    dest_lat: float,
    dest_lon: float,
    destination_name: str = "Workplace",
) -> dict:
    prop = db.execute(
        text("SELECT latitude, longitude FROM properties WHERE id = :pid"),
        {"pid": property_id},
    ).mappings().first()

    if not prop:
        return None

    results = {}
    for mode in ["driving", "transit", "walking"]:
        commute_data = await get_mapbox_commute(
            prop["latitude"], prop["longitude"],
            dest_lat, dest_lon,
            mode,
        )

        if commute_data:
            existing = db.query(CommuteResult).filter_by(
                property_id=property_id, mode=mode, destination_name=destination_name
            ).first()
            if existing:
                existing.duration_min = commute_data["duration_min"]
                existing.distance_km = commute_data["distance_km"]
            else:
                db.add(CommuteResult(
                    property_id=property_id,
                    destination_name=destination_name,
                    mode=mode,
                    duration_min=commute_data["duration_min"],
                    distance_km=commute_data["distance_km"],
                ))
            results[mode] = {
                "duration_min": commute_data["duration_min"],
                "distance_km": commute_data["distance_km"],
            }
        else:
            results[mode] = None

    db.commit()
    return {
        "driving_minutes": results.get("driving", {}).get("duration_min") if results.get("driving") else None,
        "driving_distance_km": results.get("driving", {}).get("distance_km") if results.get("driving") else None,
        "transit_minutes": results.get("transit", {}).get("duration_min") if results.get("transit") else None,
        "transit_distance_km": results.get("transit", {}).get("distance_km") if results.get("transit") else None,
        "walking_minutes": results.get("walking", {}).get("duration_min") if results.get("walking") else None,
        "walking_distance_km": results.get("walking", {}).get("distance_km") if results.get("walking") else None,
    }
