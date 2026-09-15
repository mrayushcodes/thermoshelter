"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class MaterialCategory(str, Enum):
    """Categories of building materials."""
    STRUCTURAL = "structural"
    INSULATION = "insulation"
    FINISH = "finish"
    GLAZING = "glazing"
    OTHER = "other"


class MaterialBase(BaseModel):
    """Base schema for material data."""
    
    name: str
    category: MaterialCategory = MaterialCategory.OTHER
    thermal_conductivity: float = Field(gt=0, description="Thermal conductivity k (W/m·K)")
    density: float = Field(gt=0, description="Density ρ (kg/m³)")
    specific_heat: float = Field(gt=0, description="Specific heat cp (J/kg·K)")
    solar_absorptivity: float = Field(ge=0, le=1, default=0.5)
    emissivity: float = Field(ge=0, le=1, default=0.9)
    cost_per_volume: Optional[float] = None
    description: Optional[str] = None
    source: Optional[str] = None


class MaterialCreate(MaterialBase):
    """Schema for creating a new material."""
    pass


class MaterialResponse(MaterialBase):
    """Schema for material response with ID."""
    
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LayerDefinition(BaseModel):
    """A single layer in a construction assembly."""
    
    material_id: int
    thickness: float = Field(gt=0, description="Thickness in meters")
    material_name: Optional[str] = None


class AssemblyCreate(BaseModel):
    """Schema for creating a construction assembly."""
    
    name: str
    layers: List[LayerDefinition]


class AssemblyResponse(BaseModel):
    """Schema for assembly response with calculated values."""
    
    name: str
    layers: List[LayerDefinition]
    r_value: float
    u_value: float


class ShelterGeometry(BaseModel):
    """Shelter geometry definition."""
    
    length: float = Field(gt=0)
    width: float = Field(gt=0)
    height: float = Field(gt=0)
    shape: str = Field(default="rectangular")
    orientation: float = Field(ge=0, le=360, default=180)


class DesignBase(BaseModel):
    """Base schema for shelter design."""
    
    name: str = Field(default="Unnamed Design")
    description: Optional[str] = None
    location_name: str = Field(default="Leh, Ladakh")
    latitude: float = Field(default=34.1526)
    longitude: float = Field(default=77.5771)
    length: float = Field(gt=0, default=5.0)
    width: float = Field(gt=0, default=4.0)
    height: float = Field(gt=0, default=3.0)
    shape: str = Field(default="rectangular")
    orientation: float = Field(ge=0, le=360, default=180.0)
    window_percentage: float = Field(ge=0, le=100, default=12.0)
    door_area: float = Field(ge=0, default=2.0)
    thermal_mass_kg: float = Field(ge=0, default=500.0)
    ach: float = Field(ge=0, default=0.5)
    comfort_temp_min: float = Field(default=18.0)
    comfort_temp_max: float = Field(default=26.0)
    wall_assembly_json: Optional[str] = None
    roof_assembly_json: Optional[str] = None
    floor_assembly_json: Optional[str] = None
    window_u_value: float = Field(default=3.0)
    door_u_value: float = Field(default=2.5)


class DesignCreate(DesignBase):
    """Schema for creating a new design."""
    pass


class DesignResponse(DesignBase):
    """Schema for design response with ID."""
    
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SimulationConfig(BaseModel):
    """Configuration for running a thermal simulation."""
    
    design_id: int
    weather_data: Optional[List[Dict[str, Any]]] = None
    timestep_minutes: int = Field(default=15, ge=1, le=60)
    duration_days: int = Field(default=1, ge=1, le=365)
    start_date: Optional[str] = None


class TimeSeriesPoint(BaseModel):
    """Single point in simulation time series."""
    
    timestamp: str
    outdoor_temperature: float
    solar_irradiance: float
    indoor_temperature: float
    solar_gain: float
    wall_loss: float
    roof_loss: float
    floor_loss: float
    window_loss: float
    door_loss: float
    ventilation_loss: float
    thermal_storage: float
    net_heat_flow: float


class SimulationResultResponse(BaseModel):
    """Response schema for simulation results."""
    
    id: int
    design_id: int
    simulation_date: datetime
    timestep_minutes: int
    duration_days: int
    
    # Summary metrics
    avg_indoor_temp: float
    min_indoor_temp: float
    max_indoor_temp: float
    comfort_hours_percent: float
    cold_hours_percent: float
    hot_hours_percent: float
    heating_requirement_kwh: float
    peak_heating_requirement_kw: float
    hours_requiring_heating: int
    total_solar_gain_kwh: float
    total_heat_loss_kwh: float
    
    # Heat loss breakdown
    heat_loss_breakdown: Dict[str, float]
    
    # Efficiency score
    efficiency_score: float
    score_breakdown: Dict[str, float]
    
    # Time series data
    timeseries: List[TimeSeriesPoint]
    
    class Config:
        from_attributes = True


class OptimizationWeights(BaseModel):
    """Weights for multi-objective optimization."""
    
    thermal_comfort: float = Field(ge=0, le=1, default=0.4)
    energy_efficiency: float = Field(ge=0, le=1, default=0.3)
    cost: float = Field(ge=0, le=1, default=0.2)
    solar_utilization: float = Field(ge=0, le=1, default=0.1)


class OptimizationRequest(BaseModel):
    """Request schema for optimization."""
    
    design_id: int
    weights: Optional[OptimizationWeights] = None
    max_iterations: int = Field(default=100, ge=10, le=1000)
    constraints: Optional[Dict[str, Any]] = None


class OptimizedDesign(BaseModel):
    """Optimized design configuration."""
    
    wall_insulation_thickness: float
    roof_insulation_thickness: float
    window_percentage: float
    orientation: float
    thermal_mass_kg: float
    predicted_comfort_hours: float
    predicted_heating_kwh: float
    estimated_cost: float


class OptimizationResultResponse(BaseModel):
    """Response schema for optimization results."""
    
    id: int
    design_id: int
    objective_weights: Dict[str, float]
    optimized_design: OptimizedDesign
    recommendation_text: str
    pareto_points: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class WeatherDataPoint(BaseModel):
    """Single weather data point."""
    
    timestamp: str
    temperature: float
    solar_irradiance: float
    wind_speed: Optional[float] = None
    humidity: Optional[float] = None


class WeatherUploadRequest(BaseModel):
    """Request schema for weather data upload."""
    
    location_name: str
    latitude: float
    longitude: float
    data: List[WeatherDataPoint]
    source: str = Field(default="manual")


class ComparisonRequest(BaseModel):
    """Request schema for comparing designs."""
    
    design_ids: List[int]
    weather_data: Optional[List[Dict[str, Any]]] = None


class DesignComparison(BaseModel):
    """Comparison results between designs."""
    
    designs: List[DesignResponse]
    metrics: Dict[str, Dict[int, float]]
    ranking: List[int]


class HealthResponse(BaseModel):
    """Health check response."""
    
    status: str
    version: str
    database_connected: bool
