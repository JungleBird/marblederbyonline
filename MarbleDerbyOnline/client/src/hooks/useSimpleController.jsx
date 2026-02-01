import React, { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../stores/gameStore";
import { useResetToStartingPoint, useGroundDetection } from "./useUniversalController";
import { useKeyboardControls } from "@react-three/drei";

export const keyboardMapWASD = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
  { name: "reset", keys: ["r", "R"] },
  { name: "sprint", keys: ["Shift"] },
  { name: "spacebar", keys: ["Space"] },
];

const ROTATION_AXIS = new THREE.Vector3(0, 1, 0);

// Move a character ref using world-relative WASD/Arrow controls
export const useCharacterMovement = (characterRef, useCameraPerspective = false, speed = 1, options = {}) => {
  const [, get] = useKeyboardControls();
  const { camera } = useThree();

  // Merge options with store defaults
  const {
    initialPosition,
    initialRotation,
    autoRotate = true,
    characterHeight = 1.0, // Height for ground raycast
  } = {
    initialPosition: useGameStore((state) => state.initialPosition),
    initialRotation: useGameStore((state) => state.initialRotation),
    ...options,
  };

  const checkGrounded = useGroundDetection(characterRef, { castDistance: characterHeight / 2 });

  const resetPosition = useResetToStartingPoint({
    characterRef,
    initialPosition,
    initialRotation,
  });

  // Stable references for calculations to avoid garbage collection
  const tempVectors = useMemo(
    () => ({
      move: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      cameraForward: new THREE.Vector3(),
      cameraRight: new THREE.Vector3(),
      upVector: new THREE.Vector3(0, 1, 0),
    }),
    []
  );

  useFrame(() => {
    const body = characterRef.current;
    if (!body) return;

    // 1. Get Input State
    const { forward, backward, left, right, reset, sprint } = get();
    if (reset) resetPosition();

    // 2. Ground detection via shared hook (only for RigidBody)
    const isRigidBody = body.setLinvel && body.linvel;
    const isGrounded = isRigidBody ? checkGrounded() : true; // Default to grounded for non-physics meshes

    // 3. Calculate Movement Direction
    const { move, quat, cameraForward, cameraRight, upVector } = tempVectors;

    if (useCameraPerspective) {
      // Camera-relative movement: calculate direction based on camera orientation
      camera.getWorldDirection(cameraForward);
      cameraForward.y = 0; // Flatten to horizontal plane
      cameraForward.normalize();

      // Get camera's right direction (perpendicular to forward on XZ plane)
      cameraRight.crossVectors(cameraForward, upVector).normalize();

      // Build movement direction relative to camera
      move.set(0, 0, 0);
      if (forward) move.add(cameraForward);
      if (backward) move.sub(cameraForward);
      if (left) move.sub(cameraRight);
      if (right) move.add(cameraRight);
    } else {
      // World-relative movement (original behavior)
      // X-axis: Right (+1) - Left (-1)
      // Z-axis: Backward (+1) - Forward (-1)
      const xDir = Number(right) - Number(left);
      const zDir = Number(backward) - Number(forward);
      move.set(xDir, 0, zDir);
    }

    const isMoving = move.lengthSq() > 0;

    // Pre-calculate scaled movement vector
    if (isMoving) {
      const sprintMultiplier = sprint ? 1.5 : 1;
      move.normalize().multiplyScalar(speed * sprintMultiplier);
    }

    // 4. Apply Movement
    if (isRigidBody) {
      const currentVel = body.linvel();

      // Only apply input forces if grounded
      if (isMoving && isGrounded) {
        // Apply velocity (multiply by 10 to compensate for physics mass/drag)
        body.setLinvel(
          {
            x: move.x * 10,
            y: currentVel.y, // Preserve gravity/jumping
            z: move.z * 10,
          },
          true
        );

        // Rotate character to face movement direction
        if (autoRotate) {
          const angle = Math.atan2(move.x, move.z);
          quat.setFromAxisAngle(ROTATION_AXIS, angle);
          body.setRotation(quat, true);
        }
      } else if (!isGrounded) {
        // Airborne: preserve current momentum, no input control
        // Just let physics handle it
      } else {
        // Grounded but no input: Apply damping (friction) to stop sliding
        body.setLinvel(
          {
            x: currentVel.x * 0.8,
            y: currentVel.y,
            z: currentVel.z * 0.8,
          },
          true
        );
      }

      // Prevent character from tipping over
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    } else if (isMoving) {
      // Fallback: Direct position update for non-physics meshes
      body.position.add(move);

      if (autoRotate) {
        body.rotation.y = Math.atan2(move.x, move.z);
      }
    }
  });
};
