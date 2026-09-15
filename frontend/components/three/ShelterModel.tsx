/**
 * Shelter Model Component
 * 
 * Renders the 3D shelter geometry based on design configuration.
 * Supports different shapes: rectangular, square, cylindrical, dome.
 */

'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShelterGeometry3D, ThermalVisualizationData, VisualizationConfig } from '@/types/shelter3d';
import { generateShelterGeometry } from '@/lib/three/geometryGenerators';
import { applyThermalOverlay, applyHeatLossOverlay, removeThermalOverlay, removeHeatLossOverlay } from '@/lib/three/thermalVisualization';

interface ShelterModelProps {
  geometry: ShelterGeometry3D;
  thermalData: ThermalVisualizationData | null;
  config: VisualizationConfig;
  onClick?: (component: string, data: any) => void;
}

export default function ShelterModel({ geometry, thermalData, config, onClick }: ShelterModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate shelter geometry based on type and dimensions
  const shelterMesh = useMemo(() => {
    return generateShelterGeometry(
      geometry.type,
      {
        length: geometry.length,
        width: geometry.width,
        height: geometry.height,
        orientation: geometry.orientation,
      },
      0.2 // Default wall thickness for visualization
    );
  }, [geometry.type, geometry.length, geometry.width, geometry.height, geometry.orientation]);
  
  // Apply thermal overlays if enabled
  useEffect(() => {
    if (!groupRef.current || !config.showThermalOverlay || !thermalData) return;
    
    // Apply thermal visualization to meshes
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const indoorTemp = thermalData.indoorTemperature;
        applyThermalOverlay(child, indoorTemp, 0, 40);
      }
    });
    
    return () => {
      // Cleanup
      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            removeThermalOverlay(child);
          }
        });
      }
    };
  }, [config.showThermalOverlay, thermalData]);
  
  // Apply heat loss overlays if enabled
  useEffect(() => {
    if (!groupRef.current || !config.showHeatLossOverlay || !thermalData) return;
    
    const heatLosses = thermalData.heatLossByComponent;
    const maxHeatLoss = Math.max(...Object.values(heatLosses), 1);
    
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name) {
        const heatLoss = heatLosses[child.name] || 0;
        applyHeatLossOverlay(child, heatLoss, maxHeatLoss);
      }
    });
    
    return () => {
      // Cleanup
      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            removeHeatLossOverlay(child);
          }
        });
      }
    };
  }, [config.showHeatLossOverlay, thermalData]);
  
  // Handle mesh clicks
  const handleMeshClick = (event: any, mesh: THREE.Mesh) => {
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    
    if (onClick && mesh.name) {
      const componentData = {
        name: mesh.name,
        area: getComponentArea(mesh.name, geometry),
        uValue: getComponentUValue(mesh.name, geometry),
        heatLoss: thermalData?.heatLossByComponent[mesh.name] || 0,
        solarGain: thermalData?.solarGainBySurface[mesh.name] || 0,
      };
      
      onClick(mesh.name, componentData);
    }
  };
  
  // Add click handlers to all meshes
  useEffect(() => {
    shelterMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child as any).userData.onClick = handleMeshClick;
      }
    });
  }, [shelterMesh, thermalData]);
  
  return (
    <group ref={groupRef}>
      {/* Clone and render the generated shelter geometry */}
      <primitive 
        object={shelterMesh.clone()} 
        onClick={(e: any) => {
          e.stopPropagation();
          const mesh = e.object as THREE.Mesh;
          if (mesh.userData.onClick) {
            mesh.userData.onClick(e, mesh);
          }
        }}
      />
      
      {/* Optional: Render windows */}
      {geometry.windows.map((window) => (
        <WindowMesh
          key={window.id}
          window={window}
          shelterDimensions={{ length: geometry.length, width: geometry.width, height: geometry.height }}
          onClick={onClick ? (e) => onClick(`window_${window.id}`, window) : undefined}
        />
      ))}
      
      {/* Optional: Render doors */}
      {geometry.doors.map((door) => (
        <DoorMesh
          key={door.id}
          door={door}
          shelterDimensions={{ length: geometry.length, width: geometry.width, height: geometry.height }}
          onClick={onClick ? (e) => onClick(`door_${door.id}`, door) : undefined}
        />
      ))}
      
      {/* Optional: Render thermal mass */}
      {geometry.thermalMass && (
        <ThermalMassMesh
          thermalMass={geometry.thermalMass}
          temperature={thermalData?.indoorTemperature}
        />
      )}
    </group>
  );
}

// Helper function to get component area
function getComponentArea(componentName: string, geometry: ShelterGeometry3D): number {
  switch (componentName) {
    case 'southWall':
    case 'northWall':
      return geometry.length * geometry.height;
    case 'eastWall':
    case 'westWall':
      return geometry.width * geometry.height;
    case 'roof':
    case 'floor':
      return geometry.length * geometry.width;
    default:
      return 0;
  }
}

