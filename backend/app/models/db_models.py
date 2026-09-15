"""
Database models for ThermoShelter.

These models define the database schema using SQLModel.
"""

from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MaterialCategory(str, Enum):
    """Categories of building materials."""
    STRUCTURAL = "structural"
    INSULATION = "insulation"
    FINISH = "finish"
    GLAZING = "glazing"
    OTHER = "other"


class Material(SQLModel, table=True):
    """Building material with thermal properties."""
    
    __tablename__ = "materials"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    category: MaterialCategory = Field(default=MaterialCategory.OTHER)
    
    # Thermal properties
    thermal_conductivity: float = Field(description="Thermal conductivity k (W/m·K)")
    density: float = Field(description="Density ρ (kg/m³)")
    specific_heat: float = Field(description="Specific heat cp (J/kg·K)")
    
    # Optical properties
    solar_absorptivity: float = Field(default=0.5, description="Solar absorptivity α (0-1)")
    emissivity: float = Field(default=0.9, description="Thermal emissivity ε (0-1)")
    
    # Optional fields
    cost_per_volume: Optional[float] = Field(default=None, description="Cost per m³")
    description: Optional[str] = None
    source: Optional[str] = Field(default=None, description="Reference/source of data")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ShelterGeometry(SQLModel):
    """Shelter geometry definition."""
    
    length: float = Field(gt=0, description="Length in meters")
    width: float = Field(gt=0, description="Width in meters")
    height: float = Field(gt=0, description="Height in meters")
    shape: str = Field(default="rectangular", description="Shape: rectangular, square, cylindrical, dome")
    orientation: float = Field(ge=0, le=360, default=180, description="Orientation in degrees (0-360)")


class LayerDefinition(SQLModel):
    """A single layer in a wall/roof/floor assembly."""
    
    material_id: int
    thickness: float = Field(gt=0, description="Thickness in meters")


class Assembly(SQLModel):
    """Multi-layer construction assembly (wall, roof, floor, etc.)."""
    
    name: str
    layers: List[LayerDefinition] = Field(default_factory=list)
    
    def calculate_r_value(self, materials: dict) -> float:
        """Calculate total thermal resistance of the assembly."""
        r_total = 0.0
        
        # Inside surface resistance (approximate)
        r_total += 0.12
        
        # Add layer resistances
        for layer in self.layers:
            if layer.material_id in materials:
                mat = materials[layer.material_id]
                if mat.thermal_conductivity > 0:
                    r_total += layer.thickness / mat.thermal_conductivity
        
        # Outside surface resistance (approximate)
        r_total += 0.04
        
        return r_total
    
    def calculate_u_value(self, materials: dict) -> float:
        """Calculate U-value (thermal transmittance) of the assembly."""
        r_total = self.calculate_r_value(materials)
        if r_total > 0:
            return 1.0 / r_total
        return 0.0


class Design(SQLModel, table=True):
    """Complete shelter design configuration."""
    
    __tablename__ = "designs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="Unnamed Design")
    description: Optional[str] = None
    
    # Location
    location_name: str = Field(default="Leh, Ladakh")
    latitude: float = Field(default=34.1526)
    longitude: float = Field(default=77.5771)
    
    # Geometry
    length: float = Field(default=5.0, gt=0)
    width: float = Field(default=4.0, gt=0)
    height: float = Field(default=3.0, gt=0)
    shape: str = Field(default="rectangular")
    orientation: float = Field(default=180.0, ge=0, le=360)
    
    # Openings
    window_percentage: float = Field(default=12.0, ge=0, le=100)
    door_area: float = Field(default=2.0, ge=0)
    
    # Thermal mass
    thermal_mass_material_id: Optional[int] = Field(default=None)
    thermal_mass_kg: float = Field(default=500.0, ge=0)
    
    # Ventilation
    ach: float = Field(default=0.5, ge=0, description="Air changes per hour")
    
    # Comfort range
    comfort_temp_min: float = Field(default=18.0)
    comfort_temp_max: float = Field(default=26.0)
    
    # References to assemblies (stored as JSON in practice)
    wall_assembly_json: Optional[str] = None
    roof_assembly_json: Optional[str] = None
    floor_assembly_json: Optional[str] = None
    window_u_value: float = Field(default=3.0)
    door_u_value: float = Field(default=2.5)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SimulationResult(SQLModel, table=True):
    """Results from a thermal simulation."""
    
    __tablename__ = "simulation_results"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    design_id: int = Field(foreign_key="designs.id")
    
    # Simulation metadata
    simulation_date: datetime = Field(default_factory=datetime.utcnow)
    timestep_minutes: int = Field(default=15)
    duration_days: int = Field(default=1)
    
    # Results summary
    avg_indoor_temp: float
    min_indoor_temp: float
    max_indoor_temp: float
    comfort_hours_percent: float
    heating_requirement_kwh: float
    total_solar_gain_kwh: float
    total_heat_loss_kwh: float
    
    # Efficiency score
    efficiency_score: float
    
    # Full time series data (stored as JSON)
    timeseries_json: str
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OptimizationResult(SQLModel, table=True):
    """Results from an optimization run."""
    
    __tablename__ = "optimization_results"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    design_id: int = Field(foreign_key="designs.id")
    
    # Optimization parameters
    objective_weights_json: str
    
    # Best design found
    optimized_design_json: str
    
    # Pareto frontier (if multi-objective)
    pareto_frontier_json: Optional[str] = None
    
    # Recommendation explanation
    recommendation_text: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WeatherData(SQLModel, table=True):
    """Weather/climate data for a location."""
    
    __tablename__ = "weather_data"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    location_name: str = Field(index=True)
    latitude: float
    longitude: float
    
    # Data stored as JSON array of hourly records
    # Each record: {timestamp, temperature, solar_irradiance, wind_speed, humidity}
    data_json: str
    
    source: str = Field(default="manual")
    created_at: datetime = Field(default_factory=datetime.utcnow)
