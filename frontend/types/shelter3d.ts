/**
 * 3D Visualization Types for ThermoShelter
 * 
 * These types define the contract between the thermal simulation engine
 * and the 3D visualization system.
 */

import * as THREE from 'three';

export type GeometryType = 'rectangular' | 'square' | 'cylindrical' | 'dome';

export type WallOrientation = 'north' | 'south' | 'east' | 'west';

export interface MaterialLayer3D {
  id: string;
  materialName: string;
  thickness: number; // meters
  thermalConductivity: number; // W/m·K
  color: string;
  texture?: string;
}

export interface Window3D {
  id: string;
  wallOrientation: WallOrientation;
  width: number; // meters
  height: number; // meters
  positionX: number; // offset from wall center
  positionY: number; // height from floor
  glazingMaterial: string;
}

export interface Door3D {
  id: string;
  wallOrientation: WallOrientation;
  width: number; // meters
  height: number; // meters
  positionX: number; // offset from wall center
  material: string;
}

export interface Wall3D {
  id: string;
  orientation: WallOrientation;
  width: number; // meters
  height: number; // meters
  thickness: number; // meters
  layers: MaterialLayer3D[];
  windows: Window3D[];
  doors: Door3D[];
  area: number; // m²
  uValue: number; // W/m²K
  heatLoss: number; // W
}

export interface Roof3D {
  id: string;
  shape: GeometryType;
  length: number; // meters (for rectangular)
  width: number; // meters (for rectangular)
  radius?: number; // for dome/cylindrical
  thickness: number; // meters
  layers: MaterialLayer3D[];
  area: number; // m²
  uValue: number; // W/m²K
  heatLoss: number; // W
  solarGain: number; // W
}

export interface Floor3D {
  id: string;
  shape: GeometryType;
  length: number; // meters
  width: number; // meters
  radius?: number;
  thickness: number; // meters
  layers: MaterialLayer3D[];
  area: number; // m²
  uValue: number; // W/m²K
  heatLoss: number; // W
}

export interface ThermalMass3D {
  id: string;
  material: string;
  mass: number; // kg
  specificHeat: number; // J/kg·K
  volume: number; // m³
  position: [number, number, number]; // x, y, z in meters
  dimensions: [number, number, number]; // width, height, depth
  temperature?: number; // °C
}

export interface ShelterGeometry3D {
  type: GeometryType;
  length: number; // meters
  width: number; // meters
  height: number; // meters
  orientation: number; // degrees (0-360)
  walls: Wall3D[];
  roof: Roof3D;
  floor: Floor3D;
  windows: Window3D[];
  doors: Door3D[];
  thermalMass?: ThermalMass3D;
}

export interface SolarPosition {
  azimuth: number; // degrees
  elevation: number; // degrees
  irradiance: number; // W/m²
  timestamp: string;
}

export interface ThermalVisualizationData {
  indoorTemperature: number; // °C
  outdoorTemperature: number; // °C
  heatLossByComponent: Record<string, number>; // component -> W
  solarGainBySurface: Record<string, number>; // surface -> W
  heatFlowDirection: Record<string, 'inward' | 'outward'>; // component -> direction
  comfortRange: {
    min: number; // °C
    max: number; // °C
  };
  comfortHours: number; // hours
  totalHours: number; // hours
}

export interface VisualizationConfig {
  showDimensions: boolean;
  showAxes: boolean;
  showGrid: boolean;
  showCompass: boolean;
  showSolarDirection: boolean;
  showThermalOverlay: boolean;
  showHeatFlowArrows: boolean;
  showHeatLossOverlay: boolean;
  showSolarExposure: boolean;
  showExplodedView: boolean;
  showCutawayView: boolean;
  cutawayPlane: 'x' | 'y' | 'z';
  cutawayPosition: number;
  explodedOffset: number;
  dayNightMode: 'day' | 'night';
  cameraMode: 'perspective' | 'orthographic';
}

export interface DesignState {
  geometry: ShelterGeometry3D;
  thermalData: ThermalVisualizationData | null;
  solarPosition: SolarPosition | null;
  config: VisualizationConfig;
  isLoading: boolean;
  error: string | null;
}

/**
 * Interface for geometry generators
 */
export interface ShelterGeometryGenerator {
  type: GeometryType;
  generateGeometry(dimensions: {
    length: number;
    width: number;
    height: number;
    orientation: number;
  }): THREE.Object3D;
}
