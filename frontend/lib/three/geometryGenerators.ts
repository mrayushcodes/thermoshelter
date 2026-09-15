/**
 * Geometry generators for different shelter shapes
 */

import * as THREE from 'three';
import { GeometryType } from '@/types/shelter3d';

export interface GeometryDimensions {
  length: number;
  width: number;
  height: number;
  orientation?: number;
}

/**
 * Generate a rectangular shelter geometry
 */
export function generateRectangularShelter(
  dimensions: GeometryDimensions,
  wallThickness: number = 0.2
): THREE.Group {
  const group = new THREE.Group();
  const { length, width, height } = dimensions;
  
  // Create materials for different faces
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xB24A30, 
    roughness: 0.9,
    side: THREE.DoubleSide 
  });
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8C8C8C, 
    roughness: 0.8,
    side: THREE.DoubleSide 
  });
  const roofMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x6B6B6B, 
    roughness: 0.85,
    side: THREE.DoubleSide 
  });
  
  // South wall (positive Z)
  const southWallGeo = new THREE.BoxGeometry(length, height, wallThickness);
  const southWall = new THREE.Mesh(southWallGeo, wallMaterial);
  southWall.position.set(0, height / 2, width / 2);
  southWall.name = 'southWall';
  group.add(southWall);
  
  // North wall (negative Z)
  const northWallGeo = new THREE.BoxGeometry(length, height, wallThickness);
  const northWall = new THREE.Mesh(northWallGeo, wallMaterial);
  northWall.position.set(0, height / 2, -width / 2);
  northWall.name = 'northWall';
  group.add(northWall);
  
  // East wall (positive X)
  const eastWallGeo = new THREE.BoxGeometry(wallThickness, height, width);
  const eastWall = new THREE.Mesh(eastWallGeo, wallMaterial);
  eastWall.position.set(length / 2, height / 2, 0);
  eastWall.name = 'eastWall';
  group.add(eastWall);
  
  // West wall (negative X)
  const westWallGeo = new THREE.BoxGeometry(wallThickness, height, width);
  const westWall = new THREE.Mesh(westWallGeo, wallMaterial);
  westWall.position.set(-length / 2, height / 2, 0);
  westWall.name = 'westWall';
  group.add(westWall);
  
  // Floor
  const floorGeo = new THREE.BoxGeometry(length, wallThickness, width);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.position.set(0, 0, 0);
  floor.name = 'floor';
  group.add(floor);
  
  // Roof
  const roofGeo = new THREE.BoxGeometry(length, wallThickness, width);
  const roof = new THREE.Mesh(roofGeo, roofMaterial);
  roof.position.set(0, height, 0);
  roof.name = 'roof';
  group.add(roof);
  
  // Apply orientation rotation
  if (dimensions.orientation) {
    group.rotation.y = -dimensions.orientation * (Math.PI / 180);
  }
  
  return group;
}

/**
 * Generate a square shelter geometry (special case of rectangular)
 */
export function generateSquareShelter(
  dimensions: GeometryDimensions,
  wallThickness: number = 0.2
): THREE.Group {
  const size = Math.max(dimensions.length, dimensions.width);
  return generateRectangularShelter(
    { ...dimensions, length: size, width: size },
    wallThickness
  );
}

/**
 * Generate a cylindrical shelter geometry
 */
export function generateCylindricalShelter(
  dimensions: GeometryDimensions,
  wallThickness: number = 0.2
): THREE.Group {
  const group = new THREE.Group();
  const radius = Math.max(dimensions.length, dimensions.width) / 2;
  const { height } = dimensions;
  
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xB24A30, 
    roughness: 0.9,
    side: THREE.DoubleSide 
  });
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8C8C8C, 
    roughness: 0.8,
    side: THREE.DoubleSide 
  });
  const roofMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x6B6B6B, 
    roughness: 0.85,
    side: THREE.DoubleSide 
  });
  
  // Cylindrical wall
  const wallGeo = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    32,
    1,
    false
  );
  const wall = new THREE.Mesh(wallGeo, wallMaterial);
  wall.position.set(0, height / 2, 0);
  wall.name = 'cylindricalWall';
  group.add(wall);
  
  // Floor
  const floorGeo = new THREE.CylinderGeometry(radius, radius, wallThickness, 32);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.position.set(0, 0, 0);
  floor.name = 'floor';
  group.add(floor);
  
  // Roof (flat for simplicity)
  const roofGeo = new THREE.CylinderGeometry(radius, radius, wallThickness, 32);
  const roof = new THREE.Mesh(roofGeo, roofMaterial);
  roof.position.set(0, height, 0);
  roof.name = 'roof';
  group.add(roof);
  
  // Apply orientation rotation
  if (dimensions.orientation) {
    group.rotation.y = -dimensions.orientation * (Math.PI / 180);
  }
  
  return group;
}

/**
 * Generate a dome/hemispherical shelter geometry
 */
export function generateDomeShelter(
  dimensions: GeometryDimensions,
  wallThickness: number = 0.2
): THREE.Group {
  const group = new THREE.Group();
  const radius = Math.max(dimensions.length, dimensions.width) / 2;
  const height = dimensions.height || radius;
  
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xB24A30, 
    roughness: 0.9,
    side: THREE.DoubleSide 
  });
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8C8C8C, 
    roughness: 0.8,
    side: THREE.DoubleSide 
  });
  
  // Dome (hemisphere)
  const domeGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, wallMaterial);
  dome.position.set(0, height, 0);
  dome.name = 'dome';
  group.add(dome);
  
  // Cylindrical base wall if height > radius
  if (height > radius) {
    const baseHeight = height - radius;
    const baseWallGeo = new THREE.CylinderGeometry(
      radius,
      radius,
      baseHeight,
      32,
      1,
      false
    );
    const baseWall = new THREE.Mesh(baseWallGeo, wallMaterial);
    baseWall.position.set(0, baseHeight / 2, 0);
    baseWall.name = 'domeBase';
    group.add(baseWall);
  }
  
  // Floor
  const floorGeo = new THREE.CylinderGeometry(radius, radius, wallThickness, 32);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.position.set(0, 0, 0);
  floor.name = 'floor';
  group.add(floor);
  
  // Apply orientation rotation
  if (dimensions.orientation) {
    group.rotation.y = -dimensions.orientation * (Math.PI / 180);
  }
  
  return group;
}

/**
 * Main geometry generator function
 */
export function generateShelterGeometry(
  type: GeometryType,
  dimensions: GeometryDimensions,
  wallThickness?: number
): THREE.Group {
  switch (type) {
    case 'rectangular':
      return generateRectangularShelter(dimensions, wallThickness);
    case 'square':
      return generateSquareShelter(dimensions, wallThickness);
    case 'cylindrical':
      return generateCylindricalShelter(dimensions, wallThickness);
    case 'dome':
      return generateDomeShelter(dimensions, wallThickness);
    default:
      return generateRectangularShelter(dimensions, wallThickness);
  }
}
