from pydantic import BaseModel, Field
from typing import Optional
from app.models.models import PersonaMode


class PropertyBase(BaseModel):
    name: str
    address: str
    city: str
    locality: str
    latitude: float
    longitude: float
    rent: int
    bedrooms: int
    area_sqft: int
    property_type: str = "apartment"
    amenities: list[str] = []


class PropertyResponse(PropertyBase):
    id: int
    liveability_overall: Optional[float] = None
    match_score: Optional[float] = None

    class Config:
        from_attributes = True


class PropertyDetail(PropertyBase):
    id: int
    liveability: Optional["LiveabilityBreakdown"] = None
    commute: Optional["CommuteInfo"] = None

    class Config:
        from_attributes = True


class LiveabilityBreakdown(BaseModel):
    transport: float
    education: float
    healthcare: float
    shopping: float
    environment: float
    overall: float


class CommuteInfo(BaseModel):
    driving_minutes: Optional[float] = None
    driving_distance_km: Optional[float] = None
    transit_minutes: Optional[float] = None
    transit_distance_km: Optional[float] = None
    walking_minutes: Optional[float] = None
    walking_distance_km: Optional[float] = None


class RecommendRequest(BaseModel):
    persona: PersonaMode
    budget: int = Field(..., ge=5000, le=500000)
    workplace_lat: Optional[float] = None
    workplace_lon: Optional[float] = None
    bedrooms: int = Field(default=2, ge=1, le=6)
    monthly_income: int = Field(default=50000, ge=10000)


class MatchScoreResponse(BaseModel):
    property_id: int
    property_name: str
    city: str
    locality: str
    rent: int
    bedrooms: int
    area_sqft: int
    match_score: float
    price_score: float
    commute_score: float
    liveability_score: float
    amenity_score: float
    affordability_label: str
    liveability: Optional[LiveabilityBreakdown] = None
    commute: Optional[CommuteInfo] = None


class AffordabilityRequest(BaseModel):
    property_id: int
    monthly_income: int = Field(..., ge=10000)


class AffordabilityResponse(BaseModel):
    property_id: int
    rent: int
    monthly_income: int
    rent_to_income_ratio: float
    label: str
    advice: str


class FilterParams(BaseModel):
    city: Optional[str] = None
    locality: Optional[str] = None
    min_rent: Optional[int] = None
    max_rent: Optional[int] = None
    bedrooms: Optional[int] = None
