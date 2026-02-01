import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Hook: follow a target on all axes, maintaining relative distance
export function useFollowTargetPerspective({
  targetRef,
  offset = [0, 4, -8], // [x, y, z] offset behind and above (negative Z is behind)
  lerpFactor = 0.08,
  lookAhead = 3,
  verticalOffset = 0.5,
  minZoom = 4,
  maxZoom = 20,
  zoomStep = 1.2,
}) {
  const { camera, gl } = useThree();
  const tempVec = useRef(new THREE.Vector3());
  const tempQuat = useRef(new THREE.Quaternion());
  const lookAtVec = useRef(new THREE.Vector3());
  const zoomRef = useRef(Math.abs(offset[2]));

  // Handle scroll wheel for zoom
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      let nextZoom = zoomRef.current * (e.deltaY > 0 ? zoomStep : 1 / zoomStep);
      nextZoom = Math.max(minZoom, Math.min(maxZoom, nextZoom));
      zoomRef.current = nextZoom;
    };
    gl.domElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => gl.domElement.removeEventListener("wheel", handleWheel);
  }, [gl, minZoom, maxZoom, zoomStep]);

  useFrame(() => {
    if (!targetRef.current) return;

    // 1. Get the character's world position and orientation
    targetRef.current.getWorldPosition(tempVec.current);
    targetRef.current.getWorldQuaternion(tempQuat.current);

    // 2. Calculate the offset (behind and above the character, in local space)
    const [ox, oy] = offset;
    const oz = -Math.abs(zoomRef.current); // always behind
    const localOffset = new THREE.Vector3(ox, oy, oz);
    localOffset.applyQuaternion(tempQuat.current); // rotate offset by character's rotation
    const desiredCameraPos = tempVec.current.clone().add(localOffset);

    // 3. Lerp camera to the desired position
    camera.position.lerp(desiredCameraPos, lerpFactor);

    // 4. Look ahead in the character's facing direction
    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(tempQuat.current);
    lookAtVec.current.copy(tempVec.current)
      .add(new THREE.Vector3(0, verticalOffset, 0))
      .add(lookDir.multiplyScalar(lookAhead));
    camera.lookAt(lookAtVec.current);
    camera.up.set(0, 1, 0);
  });
}

export function FollowTargetPerspectiveCamera(props) {
  useFollowTargetPerspective(props);
  return null;
}
