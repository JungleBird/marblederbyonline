import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { RigidBody, CuboidCollider, ConvexHullCollider } from "@react-three/rapier";

/**
 * SoccerGoal Component
 * A 3D model of the soccer goal with separate net sections for obstruction detection.
 * Each net section (back, left, right, top) is wrapped in a group with an invisible plane.
 */

// --- Configuration ---
const GOAL_COLOR = "#FDB813";
const NET_COLOR = "#FFFFFF";
const ROUGHNESS = 0.4;
const METALNESS = 0.1;

// Dimensions
const WIDTH = 7.0;
const HEIGHT = 3.5;
const DEPTH_BOTTOM = 3;
const DEPTH_TOP = 2;
const TUBE_RADIUS = 0.12;
const CORNER_RADIUS = 0.25;

// Netting configuration - reduce rope density from 0.25 to 0.5 (half the ropes)
const NET_SPACING = 0.5;
const NET_THICKNESS = 0.03;
// Toggle to render collider debug geometry
const DEBUG_COLLIDERS = false;

// Shared geometries - use lower segment counts for tubes/corners
const tubeGeo = new THREE.CylinderGeometry(TUBE_RADIUS, TUBE_RADIUS, 1, 8);
const cornerGeo = new THREE.TorusGeometry(
  CORNER_RADIUS,
  TUBE_RADIUS,
  8,
  8,
  Math.PI / 2
);
const ropeSegmentGeo = new THREE.CylinderGeometry(
  NET_THICKNESS,
  NET_THICKNESS,
  1,
  4
);
const sphereGeo = new THREE.SphereGeometry(TUBE_RADIUS * 1.1, 8, 8);

// --- Helper to create rope matrices ---
const createRopeMatrix = (p1, p2, dummy, upVector) => {
  const vector = new THREE.Vector3().subVectors(p2, p1);
  const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const length = vector.length();

  dummy.position.copy(midpoint);
  dummy.scale.set(1, length, 1);
  dummy.quaternion.setFromUnitVectors(upVector, vector.normalize());
  dummy.updateMatrix();
  return dummy.matrix.clone();
};

// --- Frame Sub-components ---
const Bar = ({ length, ...props }) => {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GOAL_COLOR,
        roughness: ROUGHNESS,
        metalness: METALNESS,
      }),
    []
  );
  return (
    <mesh
      geometry={tubeGeo}
      material={material}
      scale={[1, length, 1]}
      {...props}
    />
  );
};

const Corner = ({ rotation, ...props }) => {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GOAL_COLOR,
        roughness: ROUGHNESS,
        metalness: METALNESS,
      }),
    []
  );
  return (
    <mesh
      geometry={cornerGeo}
      material={material}
      rotation={rotation}
      {...props}
    />
  );
};

const SphereJoint = ({ position }) => {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GOAL_COLOR,
        roughness: ROUGHNESS,
        metalness: METALNESS,
      }),
    []
  );
  return <mesh geometry={sphereGeo} material={material} position={position} />;
};

