import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { DiscoBallMesh } from '../characters/DiscoBall';

export default function DiscoBallEvent({ position = [0, 0, 0], trigger = [], scale = 1.5 }) {
  const groupRef = useRef();
  const hasBeenTriggered = useRef(false);
  const currentHeight = useRef(30); // Start high (off-screen)
  const targetHeight = 8; // End height (in view)
  const animationSpeed = 0.05; // Lower = smoother, slower animation

  // Ensure trigger is always an array
  const triggerArray = Array.isArray(trigger) ? trigger : [trigger];

  // Animate the disco ball lowering
  useFrame(() => {
    if (!groupRef.current) return;

    // Check if any trigger in the array is true
    const isTriggered = triggerArray.some(t => t === true);
    
    // Once triggered, stay triggered (one-time event)
    if (isTriggered) {
      hasBeenTriggered.current = true;
    }

    if (!hasBeenTriggered.current) return;

    // Smoothly interpolate height towards target
    if (currentHeight.current > targetHeight) {
      currentHeight.current = THREE.MathUtils.lerp(currentHeight.current, targetHeight, animationSpeed);
      groupRef.current.position.y = currentHeight.current;
    }

    // Rotate the disco ball slowly around the Y-axis
    groupRef.current.rotation.y += 0.005;
  });

  return (
    <group ref={groupRef} position={[position[0], currentHeight.current, position[2]]}>
      <DiscoBallMesh scale={scale} />
      
      {/* Central point light */}
      <pointLight intensity={15} distance={20} color="#ffffff" castShadow />
      
      {/* Colorful spotlights shooting out in different directions */}
      <SpotLight
        position={[0, 0, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={50}
        distance={30}
        color="#ff00ff"
        castShadow
        target-position={[5, -10, 5]}
      />
      <SpotLight
        position={[0, 0, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={50}
        distance={30}
        color="#00ced1"
        castShadow
        target-position={[-5, -10, 5]}
      />
      <SpotLight
        position={[0, 0, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={50}
        distance={30}
        color="#ffff00"
        castShadow
        target-position={[5, -10, -5]}
      />
      <SpotLight
        position={[0, 0, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={50}
        distance={30}
        color="#ff6600"
        castShadow
        target-position={[-5, -10, -5]}
      />
      <SpotLight
        position={[0, 0, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={50}
        distance={30}
        color="#00ff00"
        castShadow
        target-position={[0, -10, 8]}
      />
      <SpotLight
        position={[0, 0, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={50}
        distance={30}
        color="#ff0066"
        castShadow
        target-position={[0, -10, -8]}
      />
    </group>
  );
}
