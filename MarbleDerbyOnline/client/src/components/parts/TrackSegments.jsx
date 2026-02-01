import React, { useId } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";

// ======================== UTILITIES ========================
const validHexColor = (hexString) => {
  const hexValue = parseInt(hexString.replace("#", "0x"), 16);
  return new THREE.Color(hexValue);
};

// ======================== BASIC COMPONENTS ========================
export function TrackStrip({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  dimensions,
  color,
  userData,
}) {
  return (
    <RigidBody
      type="fixed"
      position={position}
      rotation={rotation}
      userData={userData}
    >
      <CuboidCollider
        args={[dimensions[0] / 2, dimensions[1] / 2, dimensions[2] / 2]}
      />
      <mesh castShadow receiveShadow>
        <boxGeometry args={dimensions} />
        <meshLambertMaterial color={color} opacity={1} />
      </mesh>
    </RigidBody>
  );
}

export function Rail({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length,
  offset,
  isVertical = false,
}) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <CuboidCollider
        args={isVertical ? [0.05, 0.25, length / 2] : [length / 2, 0.25, 0.05]}
        position={offset}
        restitution={0.8}
        friction={0.3}
      />
      <mesh castShadow position={offset}>
        <boxGeometry
          args={isVertical ? [0.1, 0.5, length] : [length, 0.5, 0.1]}
        />
        <meshLambertMaterial color="#654321" />
      </mesh>
    </RigidBody>
  );
}

// Straight Segment
export function TrackStraightSegment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 3,
  height = 0.3,
  length = 5,
}) {
  const trackColor = validHexColor("#8B4513");
  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <group>
        <TrackStrip
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          dimensions={[width, height, length]}
          color={trackColor}
          userData={[]}
        />
        <Rail
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          length={length}
          offset={[-width / 2 + 0.05, 0.4, 0]}
          isVertical={true}
        />
        <Rail
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          length={length}
          offset={[width / 2 - 0.05, 0.4, 0]}
          isVertical={true}
        />
      </group>
    </RigidBody>
  );
}

// Cross Segment (Turn) - Simple overlapping cross
export function TrackCrossSegment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 3,
  height = 0.3,
  length = 5,
}) {
  const trackColor = validHexColor("#797979ff");
  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <group>
        <TrackStrip
          rotation={[0, 0, 0]}
          dimensions={[width, height, length]}
          color={trackColor}
        />
        <TrackStrip
          rotation={[0, Math.PI / 2, 0]}
          dimensions={[width, height, length]}
          color={trackColor}
        />
      </group>
    </RigidBody>
  );
}


export function TrackDropSegment({ position = [0, 0, 0], rotation = [0, 0, 0], width = 3 , height = 0.3, length = 5 }) {
  const id = useId();
  const trackColor = validHexColor("#006fb9ff")
  const holeSize = Math.min(width, length) * 0.4;
  const halfHole = holeSize / 2;

  const stripConfigs = [
    // Extensions
    {
      key: `${id}-ext-E`,
      position: [position[0] + (length / 4 + halfHole / 2), position[1], position[2]],
      rotation: [0, -Math.PI / 2, 0],
      dimensions: [width, height, length / 2 - halfHole],
      colliderArgs: [width / 2, height / 2, (length / 2 - halfHole) / 2],
    },
    {
      key: `${id}-ext-W`,
      position: [position[0] - (length / 4 + halfHole / 2), position[1], position[2]],
      rotation: [0, Math.PI / 2, 0],
      dimensions: [width, height, length / 2 - halfHole],
      colliderArgs: [width / 2, height / 2, (length / 2 - halfHole) / 2],
    },
    // Main strips
    {
      key: `${id}-N`,
      position: [position[0], position[1], position[2] - (length / 4 + halfHole / 2)],
      rotation: [0, 0, 0],
      dimensions: [width, height, length / 2 - halfHole],
      colliderArgs: [width / 2, height / 2, (length / 2 - halfHole) / 2],
    },
    {
      key: `${id}-S`,
      position: [position[0], position[1], position[2] + (length / 4 + halfHole / 2)],
      rotation: [0, 0, 0],
      dimensions: [width, height, length / 2 - halfHole],
      colliderArgs: [width / 2, height / 2, (length / 2 - halfHole) / 2],
    },
  ];

  return (
    <RigidBody type="fixed" position={position} rotation={rotation} userData={{ isRigidBody: true }}>
        <group>
            {stripConfigs.map(({ key, position: stripPos, rotation: stripRot, dimensions, colliderArgs }) => (
                <React.Fragment key={key}>
                <CuboidCollider args={colliderArgs} position={[
                    stripPos[0] - position[0],
                    stripPos[1] - position[1],
                    stripPos[2] - position[2],
                ]} rotation={stripRot} />
                <mesh castShadow receiveShadow position={[
                    stripPos[0] - position[0],
                    stripPos[1] - position[1],
                    stripPos[2] - position[2],
                ]} rotation={stripRot}>
                    <boxGeometry args={dimensions} />
                    <meshLambertMaterial color={trackColor} />
                </mesh>
                </React.Fragment>
            ))}
        </group>
    </RigidBody>
  );
};



export default function TrackSegments() {
  return null;
}
