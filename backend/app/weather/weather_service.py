"""
Weather data service for ThermoShelter.

Provides demo climate datasets and handles weather data upload/parsing.
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import numpy as np


# Demo weather data for various locations
# These are illustrative datasets representing typical seasonal patterns
DEMO_LOCATIONS = {
    "Leh, Ladakh": {
        "latitude": 34.1526,
        "longitude": 77.5771,
        "description": "Cold high-altitude desert climate",
    },
    "Kargil": {
        "latitude": 34.5580,
        "longitude": 76.1280,
        "description": "Cold mountainous climate",
    },
    "Srinagar": {
        "latitude": 34.0837,
        "longitude": 74.7973,
        "description": "Humid subtropical highland climate",
    },
    "Delhi": {
        "latitude": 28.7041,
        "longitude": 77.1025,
        "description": "Hot semi-arid climate",
    },
    "Jaisalmer": {
        "latitude": 26.9157,
        "longitude": 70.9083,
        "description": "Hot desert climate",
    },
    "Chandigarh": {
        "latitude": 30.7333,
        "longitude": 76.7794,
        "description": "Humid subtropical climate",
    },
    "Chennai": {
        "latitude": 13.0827,
        "longitude": 80.2707,
        "description": "Tropical wet and dry climate",
    },
}


def generate_demo_weather_data(
    location: str,
    start_date: datetime,
    duration_days: int = 7,
    season: str = "winter"
) -> List[Dict[str, Any]]:
    """
    Generate illustrative demo weather data for a location.
    
    This generates synthetic but physically plausible weather patterns
    for demonstration purposes. Real applications should use actual
    historical weather data.
    
    Args:
        location: Location name
        start_date: Start date for weather data
        duration_days: Number of days to generate
        season: Season pattern ("winter", "summer", "composite")
        
    Returns:
        List of hourly weather records
    """
    location_info = DEMO_LOCATIONS.get(location, DEMO_LOCATIONS["Leh, Ladakh"])
    lat = location_info["latitude"]
    
    # Base temperature profiles by season and location type
    if "Ladakh" in location or "Kargil" in location:
        # Cold high-altitude
        if season == "winter":
            base_temp = -10.0
            temp_amplitude = 8.0
            solar_max = 700.0
        elif season == "summer":
            base_temp = 15.0
            temp_amplitude = 12.0
            solar_max = 900.0
        else:
            base_temp = 5.0
            temp_amplitude = 10.0
            solar_max = 800.0
    elif "Delhi" in location or "Jaisalmer" in location:
        # Hot climate
        if season == "winter":
            base_temp = 12.0
            temp_amplitude = 8.0
            solar_max = 600.0
        elif season == "summer":
            base_temp = 35.0
            temp_amplitude = 10.0
            solar_max = 1000.0
        else:
            base_temp = 28.0
            temp_amplitude = 9.0
            solar_max = 800.0
    elif "Chennai" in location:
        # Tropical
        base_temp = 28.0
        temp_amplitude = 4.0
        solar_max = 700.0
    else:
        # Default moderate climate
        if season == "winter":
            base_temp = 5.0
            temp_amplitude = 6.0
            solar_max = 500.0
        elif season == "summer":
            base_temp = 30.0
            temp_amplitude = 8.0
            solar_max = 850.0
        else:
            base_temp = 20.0
            temp_amplitude = 7.0
            solar_max = 700.0
    
    # Generate hourly data
    weather_data = []
    
    for day in range(duration_days):
        current_date = start_date + timedelta(days=day)
        
        for hour in range(24):
            timestamp = current_date.replace(hour=hour, minute=0, second=0)
            
            # Temperature: sinusoidal daily variation
            # Coldest at ~5am, warmest at ~3pm
            hour_angle = (hour - 5) / 24 * 2 * np.pi
            temperature = base_temp + temp_amplitude * np.sin(hour_angle)
            
            # Add some day-to-day variation
            day_variation = np.sin(day / 7 * 2 * np.pi) * 2.0
            temperature += day_variation
            
            # Solar irradiance: bell curve during daylight hours
            # Peak at solar noon (~12:30)
            if 6 <= hour <= 18:
                solar_hour = (hour - 6) / 12 * np.pi
                solar_irradiance = solar_max * np.sin(solar_hour)
                
                # Adjust for latitude (higher latitudes get less in winter)
                lat_factor = max(0.5, 1 - abs(lat) / 90)
                solar_irradiance *= lat_factor
                
                # Add some random variation
                solar_irradiance *= (0.8 + 0.2 * np.random.random())
            else:
                solar_irradiance = 0.0
            
            # Wind speed: typically higher during day
            if 8 <= hour <= 18:
                wind_speed = 3.0 + 2.0 * np.random.random()
            else:
                wind_speed = 1.0 + 1.0 * np.random.random()
            
            # Humidity: inverse relationship with temperature (simplified)
            humidity = 60 - (temperature - base_temp) * 2
            humidity = max(20, min(95, humidity))
            
            weather_data.append({
                "timestamp": timestamp.isoformat(),
                "temperature": round(temperature, 1),
                "solar_irradiance": round(max(0, solar_irradiance), 1),
                "wind_speed": round(wind_speed, 1),
                "humidity": round(humidity, 1),
            })
    
    return weather_data


def parse_weather_csv(csv_content: str) -> List[Dict[str, Any]]:
    """
    Parse uploaded CSV weather data.
    
    Expected CSV format:
    timestamp,temperature,solar_irradiance,wind_speed,humidity
    2024-01-01T00:00:00,5.2,0,2.1,65
    2024-01-01T01:00:00,4.8,0,1.9,67
    ...
    
    Args:
        csv_content: Raw CSV string content
        
    Returns:
        List of weather data dictionaries
        
    Raises:
        ValueError: If CSV format is invalid
    """
    lines = csv_content.strip().split('\n')
    
    if len(lines) < 2:
        raise ValueError("CSV must have header row and at least one data row")
    
    # Parse header
    header = [col.strip().lower() for col in lines[0].split(',')]
    
    required_cols = ['timestamp', 'temperature', 'solar_irradiance']
    missing_cols = [col for col in required_cols if col not in header]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    # Parse data rows
    weather_data = []
    
    for i, line in enumerate(lines[1:], start=2):
        try:
            values = [v.strip() for v in line.split(',')]
            
            if len(values) != len(header):
                raise ValueError(f"Row {i}: column count mismatch")
            
            row_dict = dict(zip(header, values))
            
            # Parse and validate fields
            timestamp = row_dict['timestamp']
            temperature = float(row_dict['temperature'])
            solar_irradiance = float(row_dict.get('solar_irradiance', 0))
            wind_speed = float(row_dict.get('wind_speed', 0)) if row_dict.get('wind_speed') else None
            humidity = float(row_dict.get('humidity', 0)) if row_dict.get('humidity') else None
            
            # Validate ranges
            if temperature < -50 or temperature > 60:
                raise ValueError(f"Row {i}: temperature {temperature}°C out of reasonable range")
            
            if solar_irradiance < 0 or solar_irradiance > 1500:
                raise ValueError(f"Row {i}: solar irradiance {solar_irradiance} W/m² out of range")
            
            weather_data.append({
                "timestamp": timestamp,
                "temperature": temperature,
                "solar_irradiance": solar_irradiance,
                "wind_speed": wind_speed,
                "humidity": humidity,
            })
            
        except Exception as e:
            raise ValueError(f"Error parsing row {i}: {str(e)}")
    
    return weather_data


def get_available_locations() -> List[Dict[str, Any]]:
    """Get list of available demo locations."""
    return [
        {
            "name": name,
            "latitude": info["latitude"],
            "longitude": info["longitude"],
            "description": info["description"],
        }
        for name, info in DEMO_LOCATIONS.items()
    ]


def create_weather_template_csv() -> str:
    """Generate a CSV template for weather data upload."""
    template = """timestamp,temperature,solar_irradiance,wind_speed,humidity
