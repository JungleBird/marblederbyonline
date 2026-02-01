import React, { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useRapier } from "@react-three/rapier";
import { useGameStore } from "../stores/gameStore";

// Keyboard input hook
export function useKeyboardControls() {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    center: false,
    reset: false,
    jump: false,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          keys.current.forward = true;
          break;
        case "ArrowDown":
        case "KeyS":
          keys.current.backward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          keys.current.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          keys.current.right = true;
          break;
        case "KeyC":
          keys.current.center = true;
          break;
        case "KeyR":
          keys.current.reset = true;
          break;
        case "Space":
          keys.current.jump = true;
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          keys.current.forward = false;
          break;
        case "ArrowDown":
        case "KeyS":
          keys.current.backward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          keys.current.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          keys.current.right = false;
          break;
        case "KeyC":
          keys.current.center = false;
          break;
        case "KeyR":
          keys.current.reset = false;
          break;
        case "Space":
          keys.current.jump = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
}

export const useResetToStartingPoint = ({
  characterRef,
  initialPosition,
  initialRotation,
}) => {
  const triggeredEvents = useGameStore((state) => state.triggeredEvents);

  const resetPosition = useCallback(() => {
    // Disable reset if the front door is latched
    if (triggeredEvents["FrontDoorLatched"]) return;

    if (!characterRef.current) return;

    const rb = characterRef.current;

    // Check if it's a Rapier RigidBody (has setTranslation method)
    if (rb.setTranslation) {
      // Handle array or object for initialPosition
      const pos = Array.isArray(initialPosition)
        ? {
            x: initialPosition[0],
            y: initialPosition[1],
            z: initialPosition[2],
          }
        : initialPosition;

      rb.setTranslation(pos, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, initialRotation || 0, 0)
      );
      rb.setRotation(q, true);
    } else {
      // Standard mesh reset
      const pos = Array.isArray(initialPosition)
        ? {
            x: initialPosition[0],
            y: initialPosition[1],
            z: initialPosition[2],
          }
        : initialPosition;
      rb.position.set(pos.x, pos.y, pos.z);
      // Reset rotation (assuming Y-axis rotation for character)
      rb.rotation.set(0, initialRotation || 0, 0);
    }
  }, [characterRef, initialPosition, initialRotation, triggeredEvents]);

  return resetPosition;
};

/**
 * Ground detection hook using Rapier raycast
 * @param {Object} rigidBodyRef - Ref to the RigidBody
 * @param {Object} options - Configuration options
 * @param {number} options.castDistance - Distance to cast ray downward (default: 0.6 for sphere radius)
 * @param {number} options.groundTolerance - Extra buffer for ground detection (default: 0.05)
 * @returns {function} - Function that returns true if grounded, false otherwise
 */
export const useGroundDetection = (rigidBodyRef, options = {}) => {
  const { rapier, world } = useRapier();
  
  const {
    castDistance = 0.6,
    groundTolerance = 0.05,
  } = options;

  // Pre-allocate ray origin and direction to avoid garbage collection
  const rayOriginRef = useRef({ x: 0, y: 0, z: 0 });
  const rayDirRef = useRef({ x: 0, y: -1, z: 0 });

  const checkGrounded = useCallback(() => {
    if (!rigidBodyRef.current || !rapier || !world) return false;
    
    const position = rigidBodyRef.current.translation();
    const maxDistance = castDistance + groundTolerance;

    // Reuse pre-allocated ray origin
    rayOriginRef.current.x = position.x;
    rayOriginRef.current.y = position.y;
    rayOriginRef.current.z = position.z;

    const ray = new rapier.Ray(rayOriginRef.current, rayDirRef.current);
    const hit = world.castRay(
      ray,
      maxDistance,
      true, // solid
      undefined, // filter flags
      undefined, // filter groups
      undefined, // filter exclude collider
      rigidBodyRef.current // exclude self
    );

    return hit !== null;
  }, [rigidBodyRef, rapier, world, castDistance, groundTolerance]);

  return checkGrounded;
};

/**
 * Jump hook with variable height based on hold duration
 * @param {Object} options - Configuration options
 * @param {Object} options.rigidBodyRef - Ref to the RigidBody
 * @param {number} options.howHigh - Maximum jump height in units (default: 3)
 * @param {Object} options.keys - Keys ref from useKeyboardControls
 * @param {function} options.checkGrounded - Function to check if grounded (from useGroundDetection)
 * @param {number} options.maxHoldTime - Time in seconds to hold for full jump (default: 0.2)
 */
