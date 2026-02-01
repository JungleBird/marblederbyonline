import React, { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Edges } from "@react-three/drei";

export function SensorZone({
  id,
  position = [0, 4, -25],
  colliderArgs = [3, 5, 15],
  setIsWithinBounds,
  showBorders = false,
}) {
  const [hovered, setHovered] = useState(false);
  const triggeredZones = useGameStore((s) => s.triggeredZones);
  const setZoneTriggered = useGameStore((s) => s.setZoneTriggered);

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider
        args={colliderArgs} // Half-extents
        sensor
        onIntersectionEnter={() => {
          setIsWithinBounds?.(true);
          // Mark zone as triggered once (persists in store)
          if (id && !triggeredZones?.[id]) {
            setZoneTriggered(id);
          }
        }}
        onIntersectionExit={() => {
          setIsWithinBounds?.(false);
          // Note: triggeredZones stays true permanently once triggered
        }}
      />

      {showBorders && (
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          receiveShadow
        >
          <boxGeometry
            args={[colliderArgs[0] * 2, colliderArgs[1] * 2, colliderArgs[2] * 2]}
          />
          <meshStandardMaterial
            color={hovered ? "orange" : "skyblue"}
            opacity={0.5}
            transparent
          />
          <Edges color="yellow" />
        </mesh>
      )}
    </RigidBody>
  );
}

export function SensorZoneIndicator({ isWithinBounds }) {
  // Ensure isWithinBounds is always an array
  const statuses = Array.isArray(isWithinBounds)
    ? isWithinBounds
    : [isWithinBounds];

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 100,
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        borderRadius: 5,
        fontFamily: "sans-serif",
      }}
    >
      {statuses.map((status, index) => (
        <div key={index} style={{ marginBottom: 4 }}>
          **Zone {index + 1}:**{" "}
          <span
            style={{
              color: status ? "lightgreen" : "tomato",
              fontWeight: "bold",
            }}
          >
            {status ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 8, fontSize: "0.9em", opacity: 0.8 }}>
        Use WASD or Arrow Keys to Move.
      </div>
    </div>
  );
}