2024-01-01T00:00:00,5.2,0,2.1,65
2024-01-01T01:00:00,4.8,0,1.9,67
2024-01-01T02:00:00,4.5,0,1.8,68
2024-01-01T03:00:00,4.2,0,1.7,69
2024-01-01T04:00:00,4.0,0,1.6,70
2024-01-01T05:00:00,3.9,0,1.5,70
2024-01-01T06:00:00,4.1,50,1.6,69
2024-01-01T07:00:00,5.0,150,1.8,67
2024-01-01T08:00:00,6.5,300,2.2,63
2024-01-01T09:00:00,8.2,450,2.6,58
2024-01-01T10:00:00,9.8,580,3.0,53
2024-01-01T11:00:00,11.0,650,3.3,49
2024-01-01T12:00:00,11.8,680,3.5,46
2024-01-01T13:00:00,12.2,670,3.6,44
2024-01-01T14:00:00,12.3,620,3.5,43
2024-01-01T15:00:00,12.0,530,3.3,44
2024-01-01T16:00:00,11.3,400,3.0,46
2024-01-01T17:00:00,10.2,250,2.7,49
2024-01-01T18:00:00,9.0,80,2.4,52
2024-01-01T19:00:00,8.0,0,2.2,55
2024-01-01T20:00:00,7.2,0,2.0,58
2024-01-01T21:00:00,6.6,0,1.9,60
2024-01-01T22:00:00,6.1,0,1.8,62
2024-01-01T23:00:00,5.7,0,1.7,64
"""
    return template.strip()
