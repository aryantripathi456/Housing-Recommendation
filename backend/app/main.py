from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import get_settings
from app.routers.properties import router as properties_router

settings = get_settings()

app = FastAPI(
    title="AI Housing Intelligence Platform",
    description="AI-driven real estate analytics, liveability assessment, and neighborhood evaluation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties_router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/config")
def get_config():
    return {
        "mapbox_token": settings.mapbox_access_token,
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "AI Housing Intelligence Platform"}
