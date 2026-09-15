"""
Health check API endpoint.
"""

from fastapi import APIRouter
from sqlmodel import Session, select
from typing import Dict

from app.core.database import engine, get_session
from app.models.db_models import Material
from app.schemas.api_schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health and database connectivity."""
    
    # Check database connection
    db_connected = False
    try:
        with Session(engine) as session:
            statement = select(Material).limit(1)
            results = session.exec(statement)
            # If we can query without error, DB is connected
            db_connected = True
    except Exception:
        db_connected = False
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        database_connected=db_connected,
    )
