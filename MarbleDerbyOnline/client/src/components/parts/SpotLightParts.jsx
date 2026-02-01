import React, { useRef, useLayoutEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { SpotLight } from "@react-three/drei";
import * as THREE from "three";

export function SpotLightHead({ color = "#ffffff", ...props }) {
  const housingColor = "#1a1a1a";
  const flapColor = "#111111";

  return (
    <group {...props}>
      {/* Main Cylindrical Housing */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.4, 1.2, 32]} />
        <meshStandardMaterial color={housingColor} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Back Cap */}
      <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
        <meshStandardMaterial color={housingColor} />
      </mesh>

      {/* Front Lens (Emissive) */}
      <mesh position={[0, 0, 0.61]}>
        <circleGeometry args={[0.45, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>

      {/* Barn Doors (Flaps) Group positioned at the front rim */}
      <group position={[0, 0, 0.6]}>
        
        {/* Top Flap */}
        {/* Positioned slightly up, rotated to flare out */}
        <mesh position={[0, 0.5, 0.2]} rotation={[Math.PI / 4, 0, 0]} castShadow>
          <boxGeometry args={[1, 0.8, 0.05]} />
          <meshStandardMaterial color={flapColor} side={2} />
        </mesh>

        {/* Bottom Flap */}
        <mesh position={[0, -0.5, 0.2]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
          <boxGeometry args={[1, 0.8, 0.05]} />
          <meshStandardMaterial color={flapColor} side={2} />
        </mesh>

        {/* Left Flap */}
        <mesh position={[-0.6, 0, 0.2]} rotation={[0, -Math.PI / 4, 0]} castShadow>
          <boxGeometry args={[0.05, 0.8, 0.5]} />
          <meshStandardMaterial color={flapColor} side={2} />
        </mesh>

        {/* Right Flap */}
        <mesh position={[0.6, 0, 0.2]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <boxGeometry args={[0.05, 0.8, 0.5]} />
          <meshStandardMaterial color={flapColor} side={2} />
        </mesh>
      </group>

      {/* U-Bracket (Yoke) Holder - Optional visual detail */}
      <group>
        <mesh position={[0.6, 0, 0]}>
           <boxGeometry args={[0.1, 0.2, 0.2]} />
           <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-0.6, 0, 0]}>
           <boxGeometry args={[0.1, 0.2, 0.2]} />
           <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    </group>
  );
}

export function OrientedSpotLightHead({ position, targetPosition, color="#ffffff" }) {
  const groupRef = useRef();
  useLayoutEffect(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(...targetPosition);
    }
  }, [targetPosition]);

  return (
    <group ref={groupRef} position={position}>
      <SpotLightHead color={color} />
    </group>
  );
}

export function AnimatedSpotLight({
  triggerFlag,
  spotlightPosition = [5, 10, -15],
  targetPosition = [0, 0, -15],
  color = "#ff00a0",
  maxIntensity = 800,
  stayLockedTriggers = []
}) {
  const lightRef = useRef();
  const [intensity, setIntensity] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [target] = useState(() => {
    const t = new THREE.Object3D();
    t.position.set(...targetPosition);
    return t;
  });

  useFrame((state, delta) => {
    //The spotlight will turn on (full intensity) if triggered, or if any "stay locked" trigger is active; otherwise, it will be off.
    const targetIntensity = triggerFlag || stayLockedTriggers.some(trigger => trigger) ?  maxIntensity : 0;
    const targetOpacity = triggerFlag ? 0.5 : 0;

    // Linear interpolation over ~1.5 seconds
    const stepI = (maxIntensity / 1.5) * delta;
    const stepO = 0.5 * delta;

    if (intensity !== targetIntensity) {
      const diff = targetIntensity - intensity;
      const change = Math.sign(diff) * Math.min(Math.abs(diff), stepI);
      setIntensity(intensity + change);
    }

    if (opacity !== targetOpacity) {
      const diff = targetOpacity - opacity;
      const change = Math.sign(diff) * Math.min(Math.abs(diff), stepO);
      setOpacity(opacity + change);
    }
  });

  return (
    <>
      <primitive object={target} />
      <SpotLight
        ref={lightRef}
        target={target}
        castShadow
        position={spotlightPosition}
        angle={0.3}
        penumbra={0.2}
        distance={20}
        attenuation={5}
        anglePower={5}
        intensity={intensity}
        opacity={opacity}
        shadow-mapSize={[1024, 1024]}
        color={color}
      />
    </>
  );
}