// Helper function to get component U-value
function getComponentUValue(componentName: string, geometry: ShelterGeometry3D): number {
  // In a full implementation, this would come from the thermal assembly data
  // For now, return placeholder values
  if (componentName === 'roof' || componentName === 'floor') {
    return geometry.roof.uValue || 0.5;
  }
  if (geometry.walls.length > 0) {
    return geometry.walls[0].uValue || 0.5;
  }
  return 0.5; // Default
}

// Window component
function WindowMesh({ 
  window, 
  shelterDimensions,
  onClick 
}: { 
  window: any; 
  shelterDimensions: { length: number; width: number; height: number };
  onClick?: any;
}) {
  const position = useMemo(() => {
    // Calculate window position based on wall orientation
    const { length, width, height } = shelterDimensions;
    const halfHeight = height / 2;
    
    switch (window.wallOrientation) {
      case 'south':
        return [window.positionX || 0, halfHeight + (window.positionY || 0), width / 2];
      case 'north':
        return [window.positionX || 0, halfHeight + (window.positionY || 0), -width / 2];
      case 'east':
        return [length / 2, halfHeight + (window.positionY || 0), window.positionX || 0];
      case 'west':
        return [-length / 2, halfHeight + (window.positionY || 0), window.positionX || 0];
      default:
        return [0, halfHeight, 0];
    }
  }, [window, shelterDimensions]);
  
  const rotation = useMemo(() => {
    switch (window.wallOrientation) {
      case 'south':
      case 'north':
        return [0, window.wallOrientation === 'north' ? Math.PI : 0, 0];
      case 'east':
      case 'west':
        return [0, window.wallOrientation === 'west' ? Math.PI : Math.PI / 2, 0];
      default:
        return [0, 0, 0];
    }
  }, [window.wallOrientation]);
  
  return (
    <mesh 
      position={position} 
      rotation={rotation}
      onClick={onClick}
    >
      <boxGeometry args={[window.width, window.height, 0.05]} />
      <meshStandardMaterial 
        color="#ADD8E6" 
        transparent 
        opacity={0.5} 
        roughness={0.1}
      />
    </mesh>
  );
}

// Door component
function DoorMesh({ 
  door, 
  shelterDimensions,
  onClick 
}: { 
  door: any; 
  shelterDimensions: { length: number; width: number; height: number };
  onClick?: any;
}) {
  const position = useMemo(() => {
    const { length, width, height } = shelterDimensions;
    const halfHeight = height / 2;
    
    switch (door.wallOrientation) {
      case 'south':
        return [door.positionX || 0, halfHeight / 2, width / 2];
      case 'north':
        return [door.positionX || 0, halfHeight / 2, -width / 2];
      case 'east':
        return [length / 2, halfHeight / 2, door.positionX || 0];
      case 'west':
        return [-length / 2, halfHeight / 2, door.positionX || 0];
      default:
        return [0, halfHeight / 2, 0];
    }
  }, [door, shelterDimensions]);
  
  const rotation = useMemo(() => {
    switch (door.wallOrientation) {
      case 'south':
      case 'north':
        return [0, door.wallOrientation === 'north' ? Math.PI : 0, 0];
      case 'east':
      case 'west':
        return [0, door.wallOrientation === 'west' ? Math.PI : Math.PI / 2, 0];
      default:
        return [0, 0, 0];
    }
  }, [door.wallOrientation]);
  
  return (
    <mesh 
      position={position} 
      rotation={rotation}
      onClick={onClick}
    >
      <boxGeometry args={[door.width, door.height, 0.1]} />
      <meshStandardMaterial 
        color="#8B5A2B" 
        roughness={0.7}
      />
    </mesh>
  );
}

// Thermal mass component
function ThermalMassMesh({ 
  thermalMass, 
  temperature 
}: { 
  thermalMass: any; 
  temperature?: number;
}) {
  const [dimX, dimY, dimZ] = thermalMass.dimensions || [1, 1, 1];
  const [posX, posY, posZ] = thermalMass.position || [0, 0, 0];
  
  // Color based on temperature if available
  const color = temperature 
    ? getThermalColorString(temperature)
    : '#6B6B6B'; // Default stone color
  
  return (
    <mesh position={[posX, posY, posZ]}>
      <boxGeometry args={[dimX, dimY, dimZ]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}

// Helper function for thermal color
function getThermalColorString(temp: number): string {
  if (temp < 10) return '#4A90E2'; // Blue - cold
  if (temp < 18) return '#50C878'; // Green - cool
  if (temp < 26) return '#FFD700'; // Yellow - comfortable
  if (temp < 35) return '#FFA500'; // Orange - warm
  return '#EF4444'; // Red - hot
}
