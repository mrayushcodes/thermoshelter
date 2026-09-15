"""
Optimization API endpoints.

Handles design optimization requests using scipy optimization algorithms.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import numpy as np
from scipy.optimize import minimize, differential_evolution

from app.core.database import get_session
from app.models.db_models import Design, OptimizationResult, Material
from app.schemas.api_schemas import (
    OptimizationRequest,
    OptimizationResultResponse,
    OptimizedDesign,
    OptimizationWeights,
)
from app.thermal.thermal_model import (
    ThermalModel,
    ShelterGeometry,
    MaterialProperty,
    create_assembly_properties,
)
from app.weather.weather_service import generate_demo_weather_data

router = APIRouter(prefix="/optimization", tags=["optimization"])


def objective_function(
    params: np.ndarray,
    design: Design,
    materials_dict: Dict[int, MaterialProperty],
    weather_data: List[Dict[str, Any]],
    weights: OptimizationWeights,
) -> float:
    """
    Objective function for optimization.
    
    Minimizes a weighted combination of:
    - Thermal discomfort
    - Heating energy requirement
    - Cost (estimated)
    - Poor solar utilization
    
    Parameters encode:
    - params[0]: wall insulation thickness (m)
    - params[1]: roof insulation thickness (m)
    - params[2]: window percentage (%)
    - params[3]: orientation (degrees)
    - params[4]: thermal mass (kg)
    """
    
    # Extract parameters with bounds
    wall_insulation = max(0.01, min(0.30, params[0]))  # 1-30 cm
    roof_insulation = max(0.01, min(0.40, params[1]))  # 1-40 cm
    window_pct = max(5, min(40, params[2]))  # 5-40%
    orientation = max(0, min(360, params[3]))  # 0-360°
    thermal_mass = max(100, min(2000, params[4]))  # 100-2000 kg
    
    # Create modified design
    wall_layers = [
        {"material_id": 1, "thickness": 0.23},  # Brick
        {"material_id": 2, "thickness": wall_insulation},  # Insulation
    ]
    
    roof_layers = [
        {"material_id": 1, "thickness": 0.15},  # Concrete
        {"material_id": 2, "thickness": roof_insulation},  # Insulation
    ]
    
    floor_layers = [
        {"material_id": 1, "thickness": 0.15},  # Concrete
    ]
    
    wall_assembly = create_assembly_properties("Wall", wall_layers, materials_dict)
    roof_assembly = create_assembly_properties("Roof", roof_layers, materials_dict)
    floor_assembly = create_assembly_properties("Floor", floor_layers, materials_dict)
    
    geometry = ShelterGeometry(
        length=design.length,
        width=design.width,
        height=design.height,
        shape=design.shape,
        orientation=orientation,
    )
    
    model = ThermalModel(
        geometry=geometry,
        wall_assembly=wall_assembly,
        roof_assembly=roof_assembly,
        floor_assembly=floor_assembly,
        window_u_value=design.window_u_value,
        door_u_value=design.door_u_value,
        window_percentage=window_pct,
        door_area=design.door_area,
        thermal_mass_kg=thermal_mass,
        ach=design.ach,
        comfort_temp_min=design.comfort_temp_min,
        comfort_temp_max=design.comfort_temp_max,
        latitude=design.latitude,
        longitude=design.longitude,
    )
    
    # Run simulation
    result = model.simulate(
        weather_data=weather_data,
        initial_temperature=20.0,
        timestep_minutes=30,  # Coarser for optimization speed
    )
    
    summary = result["summary"]
    
    # Calculate objective components (normalized to 0-1 range roughly)
    discomfort = (100 - summary["comfort_hours_percent"]) / 100
    heating_energy = min(1, summary["heating_requirement_kwh"] / 50)
    
    # Estimate cost (simplified)
    material_cost = (
        wall_insulation * 50 +  # Insulation cost per m²
        roof_insulation * 60 +
        thermal_mass * 0.01  # Thermal mass cost per kg
    )
    cost_normalized = min(1, material_cost / 100)
    
    # Solar utilization (inverse - we want to maximize it)
    solar_util = 1 - min(1, summary["total_solar_gain_kwh"] / 100)
    
    # Weighted objective
    objective = (
        weights.thermal_comfort * discomfort +
        weights.energy_efficiency * heating_energy +
        weights.cost * cost_normalized +
        weights.solar_utilization * solar_util
    )
    
    return objective


@router.post("", response_model=OptimizationResultResponse)
async def run_optimization(
    request: OptimizationRequest,
    session: Session = Depends(get_session),
):
    """
    Run design optimization to find optimal shelter configuration.
    
    Uses scipy optimization to search the design space for configurations
    that minimize discomfort, heating energy, and cost while maximizing
    solar utilization.
    """
    
    # Get design
    design = session.get(Design, request.design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Get materials
    materials_stmt = select(Material)
    materials_list = session.exec(materials_stmt).all()
    
    materials_dict = {}
    for mat in materials_list:
        materials_dict[mat.id] = MaterialProperty(
            name=mat.name,
            thermal_conductivity=mat.thermal_conductivity,
            density=mat.density,
            specific_heat=mat.specific_heat,
            solar_absorptivity=mat.solar_absorptivity,
            emissivity=mat.emissivity,
        )
    
    # Generate weather data for evaluation
    start_date = datetime.now()
    weather_data = generate_demo_weather_data(
        location=design.location_name,
        start_date=start_date,
        duration_days=7,
        season="winter",
    )
    
    # Default weights
    weights = request.weights or OptimizationWeights()
    
    # Initial guess
    x0 = np.array([0.05, 0.10, 12, 180, 500])
    
    # Parameter bounds
    bounds = [
        (0.01, 0.30),   # Wall insulation (m)
        (0.01, 0.40),   # Roof insulation (m)
        (5, 40),        # Window percentage
        (0, 360),       # Orientation
        (100, 2000),    # Thermal mass (kg)
    ]
    
    # Run optimization using differential evolution for global search
    result = differential_evolution(
        func=lambda x: objective_function(x, design, materials_dict, weather_data, weights),
        bounds=bounds,
        maxiter=request.max_iterations // 10,
        seed=42,
        polish=True,
    )
    
    # Extract optimal parameters
    optimal = result.x
    wall_insulation = optimal[0]
    roof_insulation = optimal[1]
    window_pct = optimal[2]
    orientation = optimal[3]
    thermal_mass = optimal[4]
    
    # Run final simulation with optimal parameters
    wall_layers = [
        {"material_id": 1, "thickness": 0.23},
        {"material_id": 2, "thickness": wall_insulation},
    ]
    
    roof_layers = [
        {"material_id": 1, "thickness": 0.15},
        {"material_id": 2, "thickness": roof_insulation},
    ]
    
    wall_assembly = create_assembly_properties("Wall", wall_layers, materials_dict)
    roof_assembly = create_assembly_properties("Roof", roof_layers, materials_dict)
    floor_assembly = create_assembly_properties("Floor", [{"material_id": 1, "thickness": 0.15}], materials_dict)
    
    geometry = ShelterGeometry(
        length=design.length,
        width=design.width,
        height=design.height,
        shape=design.shape,
        orientation=orientation,
    )
    
    model = ThermalModel(
        geometry=geometry,
        wall_assembly=wall_assembly,
        roof_assembly=roof_assembly,
        floor_assembly=floor_assembly,
        window_u_value=design.window_u_value,
        door_u_value=design.door_u_value,
        window_percentage=window_pct,
        door_area=design.door_area,
        thermal_mass_kg=thermal_mass,
        ach=design.ach,
        comfort_temp_min=design.comfort_temp_min,
        comfort_temp_max=design.comfort_temp_max,
        latitude=design.latitude,
        longitude=design.longitude,
    )
    
    final_result = model.simulate(
        weather_data=weather_data,
        initial_temperature=20.0,
        timestep_minutes=15,
    )
    
    summary = final_result["summary"]
    
    # Estimate cost
    estimated_cost = (
        wall_insulation * design.length * design.height * 50 +
        roof_insulation * design.length * design.width * 60 +
        thermal_mass * 0.5
    )
    
    # Generate recommendation text
    recommendation = generate_recommendation_text(
        wall_insulation=wall_insulation,
        roof_insulation=roof_insulation,
        window_pct=window_pct,
        orientation=orientation,
        thermal_mass=thermal_mass,
        summary=summary,
        design=design,
    )
    
    # Store result
    optimized_design = {
        "wall_insulation_thickness": round(wall_insulation * 1000, 0),  # mm
        "roof_insulation_thickness": round(roof_insulation * 1000, 0),  # mm
        "window_percentage": round(window_pct, 1),
        "orientation": round(orientation, 0),
        "thermal_mass_kg": round(thermal_mass, 0),
        "predicted_comfort_hours": summary["comfort_hours_percent"],
        "predicted_heating_kwh": summary["heating_requirement_kwh"],
        "estimated_cost": round(estimated_cost, 2),
    }
    
    db_result = OptimizationResult(
        design_id=design.id,
        objective_weights_json=json.dumps(weights.model_dump()),
        optimized_design_json=json.dumps(optimized_design),
        recommendation_text=recommendation,
    )
    
    session.add(db_result)
    session.commit()
    session.refresh(db_result)
    
    return OptimizationResultResponse(
        id=db_result.id,
        design_id=db_result.design_id,
        objective_weights=weights.model_dump(),
        optimized_design=OptimizedDesign(**optimized_design),
        recommendation_text=recommendation,
        created_at=db_result.created_at,
    )


def generate_recommendation_text(
    wall_insulation: float,
    roof_insulation: float,
    window_pct: float,
    orientation: float,
    thermal_mass: float,
    summary: Dict[str, Any],
    design: Design,
) -> str:
    """Generate human-readable recommendation explanation."""
    
    wall_mm = int(wall_insulation * 1000)
    roof_mm = int(roof_insulation * 1000)
    
    # Determine orientation direction
    if 337.5 <= orientation or orientation < 22.5:
        orient_str = "North"
    elif 22.5 <= orientation < 67.5:
        orient_str = "Northeast"
    elif 67.5 <= orientation < 112.5:
        orient_str = "East"
    elif 112.5 <= orientation < 157.5:
        orient_str = "Southeast"
    elif 157.5 <= orientation < 202.5:
        orient_str = "South"
    elif 202.5 <= orientation < 247.5:
        orient_str = "Southwest"
    elif 247.5 <= orientation < 292.5:
        orient_str = "West"
    else:
        orient_str = "Northwest"
    
    recommendation = f"""Recommended Design Configuration:

