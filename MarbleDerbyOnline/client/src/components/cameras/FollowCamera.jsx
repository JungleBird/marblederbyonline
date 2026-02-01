import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboardControls } from "../../hooks/useUniversalController";

const DEFAULT_OFFSET = new THREE.Vector3(0, 3, 8);

export function useFollowCamera({ visualRef, controlsRef, springiness = 0.1 }) {
  const keys = useKeyboardControls();
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const lastTargetPosition = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  // Reset any angle restrictions when FollowCamera is active
  // This allows free camera orbiting when using this camera mode
  useEffect(() => {
    if (!controlsRef?.current) return;

    // Remove all angle restrictions for free camera movement
    controlsRef.current.minAzimuthAngle = -Infinity;
    controlsRef.current.maxAzimuthAngle = Infinity;
    controlsRef.current.minPolarAngle = 0;
    controlsRef.current.maxPolarAngle = Math.PI;
    controlsRef.current.enableRotate = true;
    controlsRef.current.enablePan = true;
    controlsRef.current.enableZoom = true;
  }, [controlsRef]);

  useFrame(() => {
    if (!visualRef?.current || !controlsRef?.current) return;

    // Get the ball's world position
    visualRef.current.getWorldPosition(targetPosition.current);

    // On first frame, initialize
    if (!initialized.current) {
      lastTargetPosition.current.copy(targetPosition.current);
      controlsRef.current.target.copy(targetPosition.current);
      // Set camera position relative to target (e.g., offset back and up)
      camera.position.copy(targetPosition.current);
      camera.position.add(new THREE.Vector3(0, 3, 8)); // Example offset: 3 units up, 8 units back
      initialized.current = true;
      return;
    }

    // Calculate how much the target moved since last frame
    const targetDelta = targetPosition.current
      .clone()
      .sub(lastTargetPosition.current);

    // Move camera by the same amount the target moved (maintains relative position)
    camera.position.add(targetDelta);

    // Move OrbitControls target to follow ball exactly
    controlsRef.current.target.add(targetDelta);

    // If "C" is pressed, recenter the camera
    if (keys.current.center) {
      const idealPosition = targetPosition.current.clone().add(DEFAULT_OFFSET);
      // Smoothly lerp camera position
      camera.position.lerp(idealPosition, springiness);
      // Smoothly lerp OrbitControls target
      controlsRef.current.target.lerp(targetPosition.current, springiness);
    }

    controlsRef.current.update();

    // Store current target position for next frame
    lastTargetPosition.current.copy(targetPosition.current);
  });
}

export default function FollowCamera(props) {
  useFollowCamera(props);
  return null;
}
