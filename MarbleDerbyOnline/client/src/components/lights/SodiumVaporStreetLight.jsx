import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Sodium vapor lamp color - deep orange-yellow characteristic of real street lights
const SODIUM_VAPOR_COLOR = "#FF9500"; // Classic sodium vapor orange
const SODIUM_VAPOR_COLOR_WARM = "#FFB347"; // Slightly warmer variant

/**
 * Realistic Sodium Vapor Street Light
 * Mimics the characteristic deep orange-yellow glow of real sodium vapor lamps
 */
export function SodiumVaporStreetLight({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  poleHeight = 5,
  armLength = 1.5,
  lightIntensity = 50,
  lightDistance = 20,
  lightAngle = Math.PI / 3,
  castShadow = true,
  flickerEnabled = true,
  flickerIntensity = 0.05,
  ...props
}) {
  const spotLightRef = useRef();
  const pointLightRef = useRef();
  const glowRef = useRef();
  const targetRef = useRef();
  const baseIntensity = useRef(lightIntensity);

  // Set up spotlight target after mount
  useEffect(() => {
    if (spotLightRef.current && targetRef.current) {
      spotLightRef.current.target = targetRef.current;
    }
  }, []);

  // Subtle flicker effect to simulate real sodium vapor lamp behavior
  useFrame((state) => {
    if (!flickerEnabled) return;

    // Very subtle random flicker - sodium vapor lamps have slight variations
    const flicker =
      1 +
      (Math.sin(state.clock.elapsedTime * 50) * 0.02 +
        Math.sin(state.clock.elapsedTime * 23) * 0.015 +
        (Math.random() - 0.5) * flickerIntensity);

    if (spotLightRef.current) {
      spotLightRef.current.intensity = baseIntensity.current * flicker;
    }
    if (pointLightRef.current) {
      pointLightRef.current.intensity = baseIntensity.current * 0.5 * flicker;
    }
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = 2 * flicker;
    }
  });

  // Calculate lamp head position for light placement
  // After rotation, lamp head moves from [armLength, poleHeight-0.3, 0] to [0, poleHeight-0.3, -armLength]
  const lampHeadX = 0;
  const lampHeadY = poleHeight - 0.3;
  const lampHeadZ = armLength;

  return (
    <group position={position} rotation={rotation} {...props}>
      {/* Spotlight target - on the ground below the rotated lamp head */}
      <object3D ref={targetRef} position={[lampHeadX, 0, lampHeadZ]} />

      {/* Visual model group - rotated 90° clockwise so lamp head points toward light direction */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        {/* Main Pole */}
        <mesh position={[0, poleHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.12, poleHeight + 0.2, 12]} />
          <meshStandardMaterial
            color="#2a2a2a"
            roughness={0.7}
            metalness={0.8}
          />
        </mesh>

        {/* Pole Base Plate */}
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[0.25, 0.3, 0.04, 8]} />
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.8}
            metalness={0.6}
          />
        </mesh>

        {/* Square Tapered Anchor Base */}
        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.9}
            metalness={0.4}
          />
        </mesh>
        {/* Tapered top section of anchor base */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.35, 0.3, 0.35]} />
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.9}
            metalness={0.4}
          />
        </mesh>

        {/* Curved Arm (gooseneck) */}
        <group position={[0, poleHeight, 0]}>
          {/* Horizontal arm segment */}
          <mesh
            position={[armLength / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.05, 0.06, armLength, 8]} />
            <meshStandardMaterial
              color="#2a2a2a"
              roughness={0.7}
              metalness={0.8}
            />
          </mesh>

          {/* Curved elbow joint */}
          <mesh position={[armLength, 0, 0]} castShadow>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#2a2a2a"
              roughness={0.7}
              metalness={0.8}
            />
          </mesh>
        </group>

        {/* Lamp Head Housing */}
        <group position={[armLength, poleHeight - 0.1, 0]}>
          {/* Main lamp housing - cobra head style */}
          <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
            <boxGeometry args={[0.5, 0.15, 0.35]} />
            <meshStandardMaterial
              color="#3a3a3a"
              roughness={0.6}
              metalness={0.7}
            />
          </mesh>

          {/* Housing top cover */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.52, 0.02, 0.37]} />
            <meshStandardMaterial
              color="#2a2a2a"
              roughness={0.5}
              metalness={0.8}
            />
          </mesh>

          {/* Glass/lens cover (bottom of housing) */}
          <mesh position={[0, -0.08, 0]} ref={glowRef}>
            <boxGeometry args={[0.45, 0.02, 0.3]} />
            <meshStandardMaterial
              color={SODIUM_VAPOR_COLOR}
              emissive={SODIUM_VAPOR_COLOR}
              emissiveIntensity={2}
              transparent
              opacity={0.9}
              roughness={0.1}
              metalness={0.1}
            />
          </mesh>

          {/* Internal bulb glow (visible through glass) */}
          <mesh position={[0, -0.05, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color={SODIUM_VAPOR_COLOR_WARM}
              emissive={SODIUM_VAPOR_COLOR_WARM}
              emissiveIntensity={3}
              transparent
              opacity={0.8}
            />
          </mesh>



        </group>
      </group>

      {/* Main spot light - positioned at rotated lamp head, pointing down to ground */}
      <spotLight
        ref={spotLightRef}
        position={[lampHeadX, lampHeadY, lampHeadZ]}
        angle={lightAngle}
        penumbra={0.6}
        intensity={lightIntensity}
        distance={lightDistance}
        color={SODIUM_VAPOR_COLOR}
        castShadow={castShadow}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
        decay={1.5}
      />

      {/* Secondary point light - ambient glow from rotated lamp head */}
      <pointLight
        ref={pointLightRef}
        position={[lampHeadX, lampHeadY, lampHeadZ]}
        intensity={lightIntensity * 0.5}
        distance={lightDistance * 0.6}
        color={SODIUM_VAPOR_COLOR_WARM}
        decay={2}
      />
    </group>
  );
}

/**
 * Taller variant - typical highway/parking lot style
 */
export function TallSodiumVaporStreetLight(props) {
  return (
    <SodiumVaporStreetLight
      poleHeight={8}
      armLength={2}
      lightIntensity={80}
      lightDistance={25}
      {...props}
    />
  );
}

/**
 * Shorter variant - pedestrian walkway style
 */
export function ShortSodiumVaporStreetLight(props) {
  return (
    <SodiumVaporStreetLight
      poleHeight={3.5}
      armLength={1}
      lightIntensity={30}
      lightDistance={12}
      {...props}
    />
  );
}

export default SodiumVaporStreetLight;