**Wall Construction:**
- Base wall material with {wall_mm}mm insulation layer
- This thickness reduces conductive heat loss by approximately {min(80, wall_mm * 0.4)}% compared to uninsulated walls

**Roof Construction:**
- Base roof material with {roof_mm}mm insulation layer
- Roof insulation is critical as heat rises; this thickness minimizes upward heat loss

**Window Area:**
- {window_pct:.1f}% of wall area
- Balances solar gain with heat loss; larger windows increase both

**Orientation:**
- {orient_str}-facing ({orientation:.0f}° from North)
- Optimized for maximum winter solar gain at latitude {design.latitude:.1f}°

**Thermal Mass:**
- {thermal_mass:.0f}kg of thermal mass material
- Stores daytime solar heat and releases it at night, reducing temperature swings

**Expected Performance:**
- Comfort hours: {summary['comfort_hours_percent']:.1f}%
- Heating requirement: {summary['heating_requirement_kwh']:.2f} kWh over simulation period
- Average indoor temperature: {summary['avg_indoor_temp']:.1f}°C

This configuration was found through numerical optimization balancing thermal comfort, energy efficiency, material cost, and solar utilization according to your specified priorities."""

    return recommendation


@router.get("/{result_id}", response_model=OptimizationResultResponse)
async def get_optimization_result(
    result_id: int,
    session: Session = Depends(get_session),
):
    """Get optimization results by ID."""
    
    result = session.get(OptimizationResult, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Optimization result not found")
    
    optimized_design = json.loads(result.optimized_design_json)
    objective_weights = json.loads(result.objective_weights_json)
    
    return OptimizationResultResponse(
        id=result.id,
        design_id=result.design_id,
        objective_weights=objective_weights,
        optimized_design=OptimizedDesign(**optimized_design),
        recommendation_text=result.recommendation_text,
        created_at=result.created_at,
    )
