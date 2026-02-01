/**
 * Environment configuration for per-environment NPC spawns and settings
 * Each environment can have its own NPCs with specific positions, radii, and physics properties
 */

const ENVIRONMENT_CONFIG = {
  MarbleFootBall: {
    id: "MarbleFootBall",
    description: "Football-style marble game",
    npcs: [
      {
        id: "npc1",
        position: { x: 0, y: 2, z: 0 },
        radius: 1.6,
        mass: 2.0,
        restitution: 0.8,
        friction: 0.3,
        linearDamping: 0.05,
        angularDamping: 0.05,
        sphereType: "soccerBall",
      },
    ],
    floor: {
      width: 300,
      length: 1200,
      depth: 2,
      restitution: 0.2,
      friction: 0.6,
    },
    walls: [
      // Front wall (positive Z)
      { position: { x: 0, y: 3, z: 600 }, width: 301, height: 6, depth: 0.2, restitution: 0.1, friction: 0.8 },
      // Back wall (negative Z)
      { position: { x: 0, y: 3, z: -600 }, width: 301, height: 6, depth: 0.2, restitution: 0.1, friction: 0.8 },
      // Left wall (negative X)
      { position: { x: -150, y: 3, z: 0 }, width: 0.2, height: 6, depth: 1200, restitution: 0.1, friction: 0.8 },
      // Right wall (positive X)
      { position: { x: 150, y: 3, z: 0 }, width: 0.2, height: 6, depth: 1200, restitution: 0.1, friction: 0.8 },
    ],
  },
  MarbleDropMaze: {
    id: "MarbleDropMaze",
    description: "Maze-style marble drop game with tracks",
    npcs: [
      {
        id: "npc1",
        position: { x: 5, y: 18, z: 10 },
        radius: 0.6,
        mass: 2.0,
        restitution: 0.8,
        friction: 0.3,
        linearDamping: 0.05,
        angularDamping: 0.05,
        sphereType: "soccerBall",
      },
    ],
    floor: {
      width: 100,
      length: 100,
      depth: 2,
      restitution: 0.2,
      friction: 0.6,
    },
    walls: [
      // North fence (positive Z)
      { position: { x: 0, y: 1, z: 50 }, width: 100, height: 2, depth: 0.5, restitution: 0.1, friction: 0.8 },
      // South fence (negative Z)
      { position: { x: 0, y: 1, z: -50 }, width: 100, height: 2, depth: 0.5, restitution: 0.1, friction: 0.8 },
      // East fence (positive X)
      { position: { x: 50, y: 1, z: 0 }, width: 0.5, height: 2, depth: 100, restitution: 0.1, friction: 0.8 },
      // West fence (negative X)
      { position: { x: -50, y: 1, z: 0 }, width: 0.5, height: 2, depth: 100, restitution: 0.1, friction: 0.8 },
    ],
    trackSegments: [
      // Layer 1 (y=5)
      { type: "drop", position: { x: 5, y: 5, z: -10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 5, y: 5, z: -5 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 5, y: 5, z: 0 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 5, y: 5, z: 5 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "cross", position: { x: 5, y: 5, z: 10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 0, y: 5, z: 10 }, rotation: [0, Math.PI / 2, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -5, y: 5, z: 10 }, rotation: [0, Math.PI / 2, 0], width: 3, height: 0.3, length: 5 },
      { type: "cross", position: { x: -10, y: 5, z: 10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      // Layer 2 (y=10)
      { type: "cross", position: { x: 5, y: 10, z: -10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 0, y: 10, z: -10 }, rotation: [0, Math.PI / 2, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -5, y: 10, z: -10 }, rotation: [0, Math.PI / 2, 0], width: 3, height: 0.3, length: 5 },
      { type: "cross", position: { x: -10, y: 10, z: -10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -10, y: 10, z: -5 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -10, y: 10, z: 0 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -10, y: 10, z: 5 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "drop", position: { x: -10, y: 10, z: 10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      // Layer 3 (y=15)
      { type: "drop", position: { x: 5, y: 15, z: -10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 5, y: 15, z: -5 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 5, y: 15, z: 0 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 5, y: 15, z: 5 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "cross", position: { x: 5, y: 15, z: 10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 0, y: 15, z: 10 }, rotation: [0, Math.PI / 2, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -5, y: 15, z: 10 }, rotation: [0, Math.PI / 2, 0], width: 3, height: 0.3, length: 5 },
      { type: "cross", position: { x: -10, y: 15, z: 10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      // Layer 4 (y=20)
      { type: "cross", position: { x: 5, y: 20, z: -10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: 0, y: 20, z: -10 }, rotation: [0, Math.PI / 2, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -5, y: 20, z: -10 }, rotation: [0, Math.PI / 2, 0], width: 3, height: 0.3, length: 5 },
      { type: "cross", position: { x: -10, y: 20, z: -10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -10, y: 20, z: -5 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -10, y: 20, z: 0 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "straight", position: { x: -10, y: 20, z: 5 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
      { type: "drop", position: { x: -10, y: 20, z: 10 }, rotation: [0, 0, 0], width: 3, height: 0.3, length: 5 },
    ],
  },
  // Default/fallback environment for testing
  default: {
    id: "default",
    description: "Default test environment",
    npcs: [
      {
        id: "npc1",
        position: { x: 0, y: 2, z: 0 },
        radius: 0.6,
        mass: 2.0,
        restitution: 0.8,
        friction: 0.3,
        linearDamping: 0.1,
        angularDamping: 0.1,
        sphereType: "soccerBall",
      },
    ],
    floor: {
      width: 100,
      length: 100,
      depth: 2,
      restitution: 0.2,
      friction: 0.6,
    },
  },
};

/**
 * Get environment configuration by ID
 * @param {string} environmentId - The environment identifier
 * @returns {Object} Environment configuration
 */
function getEnvironmentConfig(environmentId) {
  return ENVIRONMENT_CONFIG[environmentId] || ENVIRONMENT_CONFIG.default;
}

/**
 * Get all available environment IDs
 * @returns {string[]} Array of environment IDs
 */
function getAvailableEnvironments() {
  return Object.keys(ENVIRONMENT_CONFIG);
}

module.exports = {
  ENVIRONMENT_CONFIG,
  getEnvironmentConfig,
  getAvailableEnvironments,
};
