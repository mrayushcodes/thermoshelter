"""
Thermal Model Engine for ThermoShelter.

This module implements a physics-based transient thermal model for predicting
indoor shelter temperatures based on energy balance principles.

Key Equations:
-------------

1. Heat Conduction through envelope:
   Q = U * A * (T_inside - T_outside)
   
   where:
   - U = overall heat transfer coefficient (W/m²K)
   - A = surface area (m²)
   - T_inside, T_outside = indoor and outdoor temperatures (°C)

2. Thermal Resistance for multi-layer assembly:
   R_total = R_inside + Σ(layer_thickness / thermal_conductivity) + R_outside
   U = 1 / R_total

3. Solar Heat Gain:
   Q_solar = I * A * α * SC
   where:
   - I = solar irradiance (W/m²)
   - A = exposed surface area (m²)
   - α = solar absorptivity
   - SC = shading coefficient

4. Ventilation Heat Loss:
   Q_vent = ρ_air * V_dot * cp_air * (T_inside - T_outside)
   where:
   - ρ_air = air density (~1.2 kg/m³)
   - V_dot = volumetric airflow rate (m³/s)
   - cp_air = specific heat of air (~1005 J/kg·K)

5. Thermal Mass Energy Storage:
   Q_storage = m * cp * dT/dt
   where:
   - m = mass of thermal mass (kg)
   - cp = specific heat capacity (J/kg·K)
   - dT/dt = rate of temperature change (K/s)

6. Energy Balance (at each timestep):
   Q_net = Q_solar + Q_internal - Q_losses
   
   Indoor temperature update:
   T_new = T_old + Q_net * Δt / (m_air * cp_air + m_mass * cp_mass)

Model Assumptions:
-----------------
- Lumped capacitance model (uniform indoor temperature)
- Steady-state conduction through walls (negligible wall thermal mass)
- Constant material properties
- No phase change materials
- Simplified solar geometry
- Constant infiltration rate
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import json


@dataclass
class MaterialProperty:
    """Material thermal properties."""
    name: str
    thermal_conductivity: float  # W/m·K
    density: float  # kg/m³
    specific_heat: float  # J/kg·K
    solar_absorptivity: float = 0.5
    emissivity: float = 0.9


@dataclass
class LayerDefinition:
    """A layer in a construction assembly."""
    material: MaterialProperty
    thickness: float  # meters


@dataclass
class AssemblyProperties:
    """Calculated properties of a construction assembly."""
    name: str
    r_value: float  # m²K/W
    u_value: float  # W/m²K
    layers: List[LayerDefinition]


@dataclass
class ShelterGeometry:
    """Geometric properties of the shelter."""
    length: float  # meters
    width: float  # meters
    height: float  # meters
    shape: str = "rectangular"
    orientation: float = 180.0  # degrees from north
    
    @property
    def floor_area(self) -> float:
        """Calculate floor area."""
        if self.shape == "rectangular" or self.shape == "square":
            return self.length * self.width
        elif self.shape == "cylindrical":
            return np.pi * (self.length / 2) ** 2
        return self.length * self.width
    
    @property
    def volume(self) -> float:
        """Calculate internal volume."""
        if self.shape == "rectangular" or self.shape == "square":
            return self.length * self.width * self.height
        elif self.shape == "cylindrical":
            return np.pi * (self.length / 2) ** 2 * self.height
        return self.length * self.width * self.height
    
    @property
    def wall_area(self) -> float:
        """Calculate total wall area (excluding openings)."""
        if self.shape == "rectangular" or self.shape == "square":
            return 2 * (self.length + self.width) * self.height
        elif self.shape == "cylindrical":
            return np.pi * self.length * self.height
        return 2 * (self.length + self.width) * self.height
    
    @property
    def roof_area(self) -> float:
        """Calculate roof area."""
        if self.shape == "rectangular" or self.shape == "square":
            return self.length * self.width
        elif self.shape == "cylindrical":
            return np.pi * (self.length / 2) ** 2
        elif self.shape == "dome":
            return 2 * np.pi * (self.length / 2) ** 2
        return self.length * self.width
    
    @property
    def surface_to_volume_ratio(self) -> float:
        """Calculate surface-area-to-volume ratio."""
        total_area = self.wall_area + self.roof_area + self.floor_area
        return total_area / self.volume if self.volume > 0 else 0


class ThermalModel:
    """
    Physics-based transient thermal model for shelter simulation.
    
    Implements an explicit time-stepping energy balance approach.
    """
    
    # Physical constants
    AIR_DENSITY = 1.2  # kg/m³
    AIR_SPECIFIC_HEAT = 1005  # J/kg·K
    SURFACE_RESISTANCE_INSIDE = 0.12  # m²K/W
    SURFACE_RESISTANCE_OUTSIDE = 0.04  # m²K/W
    
    def __init__(
        self,
        geometry: ShelterGeometry,
        wall_assembly: AssemblyProperties,
        roof_assembly: AssemblyProperties,
        floor_assembly: AssemblyProperties,
        window_u_value: float = 3.0,
        door_u_value: float = 2.5,
        window_percentage: float = 12.0,
        door_area: float = 2.0,
        thermal_mass_kg: float = 500.0,
        thermal_mass_cp: float = 840.0,  # J/kg·K (typical for stone/concrete)
        ach: float = 0.5,  # air changes per hour
        comfort_temp_min: float = 18.0,
        comfort_temp_max: float = 26.0,
        latitude: float = 34.1526,
        longitude: float = 77.5771,
    ):
        """Initialize the thermal model with shelter parameters."""
        
        self.geometry = geometry
        self.wall_assembly = wall_assembly
        self.roof_assembly = roof_assembly
        self.floor_assembly = floor_assembly
        self.window_u_value = window_u_value
        self.door_u_value = door_u_value
        self.window_percentage = window_percentage
        self.door_area = door_area
        self.thermal_mass_kg = thermal_mass_kg
        self.thermal_mass_cp = thermal_mass_cp
        self.ach = ach
        self.comfort_temp_min = comfort_temp_min
        self.comfort_temp_max = comfort_temp_max
        self.latitude = latitude
        self.longitude = longitude
        
        # Calculate effective areas
        self._calculate_effective_areas()
        
        # Initialize state
        self.indoor_temperature = 20.0  # Initial indoor temperature (°C)
        
    def _calculate_effective_areas(self):
        """Calculate effective areas for heat transfer calculations."""
        # Window area as percentage of wall area
        self.window_area = self.geometry.wall_area * (self.window_percentage / 100.0)
        
        # Effective wall area (excluding windows and door)
        self.effective_wall_area = max(
            0,
            self.geometry.wall_area - self.window_area - self.door_area
        )
        
        # Air mass in shelter
        self.air_mass = self.geometry.volume * self.AIR_DENSITY
        
        # Total thermal capacitance (air + thermal mass)
        self.total_capacitance = (
            self.air_mass * self.AIR_SPECIFIC_HEAT +
            self.thermal_mass_kg * self.thermal_mass_cp
        )
    
    def calculate_solar_position(
        self,
        timestamp: datetime
    ) -> Tuple[float, float]:
        """
        Calculate solar position (altitude and azimuth angles).
        
        Uses simplified NOAA solar calculator equations.
        
        Returns:
            Tuple of (solar_altitude_deg, solar_azimuth_deg)
        """
        # Day of year
        day_of_year = timestamp.timetuple().tm_yday
        
        # Latitude in radians
        lat_rad = np.radians(self.latitude)
        
        # Declination angle (simplified)
        declination = np.radians(23.45 * np.sin(np.radians(360/365 * (day_of_year - 81))))
        
        # Hour angle (degrees)
        hour = timestamp.hour + timestamp.minute / 60.0
        hour_angle = np.radians(15 * (hour - 12))
        
        # Solar altitude angle
        sin_altitude = (
            np.sin(lat_rad) * np.sin(declination) +
            np.cos(lat_rad) * np.cos(declination) * np.cos(hour_angle)
        )
        altitude = np.degrees(np.arcsin(max(-1, min(1, sin_altitude))))
        
        # Solar azimuth angle (from north, clockwise)
        cos_azimuth = (
            (np.sin(declination) - np.sin(lat_rad) * sin_altitude) /
            (np.cos(lat_rad) * np.cos(np.radians(altitude)))
        )
        azimuth = np.degrees(np.arccos(max(-1, min(1, cos_azimuth))))
        
        # Adjust azimuth based on hour angle
        if hour_angle > 0:
            azimuth = 360 - azimuth
        
        return altitude, azimuth
    
    def calculate_solar_irradiance(
        self,
        timestamp: datetime,
        clearsky_irradiance: Optional[float] = None
    ) -> float:
        """
        Calculate incident solar irradiance on shelter surfaces.
        
        Args:
            timestamp: Time of calculation
            clearsky_irradiance: Optional external irradiance value
            
        Returns:
            Solar irradiance in W/m²
        """
        altitude, azimuth = self.calculate_solar_position(timestamp)
        
        # If sun is below horizon, return 0
        if altitude <= 0:
            return 0.0
        
        # Clear-sky irradiance approximation (if not provided)
        if clearsky_irradiance is None:
            # Simple clear-sky model
            air_mass = 1 / np.sin(np.radians(altitude)) if altitude > 0 else 1000
            clearsky_irradiance = 1367 * np.exp(-0.14 * air_mass)  # W/m²
        
        # Orientation factor
        orientation_rad = np.radians(self.geometry.orientation)
        azimuth_rad = np.radians(azimuth)
        
        # Surface orientation factor (simplified)
        # South-facing (180°) gets maximum exposure in northern hemisphere
        orientation_factor = np.cos(orientation_rad - azimuth_rad)
        orientation_factor = max(0, orientation_factor)
        
        # Altitude factor
        altitude_factor = np.sin(np.radians(altitude))
        
        # Combined incident factor
        incident_factor = altitude_factor * (0.5 + 0.5 * orientation_factor)
        
        return clearsky_irradiance * incident_factor
    
    def calculate_solar_gain(
        self,
        solar_irradiance: float,
        timestamp: datetime
    ) -> float:
        """
        Calculate solar heat gain into the shelter.
        
        Returns:
            Solar heat gain in Watts
        """
        # Absorptivity of exterior surfaces (weighted average)
        absorptivity = 0.6  # Typical for building materials
        
        # Window solar heat gain coefficient (SHGC)
        shgc = 0.7  # Typical for double-pane windows
        
        # Direct solar gain through windows
        window_gain = solar_irradiance * self.window_area * shgc
        
        # Indirect solar gain through opaque surfaces (fraction conducted inward)
        # This is simplified - real calculation would consider thermal lag
        opaque_area = self.effective_wall_area + self.roof_assembly.layers[0].thickness if self.roof_assembly.layers else 0
        opaque_gain = solar_irradiance * self.geometry.roof_area * absorptivity * 0.1
        
        return window_gain + opaque_gain
    
    def calculate_conduction_loss(
        self,
        t_inside: float,
        t_outside: float
    ) -> Dict[str, float]:
        """
        Calculate conductive heat losses through envelope components.
        
        Returns:
            Dictionary of heat losses by component (Watts)
        """
        delta_t = t_inside - t_outside
        
        losses = {
            "wall": self.wall_assembly.u_value * self.effective_wall_area * delta_t,
            "roof": self.roof_assembly.u_value * self.geometry.roof_area * delta_t,
            "floor": self.floor_assembly.u_value * self.geometry.floor_area * delta_t,
            "window": self.window_u_value * self.window_area * delta_t,
            "door": self.door_u_value * self.door_area * delta_t,
        }
        
        return losses
    
    def calculate_ventilation_loss(
        self,
        t_inside: float,
        t_outside: float
    ) -> float:
        """
        Calculate heat loss due to ventilation/infiltration.
        
        Q_vent = ρ * V_dot * cp * ΔT
        
        Returns:
            Ventilation heat loss in Watts
        """
        # Volumetric flow rate from ACH
        volume_flow_rate = (self.ach * self.geometry.volume) / 3600  # m³/s
        
        # Heat loss
        q_vent = (
            self.AIR_DENSITY *
            volume_flow_rate *
            self.AIR_SPECIFIC_HEAT *
            (t_inside - t_outside)
        )
        
        return q_vent
    
    def simulate(
        self,
        weather_data: List[Dict[str, Any]],
        initial_temperature: float = 20.0,
        timestep_minutes: int = 15
    ) -> Dict[str, Any]:
        """
        Run transient thermal simulation.
        
        Args:
            weather_data: List of hourly weather records with keys:
                - timestamp: ISO format datetime string
                - temperature: Outdoor temperature (°C)
                - solar_irradiance: Solar irradiance (W/m²)
            initial_temperature: Starting indoor temperature (°C)
            timestep_minutes: Simulation timestep in minutes
            
        Returns:
            Dictionary containing simulation results
        """
        self.indoor_temperature = initial_temperature
        
        # Convert timestep to seconds
        dt = timestep_minutes * 60
        
        # Results storage
        timeseries = []
        total_solar_gain = 0.0
        total_heat_loss = 0.0
        heating_requirement = 0.0
        peak_heating = 0.0
        hours_requiring_heating = 0
        comfort_hours = 0
        cold_hours = 0
        hot_hours = 0
        
        # Track cumulative losses by component
        loss_components = {
            "wall": 0.0,
            "roof": 0.0,
            "floor": 0.0,
            "window": 0.0,
            "door": 0.0,
            "ventilation": 0.0,
        }
        
        prev_timestamp = None
        
        for record in weather_data:
            # Parse timestamp
            if isinstance(record.get("timestamp"), str):
                timestamp = datetime.fromisoformat(record["timestamp"].replace("Z", "+00:00"))
            else:
                timestamp = record.get("timestamp", datetime.now())
            
            # Get weather values
            t_outside = record.get("temperature", 10.0)
            solar_irradiance = record.get("solar_irradiance", 0.0)
            
            # Use provided irradiance or calculate from solar position
            if solar_irradiance == 0.0 or solar_irradiance is None:
                solar_irradiance = self.calculate_solar_irradiance(timestamp)
            
            # Calculate heat flows
            solar_gain = self.calculate_solar_gain(solar_irradiance, timestamp)
            conduction_losses = self.calculate_conduction_loss(
                self.indoor_temperature, t_outside
            )
            ventilation_loss = self.calculate_ventilation_loss(
                self.indoor_temperature, t_outside
            )
            
            # Total heat loss
            total_loss = sum(conduction_losses.values()) + ventilation_loss
            
            # Net heat flow
            net_heat_flow = solar_gain - total_loss
            
            # Update indoor temperature using energy balance
            # dT = Q_net * dt / C_total
            delta_t = (net_heat_flow * dt) / self.total_capacitance
            self.indoor_temperature += delta_t
            
            # Calculate supplemental heating requirement
            heating_power = 0.0
            if self.indoor_temperature < self.comfort_temp_min:
                heating_power = (
                    (self.comfort_temp_min - self.indoor_temperature) *
                    self.total_capacitance / dt
                )
                heating_requirement += heating_power * dt / 3600  # Convert to Wh
                hours_requiring_heating += 1
                peak_heating = max(peak_heating, heating_power)
            
            # Track comfort hours
            if self.comfort_temp_min <= self.indoor_temperature <= self.comfort_temp_max:
                comfort_hours += 1
            elif self.indoor_temperature < self.comfort_temp_min:
                cold_hours += 1
            else:
                hot_hours += 1
            
            # Accumulate totals
            total_solar_gain += solar_gain * dt / 3600  # Convert to Wh
            total_heat_loss += total_loss * dt / 3600
            
            for key in loss_components:
                if key in conduction_losses:
                    loss_components[key] += conduction_losses[key] * dt / 3600
            loss_components["ventilation"] += ventilation_loss * dt / 3600
            
            # Store time series point
            timeseries.append({
                "timestamp": timestamp.isoformat(),
                "outdoor_temperature": round(t_outside, 2),
                "solar_irradiance": round(solar_irradiance, 2),
                "indoor_temperature": round(self.indoor_temperature, 2),
                "solar_gain": round(solar_gain, 2),
                "wall_loss": round(conduction_losses.get("wall", 0), 2),
                "roof_loss": round(conduction_losses.get("roof", 0), 2),
                "floor_loss": round(conduction_losses.get("floor", 0), 2),
                "window_loss": round(conduction_losses.get("window", 0), 2),
                "door_loss": round(conduction_losses.get("door", 0), 2),
                "ventilation_loss": round(ventilation_loss, 2),
                "thermal_storage": round(net_heat_flow * dt, 2),
                "net_heat_flow": round(net_heat_flow, 2),
            })
            
            prev_timestamp = timestamp
        
        # Calculate summary statistics
        indoor_temps = [p["indoor_temperature"] for p in timeseries]
        total_hours = len(timeseries)
        
        # Normalize loss breakdown to percentages
        total_losses_sum = sum(loss_components.values())
        loss_breakdown = {}
        if total_losses_sum > 0:
            for key, value in loss_components.items():
                loss_breakdown[key] = round(value / total_losses_sum * 100, 1)
        
        # Calculate efficiency score (0-100)
        comfort_percent = (comfort_hours / total_hours * 100) if total_hours > 0 else 0
        efficiency_score = self._calculate_efficiency_score(
            comfort_percent=comfort_percent,
            heating_kwh=heating_requirement / 1000,
            heat_loss_kwh=total_heat_loss / 1000,
            solar_gain_kwh=total_solar_gain / 1000,
        )
        
        return {
            "summary": {
                "avg_indoor_temp": round(np.mean(indoor_temps), 2),
                "min_indoor_temp": round(min(indoor_temps), 2),
                "max_indoor_temp": round(max(indoor_temps), 2),
                "comfort_hours_percent": round(comfort_percent, 1),
                "cold_hours_percent": round(cold_hours / total_hours * 100, 1) if total_hours > 0 else 0,
                "hot_hours_percent": round(hot_hours / total_hours * 100, 1) if total_hours > 0 else 0,
                "heating_requirement_kwh": round(heating_requirement / 1000, 2),
                "peak_heating_requirement_kw": round(peak_heating / 1000, 3),
                "hours_requiring_heating": hours_requiring_heating,
                "total_solar_gain_kwh": round(total_solar_gain / 1000, 2),
                "total_heat_loss_kwh": round(total_heat_loss / 1000, 2),
                "heat_loss_breakdown": loss_breakdown,
                "efficiency_score": round(efficiency_score, 1),
            },
            "timeseries": timeseries,
        }
    
    def _calculate_efficiency_score(
        self,
        comfort_percent: float,
        heating_kwh: float,
        heat_loss_kwh: float,
        solar_gain_kwh: float,
    ) -> float:
        """
        Calculate composite efficiency score (0-100).
        
        Weighting:
        - Thermal comfort: 40%
        - Energy efficiency: 30%
        - Solar utilization: 20%
        - Heat loss minimization: 10%
        """
        # Comfort score (0-100)
        comfort_score = min(100, comfort_percent)
        
        # Energy score (inverse of heating requirement, normalized)
        # Assume 100 kWh is very poor, 0 kWh is excellent
        energy_score = max(0, 100 - heating_kwh)
        
        # Solar utilization score
        # Higher solar gain relative to losses is better
        if heat_loss_kwh > 0:
            solar_ratio = solar_gain_kwh / heat_loss_kwh
            solar_score = min(100, solar_ratio * 50)
        else:
            solar_score = 100 if solar_gain_kwh > 0 else 50
        
        # Heat loss score (normalized, assume 500 kWh is poor)
        loss_score = max(0, 100 - heat_loss_kwh / 5)
        
        # Weighted combination
        score = (
            0.40 * comfort_score +
            0.30 * energy_score +
            0.20 * solar_score +
            0.10 * loss_score
        )
        
        return min(100, max(0, score))


def calculate_assembly_r_value(
    layers: List[Dict[str, Any]],
    materials: Dict[int, MaterialProperty]
) -> float:
    """
    Calculate total thermal resistance of a multi-layer assembly.
    
    Args:
        layers: List of layer definitions with material_id and thickness
        materials: Dictionary mapping material_id to MaterialProperty
        
    Returns:
        Total R-value in m²K/W
    """
    r_total = ThermalModel.SURFACE_RESISTANCE_INSIDE
    
    for layer in layers:
        mat_id = layer.get("material_id")
        thickness = layer.get("thickness", 0)
        
        if mat_id in materials and thickness > 0:
            material = materials[mat_id]
            if material.thermal_conductivity > 0:
                r_total += thickness / material.thermal_conductivity
    
    r_total += ThermalModel.SURFACE_RESISTANCE_OUTSIDE
    
    return r_total


def create_assembly_properties(
    name: str,
    layers: List[Dict[str, Any]],
    materials: Dict[int, MaterialProperty]
) -> AssemblyProperties:
    """
    Create AssemblyProperties from layer definitions.
    
    Args:
        name: Assembly name
        layers: List of layer definitions
        materials: Material properties dictionary
        
    Returns:
        AssemblyProperties object
    """
    r_value = calculate_assembly_r_value(layers, materials)
    u_value = 1.0 / r_value if r_value > 0 else 0.0
    
    layer_objects = []
    for layer in layers:
        mat_id = layer.get("material_id")
        if mat_id in materials:
            layer_obj = LayerDefinition(
                material=materials[mat_id],
                thickness=layer.get("thickness", 0)
            )
            layer_objects.append(layer_obj)
    
    return AssemblyProperties(
        name=name,
        r_value=round(r_value, 4),
        u_value=round(u_value, 4),
        layers=layer_objects
    )
