import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

// Checkerboard texture generator
function createCheckerboardTexture({ size = 10, color1 = '#4a7c59', color2 = '#6b6b6b', floorWidth = 100, floorLength = 100 } = {}) {
  const squares = 2 // Always use 2x2 grid for simple checkerboard
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size * squares
  const ctx = canvas.getContext('2d')
  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2
      ctx.fillRect(x * size, y * size, size, size)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  
  // Calculate aspect ratio correction to maintain square checkerboard tiles
  const aspectRatio = floorLength / floorWidth
  const baseRepeat = 10
  texture.repeat.set(baseRepeat, baseRepeat * aspectRatio)
  
  return texture
}

// Half fence post component (used at each end of a fence unit)
// Split along x or z axis (not height) - maintains full height but half width
// rotation: [x,y,z] rotation values - [0,0,0] for fences along X, [0,Math.PI/2,0] for fences along Z
// side: 'start' or 'end' determines which half to render (offset direction)
export function FenceHalfPost({ position = [0, 0, 0], height = 1.5, width = 0.2, rotation = [0, 0, 0], side = 'start', color = '#d4d4d4' }) {
  const halfWidth = width / 2;
  
  // Determine split axis from rotation (if rotated 90° around Y, splits along Z, otherwise X)
  const isRotated = Math.abs(rotation[1]) > Math.PI / 4;
  
  // Geometry: full height, but half width on the split axis
  const sizeX = !isRotated ? halfWidth : width;
  const sizeZ = isRotated ? halfWidth : width;
  
  return (
    <mesh castShadow receiveShadow position={[position[0], height / 2, position[2]]} rotation={rotation}>
      <boxGeometry args={[sizeX, height, sizeZ]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Full fence post component (for standalone use)
export function FencePost({ position = [0, 0, 0], height = 1.5, width = 0.2, color = '#d4d4d4' }) {
  return (
    <mesh castShadow receiveShadow position={[position[0], height / 2, position[2]]}>
      <boxGeometry args={[width, height, width]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Horizontal beam component
export function FenceBeam({ start, end, yOffset, height = 0.2, depth = 0.1, color = '#d4d4d4' }) {
  // Calculate beam position and length
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + Math.pow(end[2] - start[2], 2)
  );
  
  // Calculate rotation for the beam
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);
  
  return (
    <mesh 
      castShadow 
      receiveShadow 
      position={[midX, yOffset, midZ]}
      rotation={[0, -angle, 0]}
    >
      <boxGeometry args={[length, height, depth]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Single fence unit: half-post + beams + half-post
// This is the modular building block for fences
// rotation: [x,y,z] rotation values - [0,0,0] for fences along X, [0,Math.PI/2,0] for fences along Z
export function FenceUnit({ 
  start, 
  end, 
  postHeight = 1.5, 
  postWidth = 0.2,
  beam1Y = 0.6, 
  beam2Y = 1.1,
  beamHeight = 0.2,
  beamDepth = 0.1,
  rotation = [0, 0, 0],
  color = '#d4d4d4'
}) {
  return (
    <group>
      {/* Half post at start */}
      <FenceHalfPost 
        position={start} 
        height={postHeight} 
        width={postWidth} 
        rotation={rotation}
        side="start"
        color={color}
      />
      
      {/* Lower horizontal beam */}
      <FenceBeam 
        start={start} 
        end={end} 
        yOffset={beam1Y} 
        height={beamHeight}
        depth={beamDepth}
        color={color}
      />
      
      {/* Upper horizontal beam */}
      <FenceBeam 
        start={start} 
        end={end} 
        yOffset={beam2Y} 
        height={beamHeight}
        depth={beamDepth}
        color={color}
      />
      
      {/* Half post at end */}
      <FenceHalfPost 
        position={end} 
        height={postHeight} 
        width={postWidth}
        rotation={rotation}
        side="end"
        color={color}
      />
    </group>
  );
}

// Simple visual fence - much lower triangle count alternative to PicketFence
function SimpleBoundaryWalls({ floorWidth = 100, floorLength = 100, height = 6, color = '#666666' }) {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Front wall */}
      <mesh position={[0, height / 2, floorLength / 2]} castShadow>
        <boxGeometry args={[floorWidth + 1, height, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <CuboidCollider 
        args={[(floorWidth + 1) / 2, height / 2, 0.1]} 
        position={[0, height / 2, floorLength / 2]} 
      />
      
      {/* Back wall */}
      <mesh position={[0, height / 2, -floorLength / 2]} castShadow>
        <boxGeometry args={[floorWidth + 1, height, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <CuboidCollider 
        args={[(floorWidth + 1) / 2, height / 2, 0.1]} 
        position={[0, height / 2, -floorLength / 2]} 
      />
      
      {/* Left wall */}
      <mesh position={[-floorWidth / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.2, height, floorLength]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <CuboidCollider 
        args={[0.1, height / 2, floorLength / 2]} 
        position={[-floorWidth / 2, height / 2, 0]} 
      />
      
      {/* Right wall */}
      <mesh position={[floorWidth / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.2, height, floorLength]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <CuboidCollider 
        args={[0.1, height / 2, floorLength / 2]} 
        position={[floorWidth / 2, height / 2, 0]} 
      />
    </RigidBody>
  );
}

// Optimized Picket Fence using InstancedMesh - one draw call per geometry type
function PicketFence({ floorWidth = 100, floorLength = 100, postSpacing = 5, color = '#d4d4d4' }) {
  const postMeshRef = React.useRef();
  const beamMeshRef = React.useRef();
  const halfWidth = floorWidth / 2;
  const halfLength = floorLength / 2;
  const postHeight = 1.5;
  const postWidth = 0.2;
  const beam1Y = 0.6;
  const beam2Y = 1.1;
  const beamHeight = 0.2;
  const beamDepth = 0.1;

  // Calculate all fence positions and create transformation matrices
  const { postMatrices, beamMatrices, postCount, beamCount } = useMemo(() => {
    const posts = [];
    const beams = [];
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    const addPost = (x, y, z, rotationY, sizeX, sizeZ) => {
      tempPosition.set(x, y, z);
      tempQuaternion.setFromEuler(new THREE.Euler(0, rotationY, 0));
      tempScale.set(sizeX, postHeight, sizeZ);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      posts.push(tempMatrix.clone());
    };

    const addBeam = (x, y, z, rotationY, length) => {
      tempPosition.set(x, y, z);
      tempQuaternion.setFromEuler(new THREE.Euler(0, rotationY, 0));
      tempScale.set(length, beamHeight, beamDepth);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      beams.push(tempMatrix.clone());
    };

    const halfPostWidth = postWidth / 2;

    // North wall (runs along X axis)
    for (let x = -halfWidth; x < halfWidth; x += postSpacing) {
      const segmentLength = Math.min(postSpacing, halfWidth - x);
      const midX = x + segmentLength / 2;
      
      addPost(x, postHeight / 2, halfLength, 0, halfPostWidth, postWidth);
      addPost(x + segmentLength, postHeight / 2, halfLength, 0, halfPostWidth, postWidth);
      addBeam(midX, beam1Y, halfLength, 0, segmentLength);
      addBeam(midX, beam2Y, halfLength, 0, segmentLength);
    }

    // South wall (runs along X axis)
    for (let x = -halfWidth; x < halfWidth; x += postSpacing) {
      const segmentLength = Math.min(postSpacing, halfWidth - x);
      const midX = x + segmentLength / 2;
      
      addPost(x, postHeight / 2, -halfLength, 0, halfPostWidth, postWidth);
      addPost(x + segmentLength, postHeight / 2, -halfLength, 0, halfPostWidth, postWidth);
      addBeam(midX, beam1Y, -halfLength, 0, segmentLength);
      addBeam(midX, beam2Y, -halfLength, 0, segmentLength);
    }

    // West wall (runs along Z axis)
    for (let z = -halfLength; z < halfLength; z += postSpacing) {
      const segmentLength = Math.min(postSpacing, halfLength - z);
      const midZ = z + segmentLength / 2;
      
      addPost(-halfWidth, postHeight / 2, z, Math.PI / 2, halfPostWidth, postWidth);
      addPost(-halfWidth, postHeight / 2, z + segmentLength, Math.PI / 2, halfPostWidth, postWidth);
      addBeam(-halfWidth, beam1Y, midZ, Math.PI / 2, segmentLength);
      addBeam(-halfWidth, beam2Y, midZ, Math.PI / 2, segmentLength);
    }

    // East wall (runs along Z axis)
    for (let z = -halfLength; z < halfLength; z += postSpacing) {
      const segmentLength = Math.min(postSpacing, halfLength - z);
      const midZ = z + segmentLength / 2;
      
      addPost(halfWidth, postHeight / 2, z, Math.PI / 2, halfPostWidth, postWidth);
      addPost(halfWidth, postHeight / 2, z + segmentLength, Math.PI / 2, halfPostWidth, postWidth);
      addBeam(halfWidth, beam1Y, midZ, Math.PI / 2, segmentLength);
      addBeam(halfWidth, beam2Y, midZ, Math.PI / 2, segmentLength);
    }

    return {
      postMatrices: posts,
      beamMatrices: beams,
      postCount: posts.length,
      beamCount: beams.length
    };
  }, [halfWidth, halfLength, postSpacing, postHeight, beam1Y, beam2Y, beamHeight, beamDepth, postWidth]);

  // Apply matrices to instanced meshes after they're created
  React.useEffect(() => {
    if (postMeshRef.current) {
      // Initialize all instances with zero scale first (makes them invisible)
      const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < postCount; i++) {
        postMeshRef.current.setMatrixAt(i, zeroMatrix);
      }
      // Then apply the actual matrices
      postMatrices.forEach((matrix, i) => {
        postMeshRef.current.setMatrixAt(i, matrix);
      });
      postMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    
    if (beamMeshRef.current) {
      // Initialize all instances with zero scale first (makes them invisible)
      const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < beamCount; i++) {
        beamMeshRef.current.setMatrixAt(i, zeroMatrix);
      }
      // Then apply the actual matrices
      beamMatrices.forEach((matrix, i) => {
        beamMeshRef.current.setMatrixAt(i, matrix);
      });
      beamMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [postMatrices, beamMatrices, postCount, beamCount]);

  return (
    <group>
      {/* Instanced posts - single draw call for all posts */}
      <instancedMesh ref={postMeshRef} args={[null, null, postCount]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </instancedMesh>

      {/* Instanced beams - single draw call for all beams */}
      <instancedMesh ref={beamMeshRef} args={[null, null, beamCount]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </instancedMesh>
    </group>
  );
}

// 1. The Floor Component
export function CheckerboardFloor({floorWidth = 100, floorDepth = 2, floorLength = 100, usePicketFence = false, ...props}) {
  const texture = useMemo(() => createCheckerboardTexture({ size: 32, color1: '#4a7c59', color2: '#6b6b6b', floorWidth, floorLength }), [floorWidth, floorLength])
  const fenceHeight = 2
  const fenceThickness = 0.5
  
  return (
    <>
      <RigidBody type="fixed" colliders={false} {...props}>
        <mesh receiveShadow position={[0, -floorDepth / 2, 0]}>
          {/* The visual representation of our collider */}
          <boxGeometry args={[floorWidth, floorDepth, floorLength]} />
          <meshStandardMaterial map={texture} />
        </mesh>
        
        {/* Floor collider */}
        <CuboidCollider 
          args={[floorWidth / 2, floorDepth / 2, floorLength / 2]} 
          position={[0, -floorDepth / 2, 0]} 
          restitution={0.2}
          friction={0.6}
        />
        
        {/* Fence colliders - invisible walls to prevent sphere from rolling off */}
        {/* Front wall (positive Z) */}
        <CuboidCollider 
          args={[floorWidth / 2, fenceHeight / 2, fenceThickness / 2]} 
          position={[0, fenceHeight / 2, floorLength / 2]} 
        />
        {/* Back wall (negative Z) */}
        <CuboidCollider 
          args={[floorWidth / 2, fenceHeight / 2, fenceThickness / 2]} 
          position={[0, fenceHeight / 2, -floorLength / 2]} 
        />
        {/* Left wall (negative X) */}
        <CuboidCollider 
          args={[fenceThickness / 2, fenceHeight / 2, floorLength / 2]} 
          position={[-floorWidth / 2, fenceHeight / 2, 0]} 
        />
        {/* Right wall (positive X) */}
        <CuboidCollider 
          args={[fenceThickness / 2, fenceHeight / 2, floorLength / 2]} 
          position={[floorWidth / 2, fenceHeight / 2, 0]} 
        />
      </RigidBody>
      
      {/* Boundary visualization - conditional based on usePicketFence flag */}
      {usePicketFence ? (
        /* Detailed picket fence with instanced geometry */
        <PicketFence floorWidth={floorWidth} floorLength={floorLength} postSpacing={5} color="#929292" />
      ) : (
        /* Simple solid walls - lower triangle count */
        <SimpleBoundaryWalls floorWidth={floorWidth} floorLength={floorLength} color="#49535f" />
      )}
    </>
  )
}
