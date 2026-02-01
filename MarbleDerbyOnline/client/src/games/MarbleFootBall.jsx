import React, { useRef, useState } from "react";
import { DoubleSide } from "three";
import { CheckerboardFloor } from "../components/environments/CheckerboardFloor";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { RigidBody, BallCollider } from "@react-three/rapier";

import { GlassMarbleBallMesh } from "../components/characters/GlassMarbleBall";
import { BallMesh } from "../components/characters/Ball";
import { SoccerBallMesh } from "../components/characters/SoccerBall";

import { useSphereController } from "../hooks/useSphereController";
import { useNpcController } from "../hooks/useNpcController";

import { useCollisionUpwardBoost } from "../hooks/useGameMechanics";
import FollowCamera from "../components/cameras/FollowCamera";
import { ObstructionManager } from "../components/cameras/ObstructionManager";
import { ConnectionStatusOverlay } from "../components/overlay/ConnectionStatus";
import {
  SpeedUpdater,
  SpeedometerDisplay,
} from "../components/overlay/Speedometer";
import { useSocketConnection } from "../hooks/useSocketConnection";
import SoccerGoalWithColliders from "../components/parts/SoccerGoalWithColliders";
import { Perf } from "r3f-perf";
import { GroundCrosshair } from "../hooks/useGroundProjections";
import { useGameStore } from "../stores/gameStore";
import { RemoteEntities } from "../components/entities/RemoteEntities";

const BALL_CONFIG = {
  radius: 0.6,
};

function NpcSphere({
  rigidBodyRef,
  position = [0, 0, 0],
  radius = 0.6,
  upwardBoost = 0.5, // Increased default boost
  ...props
}) {
  const npcRef = rigidBodyRef || useRef();
  const npcSocket = useSocketConnection({ name: "npc" });

  // Now includes horizontal separation to prevent sticking
  const handleCollision = useCollisionUpwardBoost({
    rigidBodyRef: npcRef,
    upwardBoost,
    separationBoost: 0.4, // Stronger separation impulse
  });

  useNpcController({ npcRef, socket: npcSocket.socketRef.current });

  return (
    <RigidBody
      ref={npcRef}
      position={position}
      colliders={false}
      linearDamping={0.05}
      angularDamping={0.05}
      restitution={0.8}
      mass={2.0} // SIGNIFICANT: Higher mass prevents player from "crushing" the NPC volume
      ccd={true}
      friction={0.3}
      onCollisionEnter={handleCollision}
    >
      <BallCollider args={[radius]} friction={0.3} restitution={0.8} />
      <SoccerBallMesh radius={radius} />
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
  forceMultiplier = 1, // Multiplier for impulse strength
  ...props
}) {
  // Use the sphere controller hook for camera-relative movement and reset
  useSphereController({
    rigidBodyRef,
    speed,
    radius,
    initialPosition: position,
    socket,
    forceMultiplier: forceMultiplier,
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      colliders={false}
      linearDamping={0.1}
      angularDamping={0.1}
      restitution={0.2}
      mass={mass} // Use the mass parameter
      friction={0.7}
      ccd={true}
      {...props}
    >
      <BallCollider args={[radius]} friction={0.7} restitution={0.2} />
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

export default function MarbleFootBall() {
  const rigidBodyRef = useRef(); //"Where the character IS physically in the game world"
  const visualRef = useRef(); // "What the player SEES and what the camera FOLLOWS"
  const controlsRef = useRef(); // Used to manipulate camera behavior Has methods/properties like .target, .update(), .enabled, .autoRotate
  const npcRigidBodyRef = useRef(); // Track NPC position for ground crosshair
  const speedDisplayRef = useRef(); // DOM ref for direct speed text updates (no re-renders)
  const positionRefs = {
    x: useRef(),
    y: useRef(),
    z: useRef(),
  }; // DOM refs for individual position values

  const playerSocket = useSocketConnection({
    name: "player",
    environmentId: "MarbleFootBall",
  }); //const { socket, socketRef, isConnected, message, sendMessage } = playerSocket;
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111",
            color: "#fff",
            fontSize: "24px",
            zIndex: 1000,
          }}
        >
          <div>
            <div>Loading Game...</div>
            <div style={{ marginTop: "20px", fontSize: "16px" }}>
              Initializing scene...
            </div>
          </div>
        </div>
      )}
      <ConnectionStatusOverlay
        isConnected={playerSocket.isConnected}
        message={playerSocket.message}
        sendMessage={() => playerSocket.sendMessage("Hello from React!")}
        socket={playerSocket.socket}
        clientId={playerSocket.clientId}
      />

      <SpeedometerDisplay
        speedDisplayRef={speedDisplayRef}
        positionRefs={positionRefs}
      />

      <Canvas shadows onCreated={() => setIsLoading(false)}>
        {/* Optimized lighting - reduced from 5 to 2 shadow-casting lights */}
        <pointLight
          position={[0, 40, 0]}
          intensity={1200}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={1500}
        />
        <pointLight
          position={[0, 40, 400]}
          intensity={800}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={1500}
        />
        {/* Additional fill lights without shadows for better performance */}
        <pointLight position={[0, 40, -400]} intensity={600} />
        <ambientLight intensity={0.9} />
        <SpeedUpdater
          rigidBodyRef={rigidBodyRef}
          speedDisplayRef={speedDisplayRef}
          positionRefs={positionRefs}
          sphereRadius={BALL_CONFIG.radius}
        />
        <Physics>
          <CheckerboardFloor
            floorWidth={300}
            floorLength={1200}
            floorDepth={2}
          />

          {/* NPC Sphere */}
          <NpcSphere
            rigidBodyRef={npcRigidBodyRef}
            position={[0, 1, 0]}
            radius={1.6}
          />
          <SphereController
            rigidBodyRef={rigidBodyRef}
            visualRef={visualRef}
            radius={BALL_CONFIG.radius}
            position={[0, 5, 450]}
            socket={playerSocket.socketRef.current}
            mass={8.0}
          />

          {/* Render other connected players */}
          <RemoteEntities />

          {/* Reduced scale from 4 to 3 for better performance */}
          <SoccerGoalWithColliders
            position={[0, 0, 570]}
            rotation={[0, Math.PI, 0]}
            scale={4}
          />
          <SoccerGoalWithColliders
            position={[0, 0, -570]}
            rotation={[0, 0, 0]}
            scale={4}
          />
        </Physics>
        <GroundCrosshair targetRef={npcRigidBodyRef} />
        <CameraController visualRef={visualRef} controlsRef={controlsRef} />
        <Perf position="bottom-right" />
      </Canvas>
    </div>
  );
}
