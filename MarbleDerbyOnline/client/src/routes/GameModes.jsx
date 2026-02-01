import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  OrbitControls,
  Environment,
  SpotLight,
  Edges,
  KeyboardControls,
  Preload,
} from "@react-three/drei";
import { Suspense, useRef, useState, useLayoutEffect, useEffect } from "react";
import { useGameStore } from "../stores/gameStore";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  BallCollider,
} from "@react-three/rapier";
import {
  CharacterRegistry,
  isBallCharacter,
  getCharacterConfig,
} from "../components/characters/CharacterRegistry";
import SimpleGround from "../components/environments/simpleGround";
import {
  useCharacterMovement,
  keyboardMapWASD,
} from "../hooks/useSimpleController";

import { useSphereController } from "../hooks/useSphereController";
import FollowTargetAxisCamera from "../components/cameras/FollowTargetAxisCamera";
import RevolveCameraOnce from "../components/events/RevolveCameraOnce";
import {
  OrientedSpotLightHead,
  AnimatedSpotLight,
} from "../components/parts/SpotLightParts";
import {
  SensorZone,
  SensorZoneIndicator,
} from "../components/parts/SensorZoneParts";
import { ObstructionManager } from "../components/cameras/ObstructionManager";
import FollowCamera from "../components/cameras/FollowCamera";

import DiscoBallEvent from "../components/events/DiscoBallEvent";
import { Perf } from "r3f-perf";

const CAMERA = { position: [0, 0, -5], fov: 50 };
const BACKGROUND = "#0a0a0a";
const MOVE_SPEED = 0.8;

const SPOTLIGHT_HEAD_ZONES = [
  {
    id: "A",
    position: [5.3, 10.5, -15],
    targetPos: [0, 0, -15],
    color: "#ff00a0", // Pink
  },
  {
    id: "B",
    position: [-5.3, 10.5, -25],
    targetPos: [0, 0, -25],
    color: "#00ced1", // Teal
  },
  {
    id: "C",
    position: [5.3, 10.5, -35],
    targetPos: [0, 0, -35],
    color: "#ffa500", // Orange
  },
  {
    id: "D",
    position: [0, 10.5, -42.6],
    targetPos: [0, 2, -48],
    color: "#ffffff", // white
  },
];

const SPOTLIGHT_ZONES = [
  {
    id: "A",
    position: [0, 4, -15],
    lightPos: [5, 10, -15],
    targetPos: [0, 0, -15],
    color: "#ff00a0", // Pink
    intensity: 1400,
    stayLockedEvents: [], // No stay-locked events
  },
  {
    id: "B",
    position: [0, 4, -25],
    lightPos: [-5, 10, -25],
    targetPos: [0, 0, -25],
    color: "#00ced1", // Teal
    intensity: 1400,
    stayLockedEvents: [], // No stay-locked events
  },
  {
    id: "C",
    position: [0, 4, -35],
    lightPos: [5, 10, -35],
    targetPos: [0, 0, -35],
    color: "#ffa500", // Orange
    intensity: 1400,
    stayLockedEvents: [], // No stay-locked events
  },
  {
    id: "D",
    position: [0, 4, -45],
    lightPos: [0, 10, -43],
    targetPos: [0, 2, -48],
    color: "#ffffff", // White (fixed from invalid)
    intensity: 1400,
    stayLockedEvents: ["FrontDoorLatched"], // Add more if needed
  },
];

const SENSOR_ZONES = [
  {
    id: "A",
    position: [0, 4, -15],
    dimensions: [3, 5, 5],
  },
  {
    id: "B",
    position: [0, 4, -25],
    dimensions: [3, 5, 5],
  },
  {
    id: "C",
    position: [0, 4, -35],
    dimensions: [3, 5, 5],
  },
  {
    id: "D",
    position: [0, 4, -45],
    dimensions: [3, 5, 5],
  },
  {
    id: "E1",
    position: [6, 4, 0],
    dimensions: [3, 5, 10],
  },
  {
    id: "E2",
    position: [-6, 4, 0],
    dimensions: [3, 5, 10],
  },
];

function Debugging(activate) {
  return <>{activate && <Perf position="bottom-right" />}</>;
}

