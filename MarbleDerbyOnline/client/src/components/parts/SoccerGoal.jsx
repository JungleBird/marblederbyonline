import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";

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

// Netting configuration
const NET_SPACING = 0.25;
const NET_THICKNESS = 0.03;

// --- Shared Geometries ---
const tubeGeo = new THREE.CylinderGeometry(TUBE_RADIUS, TUBE_RADIUS, 1, 16);
const cornerGeo = new THREE.TorusGeometry(
  CORNER_RADIUS,
  TUBE_RADIUS,
  16,
  16,
  Math.PI / 2
);
const ropeSegmentGeo = new THREE.CylinderGeometry(
  NET_THICKNESS,
  NET_THICKNESS,
  1,
  8
);
const sphereGeo = new THREE.SphereGeometry(TUBE_RADIUS * 1.1, 16, 16);

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
  scale = 1,
  goalPosition = [0, 0, 0],
  goalRotation = [0, 0, 0],
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
      {/* Using opacity 0 but visible=true so raycaster can detect it */}
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
  // Pre-calculate shared values
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

  // --- Calculate Back Net Matrices ---
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

  // --- Calculate Left Net Matrices ---
  const leftNetMatrices = useMemo(() => {
    const matrices = [];
    const dummy = new THREE.Object3D();
    const upVector = new THREE.Vector3(0, 1, 0);

    // Horizontal lines
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

    // Vertical-ish lines
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

  // --- Calculate Right Net Matrices ---
  const rightNetMatrices = useMemo(() => {
    const matrices = [];
    const dummy = new THREE.Object3D();
    const upVector = new THREE.Vector3(0, 1, 0);

    // Horizontal lines
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

    // Vertical-ish lines
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

  // --- Calculate Top Net Matrices ---
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

    return matrices;
  }, [halfW]);

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <group name="GoalFrame">
        {/* --- Front Face --- */}
        <Bar
          length={WIDTH}
          position={[0, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <Bar
          length={WIDTH}
          position={[0, HEIGHT, 0]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <Bar length={HEIGHT} position={[-halfW, HEIGHT / 2, 0]} />
        <Bar length={HEIGHT} position={[halfW, HEIGHT / 2, 0]} />

        {/* Front Corners */}
        <Corner
          position={[-halfW + CORNER_RADIUS, CORNER_RADIUS, 0]}
          rotation={[0, 0, Math.PI]}
        />
        <Corner
          position={[halfW - CORNER_RADIUS, CORNER_RADIUS, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        />
        <Corner
          position={[-halfW + CORNER_RADIUS, HEIGHT - CORNER_RADIUS, 0]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <Corner
          position={[halfW - CORNER_RADIUS, HEIGHT - CORNER_RADIUS, 0]}
          rotation={[0, 0, 0]}
        />

        {/* --- Back/Side Structure --- */}
        <Bar
          length={DEPTH_BOTTOM}
          position={[-halfW, 0, -DEPTH_BOTTOM / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Bar
          length={DEPTH_BOTTOM}
          position={[halfW, 0, -DEPTH_BOTTOM / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Bar
          length={WIDTH}
          position={[0, 0, -DEPTH_BOTTOM]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <Bar
          length={WIDTH}
          position={[0, HEIGHT, -DEPTH_TOP]}
          rotation={[0, 0, Math.PI / 2]}
        />

        {/* Angled Side Connectors */}
        <Bar
          length={sideConnectorLength}
          position={[-halfW, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 2]}
          rotation={[sideAngle, 0, 0]}
        />
        <Bar
          length={sideConnectorLength}
          position={[halfW, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 2]}
          rotation={[sideAngle, 0, 0]}
        />

        {/* Top Connectors */}
        <Bar
          length={DEPTH_TOP}
          position={[-halfW, HEIGHT, -DEPTH_TOP / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Bar
          length={DEPTH_TOP}
          position={[halfW, HEIGHT, -DEPTH_TOP / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        />

        {/* Back Corner Joints */}
        <SphereJoint position={[-halfW, 0, -DEPTH_BOTTOM]} />
        <SphereJoint position={[halfW, 0, -DEPTH_BOTTOM]} />
        <SphereJoint position={[-halfW, HEIGHT, -DEPTH_TOP]} />
        <SphereJoint position={[halfW, HEIGHT, -DEPTH_TOP]} />

        {/* front Corner Joints */}
        <SphereJoint position={[-halfW, HEIGHT, 0]} />
        <SphereJoint position={[halfW, HEIGHT, 0]} />
      </group>

      {/* --- Net Sections with Transparent Planes --- */}
      <NetSection
        name="BackNet"
        matrices={backNetMatrices}
        planeArgs={[WIDTH, sideConnectorLength]}
        planePosition={[0, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 2]}
        planeRotation={[sideAngle, 0, 0]}
        scale={scale}
        goalPosition={position}
        goalRotation={rotation}
      />

      <NetSection
        name="LeftNet"
        matrices={leftNetMatrices}
        planeArgs={[sideConnectorLength * 0.75, HEIGHT]}
        planePosition={[-halfW, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 4]}
        planeRotation={[0, Math.PI / 2, 0]}
        scale={scale}
        goalPosition={position}
        goalRotation={rotation}
      />

      <NetSection
        name="RightNet"
        matrices={rightNetMatrices}
        planeArgs={[sideConnectorLength * 0.75, HEIGHT]}
        planePosition={[halfW, HEIGHT / 2, -(DEPTH_TOP + DEPTH_BOTTOM) / 4]}
        planeRotation={[0, -Math.PI / 2, 0]}
        scale={scale}
        goalPosition={position}
        goalRotation={rotation}
      />

      <NetSection
        name="TopNet"
        matrices={topNetMatrices}
        planeArgs={[WIDTH, DEPTH_TOP]}
        planePosition={[0, HEIGHT, -DEPTH_TOP / 2]}
        planeRotation={[Math.PI / 2, 0, 0]}
        scale={scale}
        goalPosition={position}
        goalRotation={rotation}
      />
    </group>
  );
}

export default SoccerGoal;
