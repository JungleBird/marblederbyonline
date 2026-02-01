import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";

export function ObstructionManager({ target }) {
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => {
    const rc = new THREE.Raycaster();
    // Set near/far to ensure raycasting works at all distances and angles
    rc.near = 0.01;
    rc.far = 1000;
    return rc;
  }, []);
  const fadedObjects = useMemo(() => [], []);
  const originalMaterials = useMemo(() => new Map(), []);

  // Pre-allocate vectors to avoid garbage collection
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const frameCounter = useMemo(() => ({ count: 0 }), []);

  useEffect(() => {
    return () => {
      fadedObjects.forEach((obj) => {
        if (obj.material) {
          const original = originalMaterials.get(obj.uuid);
          if (original) {
            obj.material.transparent = original.transparent;
            obj.material.opacity = original.opacity;
            obj.material.needsUpdate = true;
          } else {
            obj.material.transparent = false;
            obj.material.opacity = 1.0;
            obj.material.needsUpdate = true;
          }
        }
      });
      originalMaterials.clear();
    };
  }, [fadedObjects, originalMaterials]);

  useFrame(() => {
    // Throttle: only run every 3rd frame (20 FPS is enough for obstruction detection)
    frameCounter.count++;
    if (frameCounter.count % 3 !== 0) return;

    // Determine target position (reuse pre-allocated vector)
    if (target?.current) {
      target.current.getWorldPosition(targetPosition);
    } else if (target instanceof THREE.Vector3) {
      targetPosition.copy(target);
    } else {
      return;
    }

    // Get camera's actual world position (important for parented cameras)
    camera.getWorldPosition(cameraPosition);

    // Calculate direction from target to camera
    direction.subVectors(cameraPosition, targetPosition);
    const distanceToCamera = direction.length();

    // Skip if camera is too close to target (avoid edge cases)
    if (distanceToCamera < 0.1) return;

    // Normalize direction after getting length
    direction.normalize();

    // Set raycaster with explicit ray length limit
    raycaster.set(targetPosition, direction);
    raycaster.far = distanceToCamera + 0.1; // Only check up to camera position

    // Required for LineSegments2 (used by Drei's Line/Edges) to work correctly
    raycaster.camera = camera;

    const intersects = raycaster.intersectObjects(scene.children, true);
    const currentFaded = [];

    // Minimum distance threshold scales with total distance to handle steep angles
    // At steep angles with large distances, objects further from target should still fade
    const minDistance = Math.min(0.3, distanceToCamera * 0.05);

    if (intersects.length > 0) {
      const processedGroups = new Set(); // Track which groups we've already processed
      const targetObject = target?.current; // Get the actual target object reference

      intersects.forEach((intersect) => {
        // Fade objects between target and camera
        // Use scaled minimum distance to handle steep angles better
        if (
          intersect.distance > minDistance &&
          intersect.distance < distanceToCamera - 0.1
        ) {
          const obj = intersect.object;

          // Skip if this object is the target itself or a child of the target
          if (targetObject) {
            let checkParent = obj;
            let isTargetOrChild = false;
            while (checkParent) {
              if (checkParent === targetObject) {
                isTargetOrChild = true;
                break;
              }
              checkParent = checkParent.parent;
            }
            if (isTargetOrChild) return; // Skip fading the target itself
          }

          // Find the parent RigidBody or designated group
          let parent = obj.parent;
          let groupParent = null;

          // Traverse up to find a RigidBody or group with userData indicating it should be treated as a unit
          while (parent && parent !== scene) {
            if (parent.userData?.isRigidBody || parent.type === "Group") {
              groupParent = parent;
              break;
            }
            parent = parent.parent;
          }

          // If we found a group parent and haven't processed it yet
          if (groupParent && !processedGroups.has(groupParent.uuid)) {
            processedGroups.add(groupParent.uuid);

            // Find all mesh children in this group (including InstancedMesh)
            const meshChildren = [];
            groupParent.traverse((child) => {
              if ((child.isMesh || child.isInstancedMesh) && child.material) {
                meshChildren.push(child);
              }
            });

            // Fade all mesh children together
            meshChildren.forEach((meshChild) => {
              if (!currentFaded.includes(meshChild)) {
                currentFaded.push(meshChild);

                // Store original state if not already stored
                if (!originalMaterials.has(meshChild.uuid)) {
                  originalMaterials.set(meshChild.uuid, {
                    transparent: meshChild.material.transparent,
                    opacity: meshChild.material.opacity,
                  });
                }

                meshChild.material.transparent = true;
                // If object is tagged to stay invisible or was originally opacity 0, keep it at 0
                const targetOpacity =
                  meshChild.userData?.keepInvisible ||
                  originalMaterials.get(meshChild.uuid).opacity === 0
                    ? 0
                    : 0.3;
                meshChild.material.opacity = targetOpacity;
                meshChild.material.needsUpdate = true;
              }
            });
          } else if (!groupParent) {
            // Fallback: treat as individual object if no group parent found
            if (obj.material && !currentFaded.includes(obj)) {
              currentFaded.push(obj);

              // Store original state if not already stored
              if (!originalMaterials.has(obj.uuid)) {
                originalMaterials.set(obj.uuid, {
                  transparent: obj.material.transparent,
                  opacity: obj.material.opacity,
                });
              }

              obj.material.transparent = true;
              obj.material.opacity = 0.3;
              obj.material.needsUpdate = true;
            }
          }
        }
      });
    }

    // Restore opacity for objects no longer obstructing
    fadedObjects.forEach((obj) => {
      if (!currentFaded.includes(obj) && obj.material) {
        const original = originalMaterials.get(obj.uuid);
        if (original) {
          obj.material.transparent = original.transparent;
          obj.material.opacity = original.opacity;
          obj.material.needsUpdate = true;
        } else {
          // Fallback if original state wasn't captured (shouldn't happen)
          obj.material.transparent = false;
          obj.material.opacity = 1.0;
          obj.material.needsUpdate = true;
        }
      }
    });

    // Update fadedObjects array in place
    fadedObjects.length = 0;
    fadedObjects.push(...currentFaded);
  });

  return null;
}
