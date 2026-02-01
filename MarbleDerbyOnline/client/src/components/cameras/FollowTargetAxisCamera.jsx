import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboardControls } from "../../hooks/useUniversalController";

// Hook: follow a target along a primary axis; secondary axis motion only yaws the camera/target
export function useFollowTargetAxis({
  targetRef,
  controlsRef,
  primaryAxis = { z: true },
  secondaryAxis = null,
  springiness = 0.1,
  lookAtTarget = true,
  restrictAngles = false,
}) {
  const keys = useKeyboardControls();
  const { camera } = useThree();
  const worldPos = useRef(new THREE.Vector3());
  const initialOffset = useRef(null);
  const isActive = useRef(false);
  const lastTargetPosition = useRef(new THREE.Vector3());
  const storedInitialOffset = useRef(null);
  const userInteracting = useRef(false);
  const interactionTimeout = useRef(null);

  // Listen for OrbitControls events to detect user interaction
  useEffect(() => {
    if (!controlsRef?.current) return;
    
    const controls = controlsRef.current;
    
    const onStart = () => {
      userInteracting.current = true;
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current);
      }
    };
    
    const onChange = () => {
      // Update offset when user changes camera position
      if (userInteracting.current && initialOffset.current && targetRef.current) {
        targetRef.current.getWorldPosition(worldPos.current);
        initialOffset.current = camera.position.clone().sub(worldPos.current);
      }
    };
    
    const onEnd = () => {
      // Small delay before resuming follow behavior to prevent fighting
      interactionTimeout.current = setTimeout(() => {
        userInteracting.current = false;
      }, 100);
    };
    
    controls.addEventListener('start', onStart);
    controls.addEventListener('change', onChange);
    controls.addEventListener('end', onEnd);
    
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('change', onChange);
      controls.removeEventListener('end', onEnd);
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current);
      }
    };
  }, [controlsRef, camera, targetRef]);

  // Restrict camera angles when restrictAngles is true
  // Limits horizontal (azimuth) and vertical (polar) rotation to ±60° from behind the character
  useEffect(() => {
    if (!controlsRef?.current) return;

    if (restrictAngles) {
      // Horizontal: -60° to +60° from behind (azimuth)
      controlsRef.current.minAzimuthAngle = -Math.PI / 3; // -60°
      controlsRef.current.maxAzimuthAngle = Math.PI / 3;  // +60°
      
      // Vertical: 30° to 150° polar (which is -60° to +60° from horizontal)
      controlsRef.current.minPolarAngle = Math.PI / 6;    // 30° (60° above horizontal)
      controlsRef.current.maxPolarAngle = (5 * Math.PI) / 6; // 150° (60° below horizontal)
      
      // Activate camera following and reset offset to capture current position
      isActive.current = true;
      initialOffset.current = null;
    } else {
      // Reset to defaults (no restrictions)
      controlsRef.current.minAzimuthAngle = -Infinity;
      controlsRef.current.maxAzimuthAngle = Infinity;
      controlsRef.current.minPolarAngle = 0;
      controlsRef.current.maxPolarAngle = Math.PI;
      
      // Deactivate camera following during intro animation
      isActive.current = false;
      initialOffset.current = null;
    }
  }, [restrictAngles, controlsRef]);

  useFrame(() => {
    const targetObj = targetRef.current;
    if (!targetObj || !controlsRef?.current) return;
    
    // Don't apply follow logic until intro animation is complete
    if (!isActive.current) return;

    // Get world position of target
    targetObj.getWorldPosition(worldPos.current);
    const targetPosition = worldPos.current;

    // Capture the offset when first activated (after intro animation)
    if (!initialOffset.current) {
      initialOffset.current = camera.position.clone().sub(targetPosition);
      storedInitialOffset.current = initialOffset.current.clone();
      lastTargetPosition.current.copy(targetPosition);
    }

    // Skip lerping while user is interacting with OrbitControls (zoom/rotate/pan)
    if (userInteracting.current) {
      controlsRef.current.update();
      lastTargetPosition.current.copy(targetPosition);
      return;
    }

    // Determine which axes to follow
    const followX = !!primaryAxis.x;
    const followY = !!primaryAxis.y;
    const followZ = !!primaryAxis.z;

    // Calculate desired camera position based on initial offset
    // Only apply offset on axes we're following
    const desiredCameraPos = camera.position.clone();
    
    if (followX) {
      desiredCameraPos.x = targetPosition.x + initialOffset.current.x;
    }
    if (followY) {
      desiredCameraPos.y = targetPosition.y + initialOffset.current.y;
    }
    if (followZ) {
      desiredCameraPos.z = targetPosition.z + initialOffset.current.z;
    }

    // If "C" is pressed, recenter the camera to initial offset
    if (keys.current.center && storedInitialOffset.current) {
      const idealPosition = targetPosition.clone().add(storedInitialOffset.current);
      camera.position.lerp(idealPosition, springiness);
      controlsRef.current.target.lerp(targetPosition, springiness);
      // Update the current offset to match the stored one
      initialOffset.current.lerp(storedInitialOffset.current, springiness);
    } else {
      // Normal follow behavior
      camera.position.lerp(desiredCameraPos, springiness);
      controlsRef.current.target.lerp(targetPosition, springiness);
    }

    if (lookAtTarget) camera.lookAt(targetPosition);
    controlsRef.current.update();

    // Store current target position for next frame comparison
    lastTargetPosition.current.copy(targetPosition);
  });
}

export default function FollowTargetAxisCamera(props) {
  useFollowTargetAxis(props);
  return null;
}