// --- NetSection Component ---
// Wraps a group of net ropes with an invisible plane for obstruction detection
const NetSection = ({
  name,
  matrices,
  planeArgs,
  planePosition,
  planeRotation,
}) => {
  const meshRef = useRef();

  // Each NetSection gets its own material instance to avoid shared state issues
  const sectionMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: NET_COLOR,
        roughness: 0.8,
        flatShading: true,
      }),
    []
  );

  useLayoutEffect(() => {
    if (meshRef.current && matrices.length > 0) {
      matrices.forEach((matrix, i) => {
        meshRef.current.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  return (
    <group name={name}>
      {/* Transparent plane for raycast obstruction detection */}
      <mesh
        position={planePosition}
        rotation={planeRotation}
        userData={{ keepInvisible: true }}
      >
        <planeGeometry args={planeArgs} />
        <meshBasicMaterial
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Net ropes */}
      {matrices.length > 0 && (
        <instancedMesh
          ref={meshRef}
          args={[ropeSegmentGeo, sectionMaterial, matrices.length]}
        />
      )}
    </group>
  );
};

// --- Main Component ---
export function SoccerGoal({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  // Pre-calculate shared values based on constants
  const halfW = WIDTH / 2;
  const sideConnectorLength = new THREE.Vector3(
    0,
    HEIGHT,
    -DEPTH_TOP
  ).distanceTo(new THREE.Vector3(0, 0, -DEPTH_BOTTOM));
  const sideVec = new THREE.Vector3(
    0,
    HEIGHT,
    DEPTH_BOTTOM - DEPTH_TOP
  ).normalize();
  const sideAngle = Math.acos(sideVec.y);

  // --- Calculate Net Matrices (Visuals) used by NetSections ---
  // Note: These calculations are in LOCAL UN-SCALED space. 
  // The scaling is applied to the container group.
  
  const backNetMatrices = useMemo(() => {
    const matrices = [];
    const dummy = new THREE.Object3D();
    const upVector = new THREE.Vector3(0, 1, 0);
    // Vertical lines
    for (let x = -halfW; x <= halfW + 0.01; x += NET_SPACING) {
      const pTop = new THREE.Vector3(x, HEIGHT, -DEPTH_TOP);
      const pBottom = new THREE.Vector3(x, 0, -DEPTH_BOTTOM);
      matrices.push(createRopeMatrix(pBottom, pTop, dummy, upVector));
    }
    // Horizontal lines
    for (let y = 0; y <= HEIGHT + 0.01; y += NET_SPACING) {
      const t = y / HEIGHT;
      const zDepth = THREE.MathUtils.lerp(-DEPTH_BOTTOM, -DEPTH_TOP, t);
      const pLeft = new THREE.Vector3(-halfW, y, zDepth);
      const pRight = new THREE.Vector3(halfW, y, zDepth);
      matrices.push(createRopeMatrix(pLeft, pRight, dummy, upVector));
    }
    return matrices;
  }, [halfW]);

  const leftNetMatrices = useMemo(() => {
    const matrices = [];
    const dummy = new THREE.Object3D();
    const upVector = new THREE.Vector3(0, 1, 0);
    // Horizontal
    for (let y = 0; y <= HEIGHT + 0.01; y += NET_SPACING) {
      const t = y / HEIGHT;
      const zBack = THREE.MathUtils.lerp(-DEPTH_BOTTOM, -DEPTH_TOP, t);
      matrices.push(
        createRopeMatrix(
          new THREE.Vector3(-halfW, y, 0),
          new THREE.Vector3(-halfW, y, zBack + TUBE_RADIUS),
          dummy,
          upVector
        )
      );
    }
    // Vertical-ish
    const sideSteps = Math.floor(DEPTH_BOTTOM / NET_SPACING);
    for (let i = 1; i <= sideSteps; i++) {
        const t = i / sideSteps;
        const bottomZ = -DEPTH_BOTTOM * t;
        const topZ = -DEPTH_TOP * t;
        matrices.push(
            createRopeMatrix(
            new THREE.Vector3(-halfW, 0, bottomZ),
            new THREE.Vector3(-halfW, HEIGHT, topZ),
            dummy,
            upVector
            )
        );
    }
    return matrices;
  }, [halfW]);

  const rightNetMatrices = useMemo(() => {
    const matrices = [];
    const dummy = new THREE.Object3D();
    const upVector = new THREE.Vector3(0, 1, 0);
    // Horizontal
    for (let y = 0; y <= HEIGHT + 0.01; y += NET_SPACING) {
      const t = y / HEIGHT;
      const zBack = THREE.MathUtils.lerp(-DEPTH_BOTTOM, -DEPTH_TOP, t);
      matrices.push(
        createRopeMatrix(
          new THREE.Vector3(halfW, y, 0),
          new THREE.Vector3(halfW, y, zBack + TUBE_RADIUS),
          dummy,
          upVector
        )
      );
    }
    // Vertical-ish
    const sideSteps = Math.floor(DEPTH_BOTTOM / NET_SPACING);
    for (let i = 1; i <= sideSteps; i++) {
        const t = i / sideSteps;
        const bottomZ = -DEPTH_BOTTOM * t;
        const topZ = -DEPTH_TOP * t;
        matrices.push(
            createRopeMatrix(
            new THREE.Vector3(halfW, 0, bottomZ),
            new THREE.Vector3(halfW, HEIGHT, topZ),
            dummy,
            upVector
            )
        );
    }
    return matrices;
  }, [halfW]);

  const topNetMatrices = useMemo(() => {
    const matrices = [];
    const dummy = new THREE.Object3D();
    const upVector = new THREE.Vector3(0, 1, 0);
    for (let x = -halfW; x <= halfW + 0.01; x += NET_SPACING) {
      matrices.push(
        createRopeMatrix(
          new THREE.Vector3(x, HEIGHT, -TUBE_RADIUS),
          new THREE.Vector3(x, HEIGHT, -DEPTH_TOP + TUBE_RADIUS),
          dummy,
          upVector
        )
      );
    }
    // Add perpendicular lines across the width to form a grid on the top net
    for (
      let z = -TUBE_RADIUS;
      z >= -DEPTH_TOP + TUBE_RADIUS - 0.001;
      z -= NET_SPACING
    ) {
      matrices.push(
        createRopeMatrix(
          new THREE.Vector3(-halfW, HEIGHT, z),
          new THREE.Vector3(halfW, HEIGHT, z),
          dummy,
          upVector
        )
      );
    }
    return matrices;
  }, [halfW]);


  // --- Helper for Side Net Convex Hulls ---
  // Pre-calculates LOCAL vertices, scaled by SCALE prop
  const sideNetGeometry = useMemo(() => {
    const thickness = 0.05 * scale;
    
    // Define local vertices for Left Net (Trapezoid prism)
    const leftVerts = [
      // Inner face
      [-halfW + thickness, 0, 0],
      [-halfW + thickness, HEIGHT, 0],
      [-halfW + thickness, HEIGHT, -DEPTH_TOP],
      [-halfW + thickness, 0, -DEPTH_BOTTOM],
      // Outer face
      [-halfW - thickness, 0, 0],
      [-halfW - thickness, HEIGHT, 0],
      [-halfW - thickness, HEIGHT, -DEPTH_TOP],
      [-halfW - thickness, 0, -DEPTH_BOTTOM],
    ].map(v => [v[0] * scale, v[1] * scale, v[2] * scale]); // Apply Scale immediately

    // Define local vertices for Right Net 
    const rightVerts = [
      // Inner face
      [halfW - thickness, 0, 0],
      [halfW - thickness, HEIGHT, 0],
      [halfW - thickness, HEIGHT, -DEPTH_TOP],
      [halfW - thickness, 0, -DEPTH_BOTTOM],
      // Outer face
      [halfW + thickness, 0, 0],
      [halfW + thickness, HEIGHT, 0],
      [halfW + thickness, HEIGHT, -DEPTH_TOP],
      [halfW + thickness, 0, -DEPTH_BOTTOM],
    ].map(v => [v[0] * scale, v[1] * scale, v[2] * scale]);

    // Flatten for ConvexHullCollider
    const flatten = (verts) => {
        const arr = [];
        verts.forEach(v => arr.push(...v));
        return new Float32Array(arr);
    }

    return {
        left: { vertices: flatten(leftVerts), raw: leftVerts },
        right: { vertices: flatten(rightVerts), raw: rightVerts }
    };
  }, [halfW, scale]);


  // --- Debug Geometry Helper ---
  const generateDebugGeometry = (vertices) => {
      const geo = new THREE.BufferGeometry();
      const positions = [];
      vertices.forEach(v => positions.push(...v));
      
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      // Manually index a convex shape or just use Points/Line for debug? 
      // To keep it simple and assuming roughly ordered points (prism), let's use a known index set for our 8-point prism
      const indices = [
        0, 1, 5, 0, 5, 4, // Front
        2, 3, 7, 2, 7, 6, // Back
        0, 4, 7, 0, 7, 3, // Bottom
        1, 2, 6, 1, 6, 5, // Top
        0, 3, 2, 0, 2, 1, // Inner
        4, 5, 6, 4, 6, 7  // Outer
      ];
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
  };

  const leftDebugGeo = useMemo(() => generateDebugGeometry(sideNetGeometry.left.raw), [sideNetGeometry]);
  const rightDebugGeo = useMemo(() => generateDebugGeometry(sideNetGeometry.right.raw), [sideNetGeometry]);


  // --- Render ---
  // The RigidBody is the root container in the physics world.
  // Visuals are children (scaled).
  // Colliders are children (locally offset and scaled via args).
  
  return (
    <RigidBody 
        type="fixed" 
        position={position} 
        rotation={rotation} 
        colliders={false} // We define child colliders manually
    >
        
        {/* --- Visuals Group (SCALED) --- */}
        <group scale={[scale, scale, scale]}>
            <group name="GoalFrame">
                {/* Frame Bars/Corners reused from previous code */}
                {/* Front Face */}
                <Bar length={WIDTH} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
                <Bar length={WIDTH} position={[0, HEIGHT, 0]} rotation={[0, 0, Math.PI / 2]} />
                <Bar length={HEIGHT} position={[-halfW, HEIGHT / 2, 0]} />
                <Bar length={HEIGHT} position={[halfW, HEIGHT / 2, 0]} />
                {/* Front Corners */}
                <Corner position={[-halfW + CORNER_RADIUS, CORNER_RADIUS, 0]} rotation={[0, 0, Math.PI]} />
                <Corner position={[halfW - CORNER_RADIUS, CORNER_RADIUS, 0]} rotation={[0, 0, -Math.PI / 2]} />
                <Corner position={[-halfW + CORNER_RADIUS, HEIGHT - CORNER_RADIUS, 0]} rotation={[0, 0, Math.PI / 2]} />
                <Corner position={[halfW - CORNER_RADIUS, HEIGHT - CORNER_RADIUS, 0]} rotation={[0, 0, 0]} />
                {/* Back/Side Structure */}
                <Bar length={DEPTH_BOTTOM} position={[-halfW, 0, -DEPTH_BOTTOM / 2]} rotation={[Math.PI / 2, 0, 0]} />
                <Bar length={DEPTH_BOTTOM} position={[halfW, 0, -DEPTH_BOTTOM / 2]} rotation={[Math.PI / 2, 0, 0]} />
                <Bar length={WIDTH} position={[0, 0, -DEPTH_BOTTOM]} rotation={[0, 0, Math.PI / 2]} />
                <Bar length={WIDTH} position={[0, HEIGHT, -DEPTH_TOP]} rotation={[0, 0, Math.PI / 2]} />
                {/* Angled Side Connectors */}
                <Bar length={sideConnectorLength} position={[-halfW, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 2]} rotation={[sideAngle, 0, 0]} />
                <Bar length={sideConnectorLength} position={[halfW, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 2]} rotation={[sideAngle, 0, 0]} />
                {/* Top Connectors */}
                <Bar length={DEPTH_TOP} position={[-halfW, HEIGHT, -DEPTH_TOP / 2]} rotation={[Math.PI / 2, 0, 0]} />
                <Bar length={DEPTH_TOP} position={[halfW, HEIGHT, -DEPTH_TOP / 2]} rotation={[Math.PI / 2, 0, 0]} />
                {/* Joints */}
                <SphereJoint position={[-halfW, 0, -DEPTH_BOTTOM]} />
                <SphereJoint position={[halfW, 0, -DEPTH_BOTTOM]} />
                <SphereJoint position={[-halfW, HEIGHT, -DEPTH_TOP]} />
                <SphereJoint position={[halfW, HEIGHT, -DEPTH_TOP]} />
                <SphereJoint position={[-halfW, HEIGHT, 0]} />
                <SphereJoint position={[halfW, HEIGHT, 0]} />
            </group>

            {/* Net Sections (Visuals) */}
            <NetSection name="BackNet" matrices={backNetMatrices} planeArgs={[WIDTH, sideConnectorLength]} planePosition={[0, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 2]} planeRotation={[sideAngle, 0, 0]} />
            <NetSection name="LeftNet" matrices={leftNetMatrices} planeArgs={[sideConnectorLength * 0.75, HEIGHT]} planePosition={[-halfW, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 4]} planeRotation={[0, Math.PI / 2, 0]} />
            <NetSection name="RightNet" matrices={rightNetMatrices} planeArgs={[sideConnectorLength * 0.75, HEIGHT]} planePosition={[halfW, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 4]} planeRotation={[0, -Math.PI / 2, 0]} />
            <NetSection name="TopNet" matrices={topNetMatrices} planeArgs={[WIDTH, DEPTH_TOP]} planePosition={[0, HEIGHT, -DEPTH_TOP / 2]} planeRotation={[Math.PI / 2, 0, 0]} />
        </group>


        {/* --- Physics Colliders (LOCALLY DEFINED, SCALED ARGS) --- */}
        {/* Note: Rapier handles the World Transform of the Body. We just set local offsets relative to that body. */}
        
        {/* Back Net Collider */}
        {/* Pos: Scaled Center. Rot: Matches Visual Plane. Size: Scaled Extents. */}
        <CuboidCollider 
            args={[(WIDTH/2)*scale, (sideConnectorLength/2)*scale, 0.05*scale]}
            position={[0, (HEIGHT/2)*scale, (-(DEPTH_TOP + DEPTH_BOTTOM)/2)*scale]}
            rotation={[sideAngle, 0, 0]} 
        />
        
        {/* Top Net Collider */}
        <CuboidCollider 
            args={[(WIDTH/2)*scale, (DEPTH_TOP/2)*scale, 0.05*scale]}
            position={[0, HEIGHT*scale, (-DEPTH_TOP/2)*scale]}
            rotation={[Math.PI/2, 0, 0]} 
        />

        {/* Side Nets (Convex Hull) */}
        {/* Vertices are already pre-scaled in sideNetGeometry */}
        <ConvexHullCollider args={[sideNetGeometry.left.vertices]} />
        <ConvexHullCollider args={[sideNetGeometry.right.vertices]} />


        {/* --- Debug Visuals for Colliders --- */}
        {DEBUG_COLLIDERS && (
            <>
                {/* Back Net Debug */}
                <mesh
                    position={[0, (HEIGHT/2)*scale, (-(DEPTH_TOP + DEPTH_BOTTOM)/2)*scale]}
                    rotation={[sideAngle, 0, 0]}
                >
                    <boxGeometry args={[(WIDTH)*scale, (sideConnectorLength)*scale, 0.1*scale]} />
                    <meshBasicMaterial color="#ff2d55" wireframe={false} transparent opacity={0.25} />
                </mesh>

                {/* Top Net Debug */}
                <mesh
                    position={[0, HEIGHT*scale, (-DEPTH_TOP/2)*scale]}
                    rotation={[Math.PI/2, 0, 0]}
                >
                     <boxGeometry args={[(WIDTH)*scale, (DEPTH_TOP)*scale, 0.1*scale]} />
                     <meshBasicMaterial color="#ff2d55" wireframe={false} transparent opacity={0.25} />
                </mesh>

                {/* Left Net Debug */}
                <mesh geometry={leftDebugGeo}>
                    <meshBasicMaterial color="#00ff88" wireframe={false} transparent opacity={0.25} />
                </mesh>

                {/* Right Net Debug */}
                <mesh geometry={rightDebugGeo}>
                    <meshBasicMaterial color="#00ff88" wireframe={false} transparent opacity={0.25} />
                </mesh>
            </>
        )}
    </RigidBody>
  );
}

export default SoccerGoal;
