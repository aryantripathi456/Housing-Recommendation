from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
from app.database import Base
import enum


class PersonaMode(str, enum.Enum):
    STUDENT = "student"
    PROFESSIONAL = "professional"
    FAMILY = "family"
    SENIOR = "senior"


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False, index=True)
    locality = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geometry("POINT", srid=4326))
    rent = Column(Integer, nullable=False, index=True)
    bedrooms = Column(Integer, nullable=False)
    area_sqft = Column(Integer, nullable=False)
    property_type = Column(String(50), default="apartment")
    amenities = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    liveability_score = relationship("LiveabilityScore", back_populates="property", uselist=False)
    commute_results = relationship("CommuteResult", back_populates="property")


class POI(Base):
    __tablename__ = "pois"

    id = Column(Integer, primary_key=True, index=True)
    osm_id = Column(String(50), unique=True, index=True)
    name = Column(String(255))
    category = Column(String(50), nullable=False, index=True)
    subcategory = Column(String(50))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geometry("POINT", srid=4326))
    rating = Column(Float, default=0.0)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    persona_mode = Column(SAEnum(PersonaMode), nullable=False)
    name = Column(String(100), default="Guest User")
    monthly_income = Column(Integer, default=50000)
    budget = Column(Integer, nullable=False)
    workplace_lat = Column(Float)
    workplace_lon = Column(Float)
    bedrooms = Column(Integer, default=2)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommuteResult(Base):
    __tablename__ = "commute_results"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    destination_name = Column(String(255))
    mode = Column(String(20), nullable=False)
    duration_min = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="commute_results")


class LiveabilityScore(Base):
    __tablename__ = "liveability_scores"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), unique=True, nullable=False)
    transport = Column(Float, default=0.0)
    education = Column(Float, default=0.0)
    healthcare = Column(Float, default=0.0)
    shopping = Column(Float, default=0.0)
    environment = Column(Float, default=0.0)
    overall = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="liveability_score")


class PriceTrend(Base):
    __tablename__ = "price_trends"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    month = Column(String(7), nullable=False)
    rent = Column(Integer, nullable=False)
    locality_avg_rent = Column(Integer)
