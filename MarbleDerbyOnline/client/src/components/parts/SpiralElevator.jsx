import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CuboidCollider,
  CylinderCollider,
  BallCollider,
} from "@react-three/rapier";
import * as THREE from "three";

// Moving step with its own RigidBody for proper physics and visual elements combined
function MovingStep({
  stepRef,
  initialTransform,
  stepWidth,
  stepDepth,
  stepHeight,
  sideHeight,
}) {
  const stepColor = "#888888"; // Main platform - gray
  const innerSideColor = "#ff6b6b"; // Inner wall - red (towards center)
  const outerSideColor = "#4ecdc4"; // Outer wall - teal (towards outside)
  const frontLipColor = "#45b7d1"; // Front lip - blue

  return (
    <RigidBody
      ref={stepRef}
      type="kinematicPosition"
      position={initialTransform.position}
      rotation={initialTransform.rotation}
      colliders={false}
    >
      {/* Visual elements */}

      {/* Main platform collider */}
      <CuboidCollider args={[stepWidth / 2, stepHeight / 2, stepDepth / 2]} />
      {/* Main step platform */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[stepWidth, stepHeight, stepDepth]} />
        <meshStandardMaterial
          color={stepColor}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Inner side wall collider */}
      <CuboidCollider
        args={[0.05, sideHeight / 2, stepDepth / 2]}
        position={[-stepWidth / 2 + 0.05, sideHeight / 2, 0]}
      />
      {/* Inner curved side (towards center) */}
      <mesh
        castShadow
        receiveShadow
        position={[-stepWidth / 2 + 0.05, sideHeight / 2, 0]}
      >
        <boxGeometry args={[0.1, sideHeight, stepDepth]} />
        <meshStandardMaterial
          color={innerSideColor}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Outer side wall collider */}
      <CuboidCollider
        args={[0.05, sideHeight / 2, stepDepth / 2]}
        position={[stepWidth / 2 - 0.05, sideHeight / 2, 0]}
      />
      {/* Outer curved side */}
      <mesh
        castShadow
        receiveShadow
        position={[stepWidth / 2 - 0.05, sideHeight / 2, 0]}
      >
        <boxGeometry args={[0.1, sideHeight, stepDepth]} />
        <meshStandardMaterial
          color={outerSideColor}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Front lip collider */}
      <CuboidCollider
        args={[(stepWidth - 0.1) / 2, 0.15, 0.03]}
        position={[0, sideHeight / 2, stepDepth / 2 - 0.03]}
      />
      {/* Front lip to prevent marble from rolling off */}
      <mesh
        castShadow
        receiveShadow
        position={[0, sideHeight / 2, stepDepth / 2 - 0.03]}
      >
        <boxGeometry args={[stepWidth - 0.1, 0.3, 0.06]} />
        <meshStandardMaterial
          color={frontLipColor}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
    </RigidBody>
  );
}

