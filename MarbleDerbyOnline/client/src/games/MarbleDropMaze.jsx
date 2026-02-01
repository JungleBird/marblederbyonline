import React, { useRef, useEffect, useState } from "react";
// Overlay UI component for connection status and messages
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useGameStore } from "../stores/gameStore";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  BallCollider,
  useRapier,
} from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { ObstructionManager } from "../components/cameras/ObstructionManager";
import FollowCamera from "../components/cameras/FollowCamera";
import { CheckerboardFloor } from "../components/environments/CheckerboardFloor";
import { useSphereController } from "../hooks/useSphereController";
import { useNpcController } from "../hooks/useNpcController";
import SoccerGoalWithColliders from "../components/parts/SoccerGoalWithColliders";
import { BallMesh } from "../components/characters/Ball";
import { GlassMarbleBallMesh } from "../components/characters/GlassMarbleBall";

import { SoccerBallMesh } from "../components/characters/SoccerBall";


import { TallSodiumVaporStreetLight } from "../components/lights/SodiumVaporStreetLight";
import {
  TrackStraightSegment,
  TrackCrossSegment,
  TrackDropSegment,
} from "../components/parts/TrackSegments";
import { Perf } from "r3f-perf";
import { ConnectionStatusOverlay } from "../components/overlay/ConnectionStatus";
import { RemoteEntities } from "../components/entities/RemoteEntities";

const BALL_CONFIG = {
  radius: 0.6,
};

// A Simple Box to test the collision
function FallingBox({ position = [0, 5, 0], ...props }) {
  return (
    <RigidBody position={position} {...props}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" roughness={0.4} metalness={0.2} />
      </mesh>
    </RigidBody>
  );
}

function SphereController({
  rigidBodyRef,
  visualRef,
  position = [0, 2, 0],
  radius = BALL_CONFIG.radius, // Match BallMesh default radius
  speed = 1,
  mass = 8.0, // Add mass parameter
  color = "#3498db",
  socket = null, // Add socket prop
  ...props
}) {
  // Use the sphere controller hook for camera-relative movement and reset
  useSphereController({
    rigidBodyRef,
    speed,
    radius,
    initialPosition: position,
    socket,
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      colliders={false}
      linearDamping={0.6}
      angularDamping={0.6}
      restitution={1}
      mass={mass} // Use the mass parameter
      ccd={true}
      {...props}
    >
      <BallCollider args={[radius]} />
      <group ref={visualRef}>
        <GlassMarbleBallMesh radius={radius} />
      </group>
    </RigidBody>
  );
}

function CameraController({ visualRef, controlsRef, springiness = 0.1 }) {
  return (
    <>
      <ObstructionManager target={visualRef} />
      <OrbitControls ref={controlsRef} enablePan={false} />
      <FollowCamera
        visualRef={visualRef}
        controlsRef={controlsRef}
        springiness={springiness}
      />
    </>
  );
}

function StreetLights({}) {
  return (
    <>
      {/* Sodium Vapor Street Lights */}
      <RigidBody
        type="fixed"
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <CuboidCollider args={[0.12, 2.5, 0.12]} position={[0, 2.5, 0]} />
        <TallSodiumVaporStreetLight poleHeight={20} />
      </RigidBody>

      <RigidBody
        type="fixed"
        position={[0, 0, -5]}
        rotation={[0, (Math.PI * 3) / 4, 0]}
      >
        <CuboidCollider args={[0.12, 2.5, 0.12]} position={[0, 2.5, 0]} />
        <TallSodiumVaporStreetLight />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[-5, 0, 0]}
        rotation={[0, -Math.PI / 4, 0]}
      >
        <CuboidCollider args={[0.12, 2.5, 0.12]} position={[0, 2.5, 0]} />
        <TallSodiumVaporStreetLight poleHeight={14} />
      </RigidBody>
    </>
  );
}

function TrackSegments({}) {
  return (
    <>
      <TrackDropSegment position={[5, 5, -10]} />
      <TrackStraightSegment position={[5, 5, -5]} />
      <TrackStraightSegment position={[5, 5, 0]} />
      <TrackStraightSegment position={[5, 5, 5]} />
      <TrackCrossSegment position={[5, 5, 10]} />
      <TrackStraightSegment
        position={[0, 5, 10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <TrackStraightSegment
        position={[-5, 5, 10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <TrackCrossSegment position={[-10, 5, 10]} />

      <TrackCrossSegment position={[5, 10, -10]} />
      <TrackStraightSegment
        position={[0, 10, -10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <TrackStraightSegment
        position={[-5, 10, -10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <TrackCrossSegment position={[-10, 10, -10]} />
      <TrackStraightSegment position={[-10, 10, -5]} />
      <TrackStraightSegment position={[-10, 10, 0]} />
      <TrackStraightSegment position={[-10, 10, 5]} />
      <TrackDropSegment position={[-10, 10, 10]} />

      <TrackDropSegment position={[5, 15, -10]} />
      <TrackStraightSegment position={[5, 15, -5]} />
      <TrackStraightSegment position={[5, 15, 0]} />
      <TrackStraightSegment position={[5, 15, 5]} />
      <TrackCrossSegment position={[5, 15, 10]} />
      <TrackStraightSegment
        position={[0, 15, 10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <TrackStraightSegment
        position={[-5, 15, 10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <TrackCrossSegment position={[-10, 15, 10]} />

      <TrackCrossSegment position={[5, 20, -10]} />
      <TrackStraightSegment
        position={[0, 20, -10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <TrackStraightSegment
        position={[-5, 20, -10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <TrackCrossSegment position={[-10, 20, -10]} />
      <TrackStraightSegment position={[-10, 20, -5]} />
      <TrackStraightSegment position={[-10, 20, 0]} />
      <TrackStraightSegment position={[-10, 20, 5]} />
      <TrackDropSegment position={[-10, 20, 10]} />
    </>
  );
}

// 6. Main Scene
export default function MarbleDropMaze() {
  const rigidBodyRef = useRef(); //"Where the character IS physically in the game world"
  const visualRef = useRef(); // "What the player SEES and what the camera FOLLOWS"
  const controlsRef = useRef(); // Used to manipulate camera behavior Has methods/properties like .target, .update(), .enabled, .autoRotate
  const npcRigidBodyRef = useRef(); // Track NPC position for ground crosshair

  // Use socket connection hook
  const playerSocket = useSocketConnection({ name: "player", environmentId: "MarbleDropMaze" });

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <ConnectionStatusOverlay 
        isConnected={playerSocket.isConnected} 
        message={playerSocket.message} 
        sendMessage={() => playerSocket.sendMessage('Hello from React!')} 
        socket={playerSocket.socket}
        clientId={playerSocket.clientId}
      />

      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[15, 15, 7]}
          intensity={0.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <pointLight position={[10, 10, 10]} intensity={0.5} />

        {/* Physics world provider */}
        <Physics>
          <CheckerboardFloor usePicketFence={true}/>

          <SphereController
            rigidBodyRef={rigidBodyRef}
            visualRef={visualRef}
            radius={BALL_CONFIG.radius}
            position={[5, 23, -10]}
            speed={0.7}
            socket={playerSocket.socketRef.current}
            mass={18.0}
          />

          <FallingBox position={[3, 5, 0]} />
          <FallingBox position={[-3, 7, 0]} />

          <StreetLights />
          <TrackSegments />
          <RemoteEntities />
        </Physics>

        <CameraController visualRef={visualRef} controlsRef={controlsRef} />
        <Perf position="bottom-right" />
      </Canvas>
    </div>
  );
}
