"""
Database seeding script.

Populates the database with initial material data and a default demo design.
"""

from sqlmodel import Session, select
from app.core.database import engine, create_db_and_tables
from app.models.db_models import Material, MaterialCategory, Design


def seed_materials(session: Session):
    """Seed initial material database."""
    
    # Check if materials already exist
    statement = select(Material).limit(1)
    existing = session.exec(statement).first()
    if existing:
        print("Materials already exist in database. Skipping seed.")
        return
    
    materials = [
        # Structural materials
        Material(
            name="Brick (Common)",
            category=MaterialCategory.STRUCTURAL,
            thermal_conductivity=0.72,
            density=1800,
            specific_heat=840,
            solar_absorptivity=0.65,
            emissivity=0.9,
            description="Standard clay brick for masonry construction",
            source="ASHRAE Fundamentals Handbook",
        ),
        Material(
            name="Concrete (Dense)",
            category=MaterialCategory.STRUCTURAL,
            thermal_conductivity=1.70,
            density=2300,
            specific_heat=880,
            solar_absorptivity=0.60,
            emissivity=0.85,
            description="Dense concrete for structural elements",
            source="ASHRAE Fundamentals Handbook",
        ),
        Material(
            name="Stone (Granite)",
            category=MaterialCategory.STRUCTURAL,
            thermal_conductivity=2.80,
            density=2700,
            specific_heat=790,
            solar_absorptivity=0.55,
            emissivity=0.85,
            description="Natural granite stone",
            source="Engineering Toolbox",
        ),
        Material(
            name="Adobe/Earth Block",
            category=MaterialCategory.STRUCTURAL,
            thermal_conductivity=0.50,
            density=1600,
            specific_heat=1000,
            solar_absorptivity=0.70,
            emissivity=0.9,
            description="Traditional earth-based building material",
            source="NREL Building Materials Database",
        ),
        # Insulation materials
        Material(
            name="Rock Wool",
            category=MaterialCategory.INSULATION,
            thermal_conductivity=0.040,
            density=100,
            specific_heat=840,
            solar_absorptivity=0.50,
            emissivity=0.9,
            description="Mineral wool insulation made from volcanic rock",
            source="Manufacturer Data",
        ),
        Material(
            name="EPS (Expanded Polystyrene)",
            category=MaterialCategory.INSULATION,
            thermal_conductivity=0.035,
            density=30,
            specific_heat=1450,
            solar_absorptivity=0.40,
            emissivity=0.9,
            description="Rigid foam insulation board",
            source="ISO Standards",
        ),
        Material(
            name="XPS (Extruded Polystyrene)",
            category=MaterialCategory.INSULATION,
            thermal_conductivity=0.030,
            density=35,
            specific_heat=1450,
            solar_absorptivity=0.40,
            emissivity=0.9,
            description="High-density rigid foam insulation",
            source="ISO Standards",
        ),
        Material(
            name="Polyurethane Foam",
            category=MaterialCategory.INSULATION,
            thermal_conductivity=0.025,
            density=40,
            specific_heat=1400,
            solar_absorptivity=0.40,
            emissivity=0.9,
            description="High-performance spray or rigid foam insulation",
            source="ISO Standards",
        ),
        Material(
            name="Mineral Wool",
            category=MaterialCategory.INSULATION,
            thermal_conductivity=0.045,
            density=80,
            specific_heat=840,
            solar_absorptivity=0.50,
            emissivity=0.9,
            description="General purpose mineral fiber insulation",
            source="Manufacturer Data",
        ),
        # Finish materials
        Material(
            name="Gypsum Board",
            category=MaterialCategory.FINISH,
            thermal_conductivity=0.16,
            density=800,
            specific_heat=1090,
            solar_absorptivity=0.50,
            emissivity=0.9,
            description="Interior drywall/plasterboard",
            source="ASHRAE Fundamentals Handbook",
        ),
        Material(
            name="Wood (Pine)",
            category=MaterialCategory.FINISH,
            thermal_conductivity=0.12,
            density=550,
            specific_heat=1600,
            solar_absorptivity=0.55,
            emissivity=0.85,
            description="Softwood lumber for framing or finish",
            source="ASHRAE Fundamentals Handbook",
        ),
        # Glazing
        Material(
            name="Glass (Clear Float)",
            category=MaterialCategory.GLAZING,
            thermal_conductivity=1.00,
            density=2500,
            specific_heat=840,
            solar_absorptivity=0.10,
            emissivity=0.84,
            description="Standard clear window glass",
            source="ASHRAE Fundamentals Handbook",
        ),
        # Other
        Material(
            name="Air Gap (Unventilated)",
            category=MaterialCategory.OTHER,
            thermal_conductivity=0.025,
            density=1.2,
            specific_heat=1005,
            solar_absorptivity=0.0,
            emissivity=0.0,
            description="Still air layer in wall cavity (per meter equivalent)",
            source="ASHRAE Fundamentals Handbook",
        ),
    ]
    
    for material in materials:
        session.add(material)
    
    session.commit()
    print(f"Added {len(materials)} materials to database.")


def seed_demo_design(session: Session):
    """Create a default demo design for Ladakh."""
    
    # Check if demo design exists
    statement = select(Design).where(Design.name == "Ladakh Winter Demo")
    existing = session.exec(statement).first()
    if existing:
        print("Demo design already exists. Skipping.")
        return
    
    # Default wall assembly: Brick + Rock Wool
    wall_assembly = [
        {"material_id": 1, "thickness": 0.23},  # Brick 230mm
        {"material_id": 5, "thickness": 0.05},  # Rock Wool 50mm
    ]
    
    # Default roof assembly: Concrete + Insulation
    roof_assembly = [
        {"material_id": 2, "thickness": 0.15},  # Concrete 150mm
        {"material_id": 5, "thickness": 0.10},  # Rock Wool 100mm
    ]
    
    # Default floor: Concrete slab
    floor_assembly = [
        {"material_id": 2, "thickness": 0.15},  # Concrete 150mm
    ]
    
    import json
    
    demo_design = Design(
        name="Ladakh Winter Demo",
        description="Default demo configuration for Leh, Ladakh winter conditions",
        location_name="Leh, Ladakh",
        latitude=34.1526,
        longitude=77.5771,
        length=5.0,
        width=4.0,
        height=3.0,
        shape="rectangular",
        orientation=180.0,  # South-facing
        window_percentage=12.0,
        door_area=2.0,
        thermal_mass_kg=500.0,
        thermal_mass_material_id=3,  # Stone
        ach=0.5,
        comfort_temp_min=18.0,
        comfort_temp_max=26.0,
        wall_assembly_json=json.dumps(wall_assembly),
        roof_assembly_json=json.dumps(roof_assembly),
        floor_assembly_json=json.dumps(floor_assembly),
        window_u_value=3.0,
        door_u_value=2.5,
    )
    
    session.add(demo_design)
    session.commit()
    print("Created demo design for Ladakh.")


def main():
    """Run database seeding."""
    print("Creating database tables...")
    create_db_and_tables()
    
    print("Seeding database...")
    with Session(engine) as session:
        seed_materials(session)
        seed_demo_design(session)
    
    print("Database seeding complete!")


if __name__ == "__main__":
    main()