function SceneLights({ dimmed }) {
  const ambientRef = useRef();
  const dirRef = useRef();
  const baseAmbient = 3.5; // dimmed by 0.5 units
  const baseDirectional = 3.5;
  const speed = 6; // lerp speed
  const hasDimmed = useRef(false);

  useEffect(() => {
    if (dimmed) hasDimmed.current = true;
  }, [dimmed]);

  useFrame((_, delta) => {
    const t = 1 - Math.exp(-speed * delta);
    const activeDim = hasDimmed.current || dimmed;
    const targetA = baseAmbient * (activeDim ? 0.3 : 1);
    const targetD = baseDirectional * (activeDim ? 0.3 : 1);
    if (ambientRef.current)
      ambientRef.current.intensity +=
        (targetA - ambientRef.current.intensity) * t;
    if (dirRef.current)
      dirRef.current.intensity += (targetD - dirRef.current.intensity) * t;
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={baseAmbient} />
      <directionalLight
        ref={dirRef}
        position={[5, 5, 5]}
        intensity={baseDirectional}
      />
    </>
  );
}

function CameraController({
  controlsRef,
  visualRef,
  useCameraPerspective,
  restrictAngles = false,
}) {
  return (
    <>
      <ObstructionManager target={visualRef} />
      <OrbitControls ref={controlsRef} />

      {useCameraPerspective ? (
        <FollowCamera
          visualRef={visualRef}
          controlsRef={controlsRef}
          springiness={0.1}
        />
      ) : (
        <FollowTargetAxisCamera
          targetRef={visualRef}
          controlsRef={controlsRef}
          primaryAxis={{ z: true }}
          secondaryAxis={{ x: true }}
          restrictAngles={restrictAngles}
        />
      )}
    </>
  );
}

function SensorZonesController() {
  const setSensorState = useGameStore((state) => state.setSensorState);

  // Render sensor zones (must be inside Physics)
  return (
    <>
      {SENSOR_ZONES.map((zone) => (
        <SensorZone
          key={zone.id}
          id={zone.id}
          position={zone.position}
          colliderArgs={zone.dimensions}
          setIsWithinBounds={(isWithin) => setSensorState(zone.id, isWithin)}
          showBorders={false}
        />
      ))}
    </>
  );
}

function EventsController() {
  const sensorStates = useGameStore((state) => state.sensorStates);
  const triggeredEvents = useGameStore((state) => state.triggeredEvents);

  // Prepare the list of spotlights to render
  const spotLightComponents = SPOTLIGHT_ZONES.map((spotlight) => {
    const stayLockedTriggers = (spotlight.stayLockedEvents || []).map(
      (eventKey) => !!triggeredEvents[eventKey]
    );

    return (
      <AnimatedSpotLight
        key={spotlight.id}
        triggerFlag={!!sensorStates[spotlight.id]}
        spotlightPosition={spotlight.lightPos}
        targetPosition={spotlight.targetPos}
        color={spotlight.color}
        maxIntensity={spotlight.intensity}
        stayLockedTriggers={[...stayLockedTriggers]}
      />
    );
  });

  // Prepare the list of spotlight heads to render
  const spotLightHeadComponents = SPOTLIGHT_HEAD_ZONES.map((head) => {
    return (
      <OrientedSpotLightHead
        key={head.id}
        position={head.position}
        targetPosition={head.targetPos}
        color={head.color}
      />
    );
  });

  return (
    <>
      <DiscoBallEvent
        trigger={triggeredEvents.FrontDoorLatched}
        position={[0, 0, 0]}
        scale={1.5}
      />
      <SceneLights dimmed={!!sensorStates.D} />
      {spotLightComponents}
      {spotLightHeadComponents}
    </>
  );
}

function CharacterController({
  characterRef,
  visualRef,
  useCameraPerspective,
}) {
  const charPosition = useGameStore((state) => state.charPosition);
  const charRotation = useGameStore((state) => state.charRotation);
  const setCharPosition = useGameStore((state) => state.setCharPosition);
  const setCharRotation = useGameStore((state) => state.setCharRotation);
  const setCharVelocity = useGameStore((state) => state.setCharVelocity);
  const selectedCharacter = useGameStore((state) => state.selectedCharacter);

  const isBall = isBallCharacter(selectedCharacter);
  const characterConfig = getCharacterConfig(selectedCharacter);
  const CharacterComponent = characterConfig?.component;

  // Performance optimization: throttle store updates
  const updateCounter = useRef(0);
  const lastPos = useRef({ x: 0, y: 0, z: 0 });
  const lastVel = useRef({ x: 0, y: 0, z: 0 });
  const lastRotation = useRef(0);

  if (isBall) {
    useSphereController(characterRef, MOVE_SPEED);
  } else {
    useCharacterMovement(characterRef, useCameraPerspective, MOVE_SPEED);
  }

  // Sync physics state to store - optimized for performance
  useFrame(() => {
    if (!characterRef.current) return;

    // Only update every 4th frame (15 FPS instead of 60 FPS)
    updateCounter.current++;
    if (updateCounter.current % 4 !== 0) return;

    const pos = characterRef.current.translation();
    const vel = characterRef.current.linvel();

    // Check if position changed significantly (avoid unnecessary updates)
    const posChanged =
      Math.abs(pos.x - lastPos.current.x) > 0.01 ||
      Math.abs(pos.y - lastPos.current.y) > 0.01 ||
      Math.abs(pos.z - lastPos.current.z) > 0.01;

    const velChanged =
      Math.abs(vel.x - lastVel.current.x) > 0.01 ||
      Math.abs(vel.y - lastVel.current.y) > 0.01 ||
      Math.abs(vel.z - lastVel.current.z) > 0.01;

    if (posChanged) {
      lastPos.current = { x: pos.x, y: pos.y, z: pos.z };
      setCharPosition(lastPos.current);
    }

    if (velChanged) {
      lastVel.current = { x: vel.x, y: vel.y, z: vel.z };
      setCharVelocity(lastVel.current);
    }

    // Only calculate rotation for non-ball characters (balls don't need Y rotation tracking)
    if (!isBall) {
      const rot = characterRef.current.rotation();
      const yRotation = Math.atan2(
        2 * (rot.w * rot.y + rot.x * rot.z),
        1 - 2 * (rot.y * rot.y + rot.z * rot.z)
      );

      if (Math.abs(yRotation - lastRotation.current) > 0.02) {
        lastRotation.current = yRotation;
        setCharRotation(yRotation);
      }
    }
  });

  return (
    <RigidBody
      ref={characterRef}
      position={[charPosition.x, charPosition.y, charPosition.z]}
      {...(!isBall && { rotation: [0, charRotation, 0] })}
      colliders={isBall ? false : characterConfig?.colliderType || "hull"}
      enabledRotations={
        characterConfig?.enabledRotations || [false, true, false]
      }
      canSleep={false}
      restitution={0.2}
      friction={1}
      linearDamping={isBall ? 0.5 : 0}
      angularDamping={isBall ? 0.5 : 0}
    >
      {/* For ball characters, use explicit BallCollider instead of auto-generated collider */}
      {isBall && <BallCollider args={[0.6]} />}
      <group ref={visualRef}>
        {CharacterComponent && <CharacterComponent />}
      </group>
    </RigidBody>
  );
}

export default function GameModes() {
  const charRef = useRef();
  const visualRef = useRef();
  const controlsRef = useRef();
  const sensorStates = useGameStore((state) => state.sensorStates);

  const triggeredEvents = useGameStore((state) => state.triggeredEvents);
  const triggeredZones = useGameStore((state) => state.triggeredZones);
  const setEventTriggered = useGameStore((state) => state.setEventTriggered);

  // Determine which camera mode to use
  const frontDoorLatched = !!(
    triggeredEvents && triggeredEvents.FrontDoorLatched
  );
  const useCamPerspective =
    frontDoorLatched && (triggeredZones.E1 || triggeredZones.E2);

  // Prepare the status array for the indicator
  const indicatorStatuses = SENSOR_ZONES.map((zone) => !!sensorStates[zone.id]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <SensorZoneIndicator isWithinBounds={indicatorStatuses} />
      <KeyboardControls map={keyboardMapWASD}>
        <Canvas
          camera={CAMERA}
          style={{ background: BACKGROUND }}
          shadows
          gl={{
            antialias: true,
            powerPreference: "high-performance",
          }}
        >
          <Suspense fallback={null}>
            <Physics>
              <CharacterController
                characterRef={charRef}
                visualRef={visualRef}
                useCameraPerspective={useCamPerspective}
              />
              <SensorZonesController />
              <SimpleGround showBorders={false} />
            </Physics>

            <EventsController />

            <RevolveCameraOnce
              targetRef={visualRef}
              controlsRef={controlsRef}
              characterRef={charRef}
              radius={6}
              height={1}
              duration={2.5}
              onAnimationComplete={() =>
                setEventTriggered("introAnimationComplete")
              }
            />

            <CameraController
              controlsRef={controlsRef}
              visualRef={visualRef}
              useCameraPerspective={useCamPerspective}
              restrictAngles={!!triggeredEvents.introAnimationComplete}
            />

            <Debugging activate={false} />

            {/* Preload all assets to prevent frame drops during animation */}
            <Preload all />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

/*


          */
