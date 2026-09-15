"""
Weather API endpoints.

Handles weather data retrieval, upload, and demo data generation.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
import json

from app.core.database import get_session
from app.models.db_models import WeatherData
from app.schemas.api_schemas import WeatherDataPoint
from app.weather.weather_service import (
    generate_demo_weather_data,
    parse_weather_csv,
    get_available_locations,
    create_weather_template_csv,
)

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/locations")
async def get_locations():
    """Get list of available demo locations."""
    return {"locations": get_available_locations()}


@router.get("/demo/{location}")
async def get_demo_weather(
    location: str,
    days: int = 7,
    season: str = "winter",
):
    """Get demo weather data for a location."""
    
    start_date = datetime.now()
    
    weather_data = generate_demo_weather_data(
        location=location,
        start_date=start_date,
        duration_days=days,
        season=season,
    )
    
    return {
        "location": location,
        "start_date": start_date.isoformat(),
        "duration_days": days,
        "data": weather_data,
    }


@router.post("/upload")
async def upload_weather_data(
    location_name: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    source: str = Form(default="manual"),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    """Upload weather data from CSV file."""
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Read and parse CSV
    try:
        content = await file.read()
        csv_content = content.decode('utf-8')
        weather_data = parse_weather_csv(csv_content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
    # Store in database
    db_weather = WeatherData(
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        data_json=json.dumps(weather_data),
        source=source,
    )
    
    session.add(db_weather)
    session.commit()
    session.refresh(db_weather)
    
    return {
        "id": db_weather.id,
        "location": location_name,
        "records_count": len(weather_data),
        "status": "uploaded",
    }


@router.get("/template")
async def get_weather_template():
    """Get CSV template for weather data upload."""
    
    return {
        "template": create_weather_template_csv(),
        "format": {
            "columns": ["timestamp", "temperature", "solar_irradiance", "wind_speed", "humidity"],
            "timestamp_format": "ISO 8601 (e.g., 2024-01-01T00:00:00)",
            "temperature_unit": "°C",
            "solar_irradiance_unit": "W/m²",
            "wind_speed_unit": "m/s",
            "humidity_unit": "%",
        },
    }


@router.get("/{location_name}")
async def get_stored_weather(
    location_name: str,
    session: Session = Depends(get_session),
):
    """Get stored weather data for a location."""
    
    statement = select(WeatherData).where(WeatherData.location_name == location_name)
    results = session.exec(statement)
    weather_records = results.all()
    
    if not weather_records:
        raise HTTPException(status_code=404, detail="No weather data found for this location")
    
    # Return the most recent dataset
    latest = max(weather_records, key=lambda w: w.created_at)
    data = json.loads(latest.data_json)
    
    return {
        "location": latest.location_name,
        "latitude": latest.latitude,
        "longitude": latest.longitude,
        "source": latest.source,
        "created_at": latest.created_at.isoformat(),
        "data": data,
    }
