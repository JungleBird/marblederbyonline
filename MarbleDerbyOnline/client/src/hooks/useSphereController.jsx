import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import {
  useKeyboardControls,
  useResetToStartingPoint,
  useGroundDetection,
  useJump
} from "./useUniversalController";

// Pre-allocated vectors for camera-relative movement calculations
const cameraRelativeVectors = {
  cameraForward: new THREE.Vector3(),
  cameraRight: new THREE.Vector3(),
  moveDirection: new THREE.Vector3(),
  longitudinal: new THREE.Vector3(),
  lateral: new THREE.Vector3(),
  upVector: new THREE.Vector3(0, 1, 0),
  torque: new THREE.Vector3(), // Pre-allocate torque vector
};

const NETWORK_INTERVAL = 20
const PING_INTERVAL = 2000

/**
 * Truncate a number to 5 decimal places for bandwidth optimization
 */
function truncateToDecimals(value, decimals = 4) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate camera-relative force and torque vectors from keyboard input
 * @param {THREE.Camera} camera - The camera to calculate direction from
 * @param {Object} keys - Current keyboard state { forward, backward, left, right }
 * @param {number} speed - Movement speed multiplier
 * @param {number} forceMultiplier - Additional force multiplier
 * @returns {{ forceVector: THREE.Vector3, torqueVector: THREE.Vector3, hasInput: boolean }}
 */
function calculateCameraRelativeForces(camera, keys, speed, forceMultiplier) {
  const { 
    cameraForward, 
    cameraRight, 
    moveDirection, 
    longitudinal, 
    lateral, 
    upVector, 
    torque 
  } = cameraRelativeVectors;

  // Get camera's forward direction (projected onto XZ plane)
  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0; // Flatten to horizontal plane
  cameraForward.normalize();

  // Get camera's right direction (perpendicular to forward on XZ plane)
  cameraRight.crossVectors(cameraForward, upVector).normalize();

  // Build movement components
  longitudinal.set(0, 0, 0);
  lateral.set(0, 0, 0);

  if (keys.forward) longitudinal.add(cameraForward);
  if (keys.backward) longitudinal.sub(cameraForward);
  if (keys.left) lateral.sub(cameraRight);
  if (keys.right) lateral.add(cameraRight);

  // Handle combined inputs:
  // 1. Always give lateral movement the 1.15x boost
  // 2. If turning, dampen forward/backward force to maintain control 
  //    and prevent excessive diagonal speed.
  if (lateral.lengthSq() > 0) {
    lateral.multiplyScalar(1.15);
    
    if (longitudinal.lengthSq() > 0) {
      longitudinal.multiplyScalar(0.87); // Lower F/B force by 13% when steering
    }
  }

  // Combine components
  moveDirection.copy(longitudinal).add(lateral);
  const hasInput = moveDirection.lengthSq() > 0;
  
  if (hasInput) {
    moveDirection.multiplyScalar(speed * 0.15 * forceMultiplier);
    torque.crossVectors(upVector, moveDirection).multiplyScalar(speed * 0.15 * forceMultiplier);
  } else {
    moveDirection.set(0, 0, 0);
    torque.set(0, 0, 0);
  }

  return {
    forceVector: moveDirection.clone(),
    torqueVector: torque.clone(),
    hasInput,
  };
}

