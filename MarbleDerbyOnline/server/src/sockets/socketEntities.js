 
const NPC_RADIUS = 1.6;

 /*
 * Create a server-controlled NPC entity
 */
function createNpcObject(id, position, radius = NPC_RADIUS) {
  return {
    id: `SERVER:npc:${id}`,
    socketId: "SERVER",
    clientId: "SERVER",
    entityType: "npc",
    radius: radius,
    position: position || { x: 0, y: radius, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    lastUpdateTime: Date.now(),
    sphereType: "soccerBall",
    restitution: 0.8,
    mass: 2.0,
  };
}

/**
 * Create a player entity for a connected client
 * @param {string} clientId - Persistent client ID
 * @param {string} socketId - Current socket ID
 * @param {string} entityType - Entity type (default: "player")
 */
function createPlayerEntity(clientId, socketId, entityType = "player", radius = 0.6) {
  return {
    id: `${clientId}:${entityType}`,
    socketId: socketId,
    clientId: clientId,
    entityType: entityType,
    radius,
    position: null,
    rotation: null,
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    lastPosition: null,
    lastRotation: null,
    lastUpdateTime: Date.now(),
    sphereType: entityType === "player" ? "glassMarble" : "soccerBall",
    restitution: 0.85,
    linearFriction: 0.05,
    rollingFriction: 0.02,
  };
}

module.exports = {
    createNpcObject,
    createPlayerEntity,
}