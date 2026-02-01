import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { KeyboardControls, useKeyboardControls, OrbitControls } from '@react-three/drei';
import { Physics, RigidBody, BallCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useResetToStartingPoint } from '../components/controllers/UniversalController';

// 1. Define the names of your controls
const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  reset: 'reset',
};

const BallMesh = () => (
  <group>
    <BallCollider args={[0.5]} />
    {/* Top Hemisphere */}
    <mesh castShadow>
      <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
    {/* Bottom Hemisphere */}
    <mesh castShadow>
      <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      <meshStandardMaterial color="cyan" />
    </mesh>
  </group>
);

const RollingBall = () => {
  const bodyRef = useRef();
  
  // 2. Use the hook to get keyboard input
  const [, get] = useKeyboardControls();
  
  // Reusable vectors to avoid garbage collection
  const impulse = new THREE.Vector3();
  const torque = new THREE.Vector3();

  const initialPosition = { x: 0, y: 2, z: 0 };
  const initialRotation = 0;

  const resetPosition = useResetToStartingPoint({ characterRef: bodyRef, initialPosition, initialRotation });

  useFrame((state, delta) => {
    if (!bodyRef.current) return;

    const { forward, backward, left, right, reset } = get();
    
    if (reset) {
      resetPosition();
      return;
    }
    
    // Tuning parameters
    const moveForce = 2 * delta; 
    const rollForce = 5 * delta;

    impulse.set(0, 0, 0);
    torque.set(0, 0, 0);

    // Calculate forces based on input
    if (forward) {
      impulse.z -= moveForce;
      torque.x -= rollForce;
    }
    if (backward) {
      impulse.z += moveForce;
      torque.x += rollForce;
    }
    if (left) {
      impulse.x -= moveForce;
      torque.z += rollForce;
    }
    if (right) {
      impulse.x += moveForce;
      torque.z -= rollForce;
    }

    // Apply forces to the physics body
    // wakeUp=true ensures the body doesn't sleep while we try to move it
    bodyRef.current.applyImpulse(impulse, true);
    bodyRef.current.applyTorqueImpulse(torque, true);
  });

  return (
    <RigidBody 
      ref={bodyRef} 
      colliders={false}
      restitution={0.2} 
      friction={2}
      position={[0, 2, 0]}
    >
      <BallMesh />
    </RigidBody>
  );
};

export default function BallControllerTemplate() {
  // 3. Define the Keyboard Map
  const map = [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.reset, keys: ['KeyR'] },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <KeyboardControls map={map}>
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} castShadow />
          
          <Physics>
            <RollingBall />
            
            {/* Simple Ground */}
            <RigidBody type="fixed" friction={2}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#333" />
              </mesh>
            </RigidBody>
          </Physics>

          <OrbitControls />
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
