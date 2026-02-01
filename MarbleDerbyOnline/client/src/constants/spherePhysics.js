/**
 * Physics constants for different sphere types
 * Used for friction calculations and collision responses
 */

export const SPHERE_PHYSICS = {
  // GlassMarbleBall - smooth, low friction, bouncy
  glassMarble: {
    name: "Glass Marble",
    linearFriction: 0.05,      // Low linear friction (slides easily)
    rollingFriction: 0.02,     // Low rolling friction (spins easily)
    restitution: 0.85,         // High bounce (elastic)
    mass: 2.0,
  },
  
  // Ball - medium friction, moderate bounce
  ball: {
    name: "Ball",
    linearFriction: 0.15,      // Medium linear friction
    rollingFriction: 0.08,     // Medium rolling friction
    restitution: 0.7,          // Moderate bounce
    mass: 2.5,
  },
  
  // MarbleBall - similar to glass but slightly less bouncy
  marbleBall: {
    name: "Marble Ball",
    linearFriction: 0.08,
    rollingFriction: 0.04,
    restitution: 0.8,
    mass: 2.0,
  },
  
  // DiscoBall - highly reflective, low friction
  discoBall: {
    name: "Disco Ball",
    linearFriction: 0.03,
    rollingFriction: 0.01,
    restitution: 0.9,
    mass: 1.5,
  },
};

/**
 * Get physics config for a sphere type
 * Defaults to glassMarble if type not found
 */
export function getSpherePhysicsConfig(sphereType = "glassMarble") {
  return SPHERE_PHYSICS[sphereType] || SPHERE_PHYSICS.glassMarble;
}

/**
 * Collision physics constants
 */
export const COLLISION_PHYSICS = {
  // Radius for sphere collision (should match BALL_CONFIG.radius)
  sphereRadius: 0.6,
  
  // Time delta for velocity calculations (100ms network updates)
  networkUpdateInterval: 0.1, // seconds
};