export default function SpiralElevator({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  height = 20, // Total height of the spiral
  radius = 5, // Radius of the spiral
  turns = 2, // Number of complete rotations
  stepCount = 20, // Number of visible steps at any time
  speed = 0.5, // Speed of step movement (units per second)
  marbleDiameter = 0.6, // Diameter of marble to accommodate
  stepLength = 2, // Length of each step (depth dimension)
}) {
  const progressRef = useRef(0); // Tracks overall animation progress

  // Create refs for each step's RigidBody
  const stepRefs = useRef([]);
  if (stepRefs.current.length !== stepCount) {
    stepRefs.current = Array(stepCount)
      .fill(null)
      .map(() => React.createRef());
  }

  // Calculate step dimensions based on marble size
  const stepWidth = marbleDiameter * 3.0; // Much wider for easy hopping (1.8 units)
  const stepDepth = stepLength; // Use configurable step length
  const stepHeight = 0.1;
  const sideHeight = marbleDiameter * 0.5; // Curved sides height

  // Calculate spiral parameters
  const totalAngle = turns * Math.PI * 2;
  const anglePerStep = totalAngle / stepCount;
  const heightPerStep = height / stepCount;

  // Generate initial step positions
  const stepData = useMemo(() => {
    const steps = [];
    for (let i = 0; i < stepCount; i++) {
      steps.push({ id: i, progress: i / stepCount });
    }
    return steps;
  }, [stepCount]);

  // Ref to store current step states
  const stepsRef = useRef(stepData.map((s) => ({ ...s })));

  // Calculate position and rotation for a step at a given progress (0 to 1)
  const getStepTransform = (progress) => {
    const angle = progress * totalAngle;
    const y = progress * height + position[1]; // Add position offset
    const x = Math.cos(angle) * radius + position[0]; // Add position offset
    const z = Math.sin(angle) * radius + position[2]; // Add position offset

    // Rotate step to face tangent of spiral
    const rotationY = -angle + Math.PI / 2;

    return {
      position: [x, y, z],
      rotation: [0, rotationY, 0],
    };
  };

  // Animation loop - update kinematic RigidBody positions
  useFrame((state, delta) => {
    // Update progress
    const progressSpeed = speed / height; // Normalize speed to height
    progressRef.current += delta * progressSpeed;

    // Update each step's position via setNextKinematicTranslation/Rotation
    stepsRef.current.forEach((step, i) => {
      // Move step up
      step.progress += delta * progressSpeed;

      // Wrap around when step reaches top
      if (step.progress >= 1) {
        step.progress = step.progress - 1;
      }

      // Update RigidBody position
      const ref = stepRefs.current[i];
      if (ref?.current) {
        const transform = getStepTransform(step.progress);

        // Set next kinematic position
        ref.current.setNextKinematicTranslation({
          x: transform.position[0],
          y: transform.position[1],
          z: transform.position[2],
        });

        // Set next kinematic rotation (convert Euler to Quaternion)
        const euler = new THREE.Euler(...transform.rotation);
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        ref.current.setNextKinematicRotation({
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w,
        });
      }
    });
  });

  // Create spiral structure (static rails/guides)
  const spiralGuides = useMemo(() => {
    const points = [];
    const segments = 100;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * totalAngle;
      const y = t * height;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }

    return points;
  }, [totalAngle, height, radius]);

  // Create inner and outer rail curves
  const innerRailCurve = useMemo(() => {
    const points = spiralGuides.map((p) => {
      const angle = Math.atan2(p.z, p.x);
      const innerRadius = radius - stepWidth / 2 - 0.05;
      return new THREE.Vector3(
        Math.cos(angle) * innerRadius,
        p.y,
        Math.sin(angle) * innerRadius
      );
    });
    return new THREE.CatmullRomCurve3(points);
  }, [spiralGuides, radius, stepWidth]);

  const outerRailCurve = useMemo(() => {
    const points = spiralGuides.map((p) => {
      const angle = Math.atan2(p.z, p.x);
      const outerRadius = radius + stepWidth / 2 + 0.05;
      return new THREE.Vector3(
        Math.cos(angle) * outerRadius,
        p.y,
        Math.sin(angle) * outerRadius
      );
    });
    return new THREE.CatmullRomCurve3(points);
  }, [spiralGuides, radius, stepWidth]);

  // Generate rail collision points for static colliders
  const railCollisionPoints = useMemo(() => {
    const points = [];
    const colliderCount = 20; // Number of collision segments for rails

    for (let i = 0; i < colliderCount; i++) {
      const t = i / colliderCount;
      const angle = t * totalAngle;
      const y = t * height;
      const innerRadius = radius - stepWidth / 2 - 0.05;
      const outerRadius = radius + stepWidth / 2 + 0.05;

      points.push({
        inner: {
          position: [
            Math.cos(angle) * innerRadius,
            y,
            Math.sin(angle) * innerRadius,
          ],
          rotation: [0, -angle, 0],
        },
        outer: {
          position: [
            Math.cos(angle) * outerRadius,
            y,
            Math.sin(angle) * outerRadius,
          ],
          rotation: [0, -angle, 0],
        },
      });
    }
    return points;
  }, [totalAngle, height, radius, stepWidth]);

  return (
    <group position={position} rotation={rotation}>
      {/* Static spiral rails with collision */}
      <RigidBody type="fixed" colliders={false}>
        {/* Inner rail mesh */}
        <mesh castShadow>
          <tubeGeometry args={[innerRailCurve, 100, 0.05, 8, false]} />
          <meshStandardMaterial
            color="#444444"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
        {/* Outer rail mesh */}
        <mesh castShadow>
          <tubeGeometry args={[outerRailCurve, 100, 0.05, 8, false]} />
          <meshStandardMaterial
            color="#444444"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* Rail collision segments */}
        {railCollisionPoints.map((point, i) => (
          <React.Fragment key={`rail-collider-${i}`}>
            <BallCollider args={[0.05]} position={point.inner.position} />
            <BallCollider args={[0.05]} position={point.outer.position} />
          </React.Fragment>
        ))}
      </RigidBody>

      {/* Central support column with collision */}
      <RigidBody type="fixed" colliders={false} position={[0, height / 2, 0]}>
        <CylinderCollider args={[height / 2, 0.15]} />
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.15, height, 16]} />
          <meshStandardMaterial
            color="#333333"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      </RigidBody>

      {/* Moving steps - each with its own kinematic RigidBody */}
      {stepData.map((step, i) => {
        const transform = getStepTransform(step.progress);
        return (
          <MovingStep
            key={step.id}
            stepRef={stepRefs.current[i]}
            initialTransform={transform}
            stepWidth={stepWidth}
            stepDepth={stepDepth}
            stepHeight={stepHeight}
            sideHeight={sideHeight}
          />
        );
      })}
    </group>
  );
}
