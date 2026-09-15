"""
Simulations API endpoints.

Handles thermal simulation requests and returns results.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional, Any, Dict
from datetime import datetime
import json

from app.core.database import get_session
from app.models.db_models import Design, SimulationResult, Material
from app.schemas.api_schemas import (
    SimulationConfig,
    SimulationResultResponse,
    TimeSeriesPoint,
)
from app.thermal.thermal_model import (
    ThermalModel,
    ShelterGeometry,
    MaterialProperty,
    create_assembly_properties,
)
from app.weather.weather_service import generate_demo_weather_data

router = APIRouter(prefix="/simulations", tags=["simulations"])


@router.post("", response_model=SimulationResultResponse)
async def run_simulation(
    config: SimulationConfig,
    session: Session = Depends(get_session),
):
    """
    Run a thermal simulation for a design.
    
    This endpoint:
    1. Retrieves the design from database
    2. Gets material properties
    3. Constructs the thermal model
    4. Runs the simulation with weather data
    5. Stores and returns results
    """
    
    # Get design
    design = session.get(Design, config.design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Get all materials for assembly construction
    materials_stmt = select(Material)
    materials_list = session.exec(materials_stmt).all()
    
    # Convert to MaterialProperty objects
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
    
    # Parse assemblies from JSON
    wall_layers = []
    roof_layers = []
    floor_layers = []
    
    if design.wall_assembly_json:
        wall_layers = json.loads(design.wall_assembly_json)
    else:
        # Default wall: brick + insulation
        wall_layers = [
            {"material_id": 1, "thickness": 0.23},  # Brick
            {"material_id": 2, "thickness": 0.05},  # Rock wool
        ]
    
    if design.roof_assembly_json:
        roof_layers = json.loads(design.roof_assembly_json)
    else:
        # Default roof: composite + insulation
        roof_layers = [
            {"material_id": 1, "thickness": 0.15},  # Concrete
            {"material_id": 2, "thickness": 0.10},  # Insulation
        ]
    
    if design.floor_assembly_json:
        floor_layers = json.loads(design.floor_assembly_json)
    else:
        # Default floor: concrete slab
        floor_layers = [
            {"material_id": 1, "thickness": 0.15},  # Concrete
        ]
    
    # Create assembly properties
    wall_assembly = create_assembly_properties("Wall", wall_layers, materials_dict)
    roof_assembly = create_assembly_properties("Roof", roof_layers, materials_dict)
    floor_assembly = create_assembly_properties("Floor", floor_layers, materials_dict)
    
    # Get thermal mass properties
    thermal_mass_cp = 840.0  # Default for stone/concrete
    if design.thermal_mass_material_id and design.thermal_mass_material_id in materials_dict:
        thermal_mass_cp = materials_dict[design.thermal_mass_material_id].specific_heat
    
    # Create shelter geometry
    geometry = ShelterGeometry(
        length=design.length,
        width=design.width,
        height=design.height,
        shape=design.shape,
        orientation=design.orientation,
    )
    
    # Create thermal model
    model = ThermalModel(
        geometry=geometry,
        wall_assembly=wall_assembly,
        roof_assembly=roof_assembly,
        floor_assembly=floor_assembly,
        window_u_value=design.window_u_value,
        door_u_value=design.door_u_value,
        window_percentage=design.window_percentage,
        door_area=design.door_area,
        thermal_mass_kg=design.thermal_mass_kg,
        thermal_mass_cp=thermal_mass_cp,
        ach=design.ach,
        comfort_temp_min=design.comfort_temp_min,
        comfort_temp_max=design.comfort_temp_max,
        latitude=design.latitude,
        longitude=design.longitude,
    )
    
    # Get or generate weather data
    if config.weather_data:
        weather_data = config.weather_data
    else:
        # Generate demo weather data
        start_date = datetime.now()
        if config.start_date:
            try:
                start_date = datetime.fromisoformat(config.start_date.replace("Z", "+00:00"))
            except ValueError:
                start_date = datetime.now()
        
        weather_data = generate_demo_weather_data(
            location=design.location_name,
            start_date=start_date,
            duration_days=config.duration_days,
            season="winter",
        )
    
    # Run simulation
    result = model.simulate(
        weather_data=weather_data,
        initial_temperature=20.0,
        timestep_minutes=config.timestep_minutes,
    )
    
    # Store results in database
    summary = result["summary"]
    timeseries = result["timeseries"]
    
    db_result = SimulationResult(
        design_id=config.design_id,
        timestep_minutes=config.timestep_minutes,
        duration_days=config.duration_days,
        avg_indoor_temp=summary["avg_indoor_temp"],
        min_indoor_temp=summary["min_indoor_temp"],
        max_indoor_temp=summary["max_indoor_temp"],
        comfort_hours_percent=summary["comfort_hours_percent"],
        heating_requirement_kwh=summary["heating_requirement_kwh"],
        total_solar_gain_kwh=summary["total_solar_gain_kwh"],
        total_heat_loss_kwh=summary["total_heat_loss_kwh"],
        efficiency_score=summary["efficiency_score"],
        timeseries_json=json.dumps(timeseries),
    )
    
    session.add(db_result)
    session.commit()
    session.refresh(db_result)
    
    # Build response
    return SimulationResultResponse(
        id=db_result.id,
        design_id=db_result.design_id,
        simulation_date=db_result.simulation_date,
        timestep_minutes=db_result.timestep_minutes,
        duration_days=db_result.duration_days,
        avg_indoor_temp=db_result.avg_indoor_temp,
        min_indoor_temp=db_result.min_indoor_temp,
        max_indoor_temp=db_result.max_indoor_temp,
        comfort_hours_percent=summary["comfort_hours_percent"],
        cold_hours_percent=summary["cold_hours_percent"],
        hot_hours_percent=summary["hot_hours_percent"],
        heating_requirement_kwh=db_result.heating_requirement_kwh,
        peak_heating_requirement_kw=summary["peak_heating_requirement_kw"],
        hours_requiring_heating=summary["hours_requiring_heating"],
        total_solar_gain_kwh=db_result.total_solar_gain_kwh,
        total_heat_loss_kwh=db_result.total_heat_loss_kwh,
        heat_loss_breakdown=summary["heat_loss_breakdown"],
        efficiency_score=db_result.efficiency_score,
        score_breakdown={
            "comfort": 40,
            "energy": 30,
            "solar": 20,
            "loss": 10,
        },
        timeseries=[TimeSeriesPoint(**ts) for ts in timeseries],
    )


@router.get("/{result_id}", response_model=SimulationResultResponse)
async def get_simulation_result(
    result_id: int,
    session: Session = Depends(get_session),
):
    """Get simulation results by ID."""
    
    result = session.get(SimulationResult, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Simulation result not found")
    
    timeseries = json.loads(result.timeseries_json)
    summary = {
        "avg_indoor_temp": result.avg_indoor_temp,
        "min_indoor_temp": result.min_indoor_temp,
        "max_indoor_temp": result.max_indoor_temp,
        "comfort_hours_percent": result.comfort_hours_percent,
        "heating_requirement_kwh": result.heating_requirement_kwh,
        "total_solar_gain_kwh": result.total_solar_gain_kwh,
        "total_heat_loss_kwh": result.total_heat_loss_kwh,
        "efficiency_score": result.efficiency_score,
    }
    
    return SimulationResultResponse(
        id=result.id,
        design_id=result.design_id,
        simulation_date=result.simulation_date,
        timestep_minutes=result.timestep_minutes,
        duration_days=result.duration_days,
        avg_indoor_temp=result.avg_indoor_temp,
        min_indoor_temp=result.min_indoor_temp,
        max_indoor_temp=result.max_indoor_temp,
        comfort_hours_percent=result.comfort_hours_percent,
        cold_hours_percent=0,
        hot_hours_percent=0,
        heating_requirement_kwh=result.heating_requirement_kwh,
        peak_heating_requirement_kw=0,
        hours_requiring_heating=0,
        total_solar_gain_kwh=result.total_solar_gain_kwh,
        total_heat_loss_kwh=result.total_heat_loss_kwh,
        heat_loss_breakdown={},
        efficiency_score=result.efficiency_score,
        score_breakdown={},
        timeseries=[TimeSeriesPoint(**ts) for ts in timeseries],
    )


@router.get("/design/{design_id}", response_model=List[SimulationResultResponse])
async def get_simulations_for_design(
    design_id: int,
    session: Session = Depends(get_session),
):
    """Get all simulation results for a design."""
    
    statement = select(SimulationResult).where(SimulationResult.design_id == design_id)
    results = session.exec(statement)
    
    response_list = []
    for result in results.all():
        timeseries = json.loads(result.timeseries_json)
        response_list.append(
            SimulationResultResponse(
                id=result.id,
                design_id=result.design_id,
                simulation_date=result.simulation_date,
                timestep_minutes=result.timestep_minutes,
                duration_days=result.duration_days,
                avg_indoor_temp=result.avg_indoor_temp,
                min_indoor_temp=result.min_indoor_temp,
                max_indoor_temp=result.max_indoor_temp,
                comfort_hours_percent=result.comfort_hours_percent,
                cold_hours_percent=0,
                hot_hours_percent=0,
                heating_requirement_kwh=result.heating_requirement_kwh,
                peak_heating_requirement_kw=0,
                hours_requiring_heating=0,
                total_solar_gain_kwh=result.total_solar_gain_kwh,
                total_heat_loss_kwh=result.total_heat_loss_kwh,
                heat_loss_breakdown={},
                efficiency_score=result.efficiency_score,
                score_breakdown={},
                timeseries=[TimeSeriesPoint(**ts) for ts in timeseries],
            )
        )
    
    return response_list
