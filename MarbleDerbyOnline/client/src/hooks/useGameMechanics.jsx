import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

/**
 * Calculates the Magnus force vector based on velocity and angular velocity.
 * F = S(w x v) where S is a coefficient, w is angular velocity, and v is velocity.
 * The direction is perpendicular to both the spin axis and the direction of motion.
 */
export function calculateMagnusForce(
  velocity,
  angularVelocity,
  magnusCoefficient = 0.1,
  magnusForceScale = 1.0
) {
  const v = new Vector3(velocity.x, velocity.y, velocity.z);
  const w = new Vector3(
    angularVelocity.x,
    angularVelocity.y,
    angularVelocity.z
  );

  // Cross product: w x v
  const force = new Vector3().crossVectors(w, v);

  // Scale by coefficient
  force.multiplyScalar(magnusCoefficient);

  // Apply vertical scaling
  force.x *= magnusForceScale;
  force.y *= 0;
  force.z *= magnusForceScale;

  return force;
};

/**
 * Hook to apply Magnus effect to a Rapier RigidBody.
 * @param {React.MutableRefObject} rigidBodyRef - Ref to the RigidBody api.
 * @param {number} magnusCoefficient - Coefficient for the strength of the effect.
 * @param {number} magnusForceScale - Scale factor for the vertical component of the force (0-1).
 */
export function useMagnusEffect({
  rigidBodyRef,
  magnusCoefficient = 0.5,
  magnusForceScale = 1.0,
}) {
  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const velocity = rigidBodyRef.current.linvel();
    const angularVelocity = rigidBodyRef.current.angvel();

    if (!velocity || !angularVelocity) return;

    const force = calculateMagnusForce(
      velocity,
      angularVelocity,
      magnusCoefficient,
      magnusForceScale
    );

    // Apply the force to the center of mass
    // We use impulse or force? The prompt asks for "force impulse", but continuous force
    // is usually better for aerodynamic effects in a frame loop.
    // Rapier's addForce adds a continuous force for this step.
    rigidBodyRef.current.addForce(force, true);
  });
}

/**
 * Hook to handle collision-based upward impulse for physics objects.
 * Converts horizontal collision energy into vertical upward momentum.
 * Also applies a small horizontal separation impulse to prevent objects from getting "stuck".
 * @param {React.MutableRefObject} rigidBodyRef - Ref to the RigidBody.
 * @param {number} upwardBoost - Multiplier for converting horizontal speed to upward impulse (default: 0.3).
 * @param {number} separationBoost - Multiplier for horizontal separation impulse (default: 0.15).
 * @returns {Function} Collision handler function to pass to onCollisionEnter.
 */
export function useCollisionUpwardBoost({
  rigidBodyRef, 
  upwardBoost = 0.3, 
  separationBoost = 0.15,
  forceMultiplier = 1
}) {
  return (event) => {
    if (!rigidBodyRef.current) return;

    // Get the other body involved in collision
    const otherBody = event.other.rigidBody;
    
    // CRITICAL FIX: Only trigger if hitting a DYNAMIC body (bodyType 0, usually a player)
    // If we hit Static (1) or Kinematic (2) (like the floor), do NOT apply the boost.
    if (!otherBody || typeof otherBody.bodyType !== "function" || otherBody.bodyType() !== 0) {
      return;
    }

    // Dampen the other body's upward velocity by half
    const currentOtherVel = otherBody.linvel();
    if (currentOtherVel.y > 0) {
      otherBody.setLinvel({
        x: currentOtherVel.x,
        y: currentOtherVel.y * 0.5,
        z: currentOtherVel.z
      }, true);
    }

    // Get positions to calculate separation direction
    const myPos = rigidBodyRef.current.translation();
    const otherPos = otherBody.translation();

    const dirX = myPos.x - otherPos.x;
    const dirZ = myPos.z - otherPos.z;
    const distanceXZ = Math.sqrt(dirX * dirX + dirZ * dirZ);

    // Get velocities of both bodies
    const otherVel = otherBody.linvel();
    const myVel = rigidBodyRef.current.linvel();

    // Calculate horizontal relative velocity
    const relativeVelX = otherVel.x - myVel.x;
    const relativeVelZ = otherVel.z - myVel.z;
    const horizontalSpeed = Math.sqrt(
      relativeVelX * relativeVelX + relativeVelZ * relativeVelZ
    );

    // Only apply impulse if there's significant horizontal impact and we can determine direction
    if (horizontalSpeed > 0.1 && distanceXZ > 0.01) {
      // Normalize separation direction
      const nx = dirX / distanceXZ;
      const nz = dirZ / distanceXZ;

      // Apply impulse: Upward AND Outward (separation)
      // Horizontal separation is boosted
      const impulse = { 
        x: nx * horizontalSpeed * separationBoost * forceMultiplier * 60, 
        y: horizontalSpeed * upwardBoost * forceMultiplier * 20, 
        z: nz * horizontalSpeed * separationBoost * forceMultiplier * 60 
      };
      
      rigidBodyRef.current.applyImpulse(impulse, true);
    }
  };
}
