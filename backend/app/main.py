"""
ThermoShelter Backend - Passive Shelter Thermal Design & Optimization Platform

This is the main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings
from app.api import simulations, materials, designs, optimization, weather, health
from app.core.database import engine, create_db_and_tables

# Create database tables on startup
create_db_and_tables()

app = FastAPI(
    title="ThermoShelter API",
    description="Passive Shelter Thermal Design & Optimization Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(materials.router, prefix="/api", tags=["Materials"])
app.include_router(simulations.router, prefix="/api", tags=["Simulations"])
app.include_router(designs.router, prefix="/api", tags=["Designs"])
app.include_router(optimization.router, prefix="/api", tags=["Optimization"])
app.include_router(weather.router, prefix="/api", tags=["Weather"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "ThermoShelter API",
        "version": "1.0.0",
        "description": "Passive Shelter Thermal Design & Optimization Platform",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.BACKEND_PORT,
        reload=True
    )
