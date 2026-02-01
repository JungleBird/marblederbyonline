import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { KeyboardControls, useKeyboardControls, OrbitControls } from '@react-three/drei';
import { useResetToStartingPoint } from '../components/controllers/UniversalController';

// 1. Define the names of your controls
const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  jump: 'jump',
  reset: 'reset',
};

const MovingBox = () => {
  const meshRef = useRef();

  // 2. Use the hook to subscribe to the defined keys.
  // There are two ways to use this hook:
  // Option A: Get reactive state (good for one-off triggers like 'jump')
  const [sub, get] = useKeyboardControls();
  
  // Option B: Get raw state in the loop (good for continuous movement)
  // We will use 'get()' inside useFrame for smooth movement.

  const initialPosition = { x: 0, y: 0, z: 0 };
  const initialRotation = 0;

  const resetPosition = useResetToStartingPoint({ characterRef: meshRef, initialPosition, initialRotation });

  useFrame((state, delta) => {
    const { forward, backward, left, right, reset } = get();
    
    if (reset) {
      resetPosition();
      return;
    }

    // Movement speed
    const speed = 5 * delta;

    if (meshRef.current) {
      if (forward) meshRef.current.position.z -= speed;
      if (backward) meshRef.current.position.z += speed;
      if (left) meshRef.current.position.x -= speed;
      if (right) meshRef.current.position.x += speed;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

export default function App() {
  // 3. Define the Keyboard Map
  const map = [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.jump, keys: ['Space'] },
    { name: Controls.reset, keys: ['KeyR'] },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* 4. Wrap everything in the KeyboardControls Provider */}
      <KeyboardControls map={map}>
        <Canvas camera={{ position: [0, 5, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          <MovingBox />
          
          <gridHelper args={[20, 20]} />
          <OrbitControls />
        </Canvas>
      </KeyboardControls>
    </div>
  );
}