"""
Materials API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional

from app.core.database import get_session
from app.models.db_models import Material, MaterialCategory
from app.schemas.api_schemas import (
    MaterialCreate,
    MaterialResponse,
)

router = APIRouter(prefix="/materials", tags=["materials"])


@router.get("", response_model=List[MaterialResponse])
async def get_materials(
    category: Optional[MaterialCategory] = None,
    session: Session = Depends(get_session),
):
    """Get all materials, optionally filtered by category."""
    
    if category:
        statement = select(Material).where(Material.category == category)
    else:
        statement = select(Material)
    
    results = session.exec(statement)
    return list(results.all())


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: int,
    session: Session = Depends(get_session),
):
    """Get a specific material by ID."""
    
    statement = select(Material).where(Material.id == material_id)
    result = session.get(Material, material_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return result


@router.post("", response_model=MaterialResponse)
async def create_material(
    material: MaterialCreate,
    session: Session = Depends(get_session),
):
    """Create a new material."""
    
    db_material = Material.model_validate(material)
    session.add(db_material)
    session.commit()
    session.refresh(db_material)
    
    return db_material


@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    material: MaterialCreate,
    session: Session = Depends(get_session),
):
    """Update an existing material."""
    
    db_material = session.get(Material, material_id)
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    update_data = material.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_material, key, value)
    
    session.add(db_material)
    session.commit()
    session.refresh(db_material)
    
    return db_material


@router.delete("/{material_id}")
async def delete_material(
    material_id: int,
    session: Session = Depends(get_session),
):
    """Delete a material."""
    
    db_material = session.get(Material, material_id)
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    session.delete(db_material)
    session.commit()
    
    return {"status": "deleted", "id": material_id}