// 3. SphereController hook with camera-relative movement
export function useSphereController({
  rigidBodyRef,
  speed = 1,
  radius = 0.6,
  initialPosition = [0, 2, 0],
  socket = null, // Optional socket for multiplayer
  entityType = "player", // Entity type for batched updates
  forceMultiplier = 1, // Multiplier for impulse strength
}) {
  const keys = useKeyboardControls();
  const { camera } = useThree();
  const checkGrounded = useGroundDetection(rigidBodyRef, { castDistance: radius });
  
  // Use jump hook
  const { processJump, getLastJumpImpulse, getJumpIntent } = useJump({
    rigidBodyRef,
    howHigh: 2,
    keys,
    checkGrounded,
    maxHoldTime: 0.25,
  });

  // Throttle combined updates to server (emit every 20ms)
  const lastEmitTime = useRef(0);
  const lastPosition = useRef({ x: 0, y: 0, z: 0 });
  // Throttle latency pings (every 2000ms)
  const lastPingTime = useRef(0);
  // Server tick synchronization
  const serverTickBase = useRef(0);
  const serverTickReceivedAt = useRef(0);
  const localTickOffset = useRef(0);

  // Listen for server tick synchronization
  useEffect(() => {
    if (!socket) return;

    const handleServerTickSync = (data) => {
      const { serverTick, timestamp } = data;
      serverTickBase.current = serverTick;
      serverTickReceivedAt.current = Date.now();
      localTickOffset.current = 0;
      console.log(`Synced to server tick: ${serverTick}`);
    };

    socket.on("serverTickSync", handleServerTickSync);

    return () => {
      socket.off("serverTickSync", handleServerTickSync);
    };
  }, [socket]);

  // Function to get current synchronized input sequence number
  const getInputSequenceNumber = () => {
    if (serverTickBase.current === 0) {
      // Not yet synced with server, use local counter
      return localTickOffset.current++;
    }
    
    // Calculate elapsed ticks since sync (assuming 60Hz tick rate)
    const elapsedMs = Date.now() - serverTickReceivedAt.current;
    const estimatedTicks = Math.floor(elapsedMs / (1000 / 60));
    
    return serverTickBase.current + estimatedTicks + localTickOffset.current++;
  };

  const resetPosition = useResetToStartingPoint({
    characterRef: rigidBodyRef,
    initialPosition: initialPosition,
  });

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    // Process jump logic
    processJump(delta);

    // Reset logic
    if (keys.current.reset) {
      resetPosition();
    }

    // Only apply input forces if grounded
    const isGrounded = checkGrounded();
    if (isGrounded) {
      const { forceVector, torqueVector, hasInput } = calculateCameraRelativeForces(
        camera, 
        keys.current, 
        speed, 
        forceMultiplier
      );

      if (hasInput) {
        // Apply linear impulse for movement
        rigidBodyRef.current.applyImpulse(
          { x: forceVector.x, y: forceVector.y, z: forceVector.z },
          true
        );

        // Apply torque for rolling effect
        rigidBodyRef.current.applyTorqueImpulse(
          { x: torqueVector.x, y: torqueVector.y, z: torqueVector.z },
          true
        );
      }
    }

    // Emit combined input and state to server (batched clientUpdate every 20ms)
    if (socket && socket.connected) {
      const now = Date.now();
      const position = rigidBodyRef.current.translation();
      const rotation = rigidBodyRef.current.rotation();
      const linearVelocity = rigidBodyRef.current.linvel();
      const angularVelocity = rigidBodyRef.current.angvel();

      const positionChanged = 
        Math.abs(position.x - lastPosition.current.x) > 0.01 ||
        Math.abs(position.y - lastPosition.current.y) > 0.01 ||
        Math.abs(position.z - lastPosition.current.z) > 0.01;

      // Send combined update (inputs + state) every 20ms when position changes
      if (now - lastEmitTime.current >= NETWORK_INTERVAL && positionChanged) {
        const sequenceNumber = getInputSequenceNumber();
        
        // Calculate camera-relative force vectors
        const { forceVector, torqueVector, hasInput } = calculateCameraRelativeForces(
          camera, 
          keys.current, 
          speed, 
          forceMultiplier
        );
        
        // Get jump intent for server-side computation
        const jumpIntent = getJumpIntent();

        socket.emit("clientUpdate", {
          entityType,
          inputs: {
            // Send world-space force vectors instead of key presses
            forceVector: hasInput ? {
              x: truncateToDecimals(forceVector.x),
              y: truncateToDecimals(forceVector.y),
              z: truncateToDecimals(forceVector.z),
            } : { x: 0, y: 0, z: 0 },
            torqueVector: hasInput ? {
              x: truncateToDecimals(torqueVector.x),
              y: truncateToDecimals(torqueVector.y),
              z: truncateToDecimals(torqueVector.z),
            } : { x: 0, y: 0, z: 0 },
            jump: keys.current.jump,
            reset: keys.current.reset,
            isGrounded: isGrounded,
            // Send jump intent for server-side computation
            jumpIntent: {
              jumpHeld: jumpIntent.jumpHeld,
              targetVelocity: truncateToDecimals(jumpIntent.targetVelocity),
              maxHoldTime: jumpIntent.maxHoldTime,
              howHigh: jumpIntent.howHigh,
            },
          },
          sequenceNumber: sequenceNumber,
          state: {
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
          },
        });
        
        lastEmitTime.current = now;
        lastPosition.current = { x: position.x, y: position.y, z: position.z };
      }

      // Emit latency ping on interval from the controller loop
      if (now - lastPingTime.current >= PING_INTERVAL) {
        socket.emit("ping", now);
        lastPingTime.current = now;
      }
    }
  });
}
