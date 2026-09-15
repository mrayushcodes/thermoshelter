"""
Designs API endpoints.

Handles shelter design CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional

from app.core.database import get_session
from app.models.db_models import Design
from app.schemas.api_schemas import (
    DesignCreate,
    DesignResponse,
)

router = APIRouter(prefix="/designs", tags=["designs"])


@router.get("", response_model=List[DesignResponse])
async def get_designs(
    session: Session = Depends(get_session),
):
    """Get all saved designs."""
    
    statement = select(Design)
    results = session.exec(statement)
    return list(results.all())


@router.get("/{design_id}", response_model=DesignResponse)
async def get_design(
    design_id: int,
    session: Session = Depends(get_session),
):
    """Get a specific design by ID."""
    
    design = session.get(Design, design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    return design


@router.post("", response_model=DesignResponse)
async def create_design(
    design: DesignCreate,
    session: Session = Depends(get_session),
):
    """Create a new shelter design."""
    
    db_design = Design.model_validate(design)
    session.add(db_design)
    session.commit()
    session.refresh(db_design)
    
    return db_design


@router.put("/{design_id}", response_model=DesignResponse)
async def update_design(
    design_id: int,
    design: DesignCreate,
    session: Session = Depends(get_session),
):
    """Update an existing design."""
    
    db_design = session.get(Design, design_id)
    if not db_design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    update_data = design.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_design, key, value)
    
    session.add(db_design)
    session.commit()
    session.refresh(db_design)
    
    return db_design


@router.delete("/{design_id}")
async def delete_design(
    design_id: int,
    session: Session = Depends(get_session),
):
    """Delete a design."""
    
    db_design = session.get(Design, design_id)
    if not db_design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    session.delete(db_design)
    session.commit()
    
    return {"status": "deleted", "id": design_id}


@router.post("/duplicate/{design_id}", response_model=DesignResponse)
async def duplicate_design(
    design_id: int,
    session: Session = Depends(get_session),
):
    """Create a copy of an existing design."""
    
    original = session.get(Design, design_id)
    if not original:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Create copy with modified name
    original_dict = original.model_dump(exclude={'id', 'created_at', 'updated_at'})
    original_dict['name'] = f"{original.name} (Copy)"
    
    db_design = Design(**original_dict)
    session.add(db_design)
    session.commit()
    session.refresh(db_design)
    
    return db_design