export const useJump = ({
  rigidBodyRef,
  howHigh = 3,
  keys,
  checkGrounded,
  maxHoldTime = 0.5,
}) => {
  // Track jump state
  const jumpState = useRef({
    isJumping: false,
    jumpStartTime: 0,
    hasReleasedSinceLastJump: true,
    targetVelocity: 0,
    jumpStartSequence: 0, // Sequence number when jump started
  });
  // Track last applied jump impulse (world-space vector)
  const lastJumpImpulseRef = useRef({ x: 0, y: 0, z: 0 });
  
  // Track jump intent for server
  const jumpIntentRef = useRef({
    jumpHeld: false,
    jumpStartSequence: 0,
    targetVelocity: 0,
    maxHoldTime: maxHoldTime,
    howHigh: howHigh,
  });

  const processJump = useCallback(
    (delta) => {
      if (!rigidBodyRef || !rigidBodyRef.current) return;

      const state = jumpState.current;
      const isGrounded = checkGrounded ? checkGrounded() : false;
      const jumpKeyPressed = keys && keys.current ? keys.current.jump : false;

      // Allow next jump once grounded and key not pressed
      if (isGrounded && !jumpKeyPressed) {
        state.hasReleasedSinceLastJump = true;
      }

      // Start jump: only when grounded, key pressed, and previously released
      if (isGrounded && jumpKeyPressed && state.hasReleasedSinceLastJump && !state.isJumping) {
        state.isJumping = true;
        state.jumpStartTime = performance.now();
        state.hasReleasedSinceLastJump = false;

        // Calculate required upward velocity to reach howHigh using physics: v = sqrt(2 * g * h)
        // Rapier's default gravity is 9.81 m/s²
        const gravity = 9.81;
        state.targetVelocity = Math.sqrt(2 * gravity * howHigh);
        
        // Set jump intent for server
        jumpIntentRef.current.jumpHeld = true;
        jumpIntentRef.current.targetVelocity = state.targetVelocity;
      }

      // While jumping, apply constant upward impulse while key is held and within maxHoldTime
      if (state.isJumping) {
        const holdDuration = (performance.now() - state.jumpStartTime) / 1000;

        // Stop applying force if key released or time exceeded
        if (!jumpKeyPressed || holdDuration >= maxHoldTime) {
          state.isJumping = false;
          // Stop impulse when jump ends
          lastJumpImpulseRef.current = { x: 0, y: 0, z: 0 };
          // Clear jump intent
          jumpIntentRef.current.jumpHeld = false;
          return;
        }

        // Apply decaying force for a realistic trajectory
        // Quadratic decay: (1 - progress)^2 gives stronger force at start, weaker at end.
        // The integral of (1-x)^2 from 0 to 1 is 1/3, so we multiply by 3 to reach 
        // the target velocity over maxHoldTime.
        const progress = holdDuration / maxHoldTime;
        const decayFactor = Math.pow(1 - progress, 2);
        
        // Combine target velocity distribution, quadratic decay (x3), and damping compensation (x1.1)
        const impulsePerSecond = (state.targetVelocity / maxHoldTime) * decayFactor * 3;
        const frameImpulse = impulsePerSecond * delta;
        
        rigidBodyRef.current.applyImpulse({ x: 0, y: frameImpulse, z: 0 }, true);
        // Record the applied impulse for network emission
        lastJumpImpulseRef.current = { x: 0, y: frameImpulse, z: 0 };
      }
      // If not jumping this frame, ensure impulse is zero and intent is cleared
      if (!jumpKeyPressed || !state.isJumping) {
        lastJumpImpulseRef.current = { x: 0, y: 0, z: 0 };
        jumpIntentRef.current.jumpHeld = false;
      }
    },
    [rigidBodyRef, howHigh, keys, checkGrounded, maxHoldTime]
  );

  // Expose processor and getters for jump data
  return {
    processJump,
    getLastJumpImpulse: () => lastJumpImpulseRef.current,
    getJumpIntent: () => jumpIntentRef.current,
  };
};

export default function UniversalController() {
  return null;
}
