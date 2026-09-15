/**
 * Thermal visualization utilities for 3D scene
 * 
 * IMPORTANT: These visualizations represent simplified model results,
 * NOT CFD/FEA temperature fields. They are visual aids to help users
 * understand the thermal simulation output.
 */

import * as THREE from 'three';
import { ThermalVisualizationData, WallOrientation } from '@/types/shelter3d';
import { getThermalColor, getHeatLossColor } from './materialMappings';

export interface HeatFlowArrowOptions {
  length?: number;
  color?: string;
  shaftRadius?: number;
  headRadius?: number;
}

/**
 * Create heat flow arrows showing direction of heat transfer
 * Arrows point from warm to cold regions
 */
export function createHeatFlowArrows(
  component: string,
  direction: 'inward' | 'outward',
  intensity: number,
  position: THREE.Vector3,
  options: HeatFlowArrowOptions = {}
): THREE.ArrowHelper {
  const {
    length = 2,
    shaftRadius = 0.1,
    headRadius = 0.3,
  } = options;
  
  // Determine direction vector based on component and heat flow direction
  let directionVector = new THREE.Vector3();
  
  switch (component.toLowerCase()) {
    case 'southwall':
    case 'south wall':
      directionVector.set(0, 0, direction === 'outward' ? 1 : -1);
      break;
    case 'northwall':
    case 'north wall':
      directionVector.set(0, 0, direction === 'outward' ? -1 : 1);
      break;
    case 'eastwall':
    case 'east wall':
      directionVector.set(direction === 'outward' ? 1 : -1, 0, 0);
      break;
    case 'westwall':
    case 'west wall':
      directionVector.set(direction === 'outward' ? -1 : 1, 0, 0);
      break;
    case 'roof':
      directionVector.set(0, direction === 'outward' ? 1 : -1, 0);
      break;
    case 'floor':
      directionVector.set(0, direction === 'outward' ? -1 : 1, 0);
      break;
    default:
      directionVector.set(0, 1, 0); // Default upward
  }
  
  // Scale arrow length by intensity
  const scaledLength = length * Math.min(1, intensity / 100);
  
  // Color based on intensity (red = high heat flow, blue = low)
  const color = intensity > 50 ? 0xEF4444 : intensity > 20 ? 0xEAB308 : 0x22C55E;
  
  const arrow = new THREE.ArrowHelper(
    directionVector.normalize(),
    position,
    scaledLength,
    color,
    scaledLength * 0.3,
    scaledLength * 0.15
  );
  
  arrow.name = `heatFlow_${component}`;
  return arrow;
}

/**
 * Create a thermal overlay on shelter surfaces
 * This applies vertex colors to show temperature distribution
 * 
 * NOTE: This is a simplified visualization, not actual CFD results
 */
export function applyThermalOverlay(
  mesh: THREE.Mesh,
  temperature: number,
  minTemp: number = 0,
  maxTemp: number = 40
): void {
  const material = mesh.material as THREE.MeshStandardMaterial;
  
  // Get thermal color
  const colorString = getThermalColor(temperature, minTemp, maxTemp);
  const color = new THREE.Color(colorString);
  
  // Apply as emissive color to show thermal state
  material.emissive = color;
  material.emissiveIntensity = 0.3;
}

/**
 * Remove thermal overlay from mesh
 */
export function removeThermalOverlay(mesh: THREE.Mesh): void {
  const material = mesh.material as THREE.MeshStandardMaterial;
  material.emissive = new THREE.Color(0x000000);
  material.emissiveIntensity = 0;
}

/**
 * Create heat loss intensity visualization
 * Colors surfaces based on their contribution to total heat loss
 */
export function applyHeatLossOverlay(
  mesh: THREE.Mesh,
  heatLoss: number,
  maxHeatLoss: number
): void {
  const material = mesh.material as THREE.MeshStandardMaterial;
  
  // Store original color if not already stored
  if (!(material as any)._originalColor) {
    (material as any)._originalColor = material.color.clone();
  }
  
  // Get color based on heat loss intensity
  const colorString = getHeatLossColor(heatLoss, maxHeatLoss);
  const color = new THREE.Color(colorString);
  
  // Blend with original color
  material.color.lerpColors((material as any)._originalColor, color, 0.7);
}

/**
 * Remove heat loss overlay and restore original colors
 */
export function removeHeatLossOverlay(mesh: THREE.Mesh): void {
  const material = mesh.material as THREE.MeshStandardMaterial;
  
  if ((material as any)._originalColor) {
    material.color.copy((material as any)._originalColor);
    delete (material as any)._originalColor;
  }
}

/**
 * Create particle system for heat flow animation
 */
export function createHeatFlowParticles(
  count: number = 100,
  boundingBox: THREE.Box3
): THREE.Points {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  
  const boxSize = new THREE.Vector3();
  boundingBox.getSize(boxSize);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = center.x + (Math.random() - 0.5) * boxSize.x;
    positions[i * 3 + 1] = center.y + (Math.random() - 0.5) * boxSize.y;
    positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * boxSize.z;
    
    // Random initial velocity
    velocities[i * 3] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xFF6B35,
    size: 0.2,
    transparent: true,
    opacity: 0.6,
  });
  
  const particles = new THREE.Points(geometry, material);
  particles.name = 'heatFlowParticles';
  
  return particles;
}

/**
 * Update heat flow particle positions
 */
export function updateHeatFlowParticles(
  particles: THREE.Points,
  deltaTime: number = 0.016
): void {
  const geometry = particles.geometry as THREE.BufferGeometry;
  const positions = geometry.attributes.position.array as Float32Array;
  const velocities = geometry.attributes.velocity.array as Float32Array;
  
  const count = positions.length / 3;
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] += velocities[i * 3];
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    positions[i * 3 + 2] += velocities[i * 3 + 2];
    
    // Simple boundary check - reset to center if too far
    if (Math.abs(positions[i * 3]) > 10 ||
        Math.abs(positions[i * 3 + 1]) > 10 ||
        Math.abs(positions[i * 3 + 2]) > 10) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
  }
  
  geometry.attributes.position.needsUpdate = true;
}

/**
 * Get component name from mesh name
 */
export function getComponentFromMeshName(meshName: string): string {
  const nameMap: Record<string, string> = {
    southWall: 'South Wall',
    northWall: 'North Wall',
    eastWall: 'East Wall',
    westWall: 'West Wall',
    roof: 'Roof',
    floor: 'Floor',
    cylindricalWall: 'Wall',
    dome: 'Dome',
    domeBase: 'Base Wall',
  };
  
  return nameMap[meshName] || meshName;
}

/**
 * Calculate relative heat loss percentage for visualization
 */
export function calculateHeatLossPercentages(
  heatLossByComponent: Record<string, number>
): Record<string, number> {
  const total = Object.values(heatLossByComponent).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    return heatLossByComponent;
  }
  
  const percentages: Record<string, number> = {};
  for (const [component, value] of Object.entries(heatLossByComponent)) {
    percentages[component] = (value / total) * 100;
  }
  
  return percentages;
}
