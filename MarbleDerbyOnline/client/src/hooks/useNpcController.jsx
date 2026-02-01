import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";


/* 
NPC STATE methods

linvel() - Linear velocity (x, y, z)
angvel() - Angular velocity (x, y, z)
translation() - Position (already using)
rotation() - Rotation quaternion (already using)

mass() - Current mass
restitution() - Coefficient of restitution (bounciness)
friction() - Friction coefficient
linearDamping() - Linear damping value
angularDamping() - Angular damping value

isSleeping() - Whether the body is in sleep mode
isEnabled() - Whether the body is enabled
isKinematic() - Whether it's kinematic
isDynamic() - Whether it's dynamic
isFixed() - Whether it's fixed/static

worldCom() - World-space center of mass
*/


/**
 * Truncate a number to 5 decimal places for bandwidth optimization
 */
function truncateToDecimals(value, decimals = 4) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function useNpcController({ npcRef, socket, entityType = "npc" }) {
  const lastEmitTime = useRef(0);
  const lastPosition = useRef({ x: 0, y: 0, z: 0 });
  const lastPingTime = useRef(0);
  const serverTickBase = useRef(0);
  const serverTickReceivedAt = useRef(0);
  const localTickOffset = useRef(0);
  const lastInputEmitTime = useRef(0);

  // Listen for server tick synchronization
  useEffect(() => {
    if (!socket) return;

    const handleServerTickSync = (data) => {
      const { serverTick } = data;
      serverTickBase.current = serverTick;
      serverTickReceivedAt.current = Date.now();
      localTickOffset.current = 0;
    };

    socket.on("serverTickSync", handleServerTickSync);

    return () => {
      socket.off("serverTickSync", handleServerTickSync);
    };
  }, [socket]);

  const getInputSequenceNumber = () => {
    if (serverTickBase.current === 0) {
      return localTickOffset.current++;
    }
    const elapsedMs = Date.now() - serverTickReceivedAt.current;
    const estimatedTicks = Math.floor(elapsedMs / (1000 / 60));
    return serverTickBase.current + estimatedTicks + localTickOffset.current++;
  };

  useFrame(() => {
    if (!npcRef.current) return;

    if (socket && socket.connected) {
      const now = Date.now();
      const position = npcRef.current.translation();
      const rotation = npcRef.current.rotation();
      const linearVelocity = npcRef.current.linvel();
      const angularVelocity = npcRef.current.angvel();

      // NPCs don't typically send input, but if you control them client-side, you could add here:
      // if (now - lastInputEmitTime.current >= 50) {
      //   inputSequenceNumber.current++;
      //   socket.emit("clientInput", { inputs: {...}, sequenceNumber: inputSequenceNumber.current, clientPosition: {...} });
      //   lastInputEmitTime.current = now;
      // }

      const positionChanged = 
        Math.abs(position.x - lastPosition.current.x) > 0.01 ||
        Math.abs(position.y - lastPosition.current.y) > 0.01 ||
        Math.abs(position.z - lastPosition.current.z) > 0.01;

      if (now - lastEmitTime.current >= 20 && positionChanged) {
        socket.emit("entityUpdate", {
          entityType,
          position: {
            x: truncateToDecimals(position.x),
            y: truncateToDecimals(position.y),
            z: truncateToDecimals(position.z),
          },
          rotation: {
            x: truncateToDecimals(rotation.x),
            y: truncateToDecimals(rotation.y),
            z: truncateToDecimals(rotation.z),
            w: truncateToDecimals(rotation.w),
          },
          linearVelocity: {
            x: truncateToDecimals(linearVelocity.x),
            y: truncateToDecimals(linearVelocity.y),
            z: truncateToDecimals(linearVelocity.z),
          },
          angularVelocity: {
            x: truncateToDecimals(angularVelocity.x),
            y: truncateToDecimals(angularVelocity.y),
            z: truncateToDecimals(angularVelocity.z),
          },
        });

        lastEmitTime.current = now;
        lastPosition.current = { x: position.x, y: position.y, z: position.z };
      }

      // Emit latency ping on interval from the controller loop
      if (now - lastPingTime.current >= 2000) {
        socket.emit("ping", now);
        lastPingTime.current = now;
      }
    }
  });
}
