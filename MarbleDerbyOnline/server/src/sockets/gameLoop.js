/**
 * Game loop state
 */
let gameLoopInterval = null;
let previousTime = Date.now();
let serverTick = 0;

/**
 * Start the game loop
 * @param {Object} options
 * @param {SocketIO} options.io - Socket.io server instance
 * @param {Map} options.entities - Entities map
 * @param {PhysicsWorld} options.physicsWorld - Rapier physics world
 * @param {Function} options.processPhysicsUpdates - Physics update processor
 * @param {Function} options.processLatencyUpdates - Latency update processor
 * @param {Function} options.processClientInputs - Client input processor (optional)
 * @param {Function} options.processServerNpcUpdates - Server NPC physics processor (optional)
 * @param {Function} options.setPhysicsWorldRef - Function to set physics world reference for body sync
 * @param {number} options.tickRate - Updates per second (default: 50)
 */
function startGameLoop({
  io,
  entities,
  physicsWorld,
  processPhysicsUpdates,
  processLatencyUpdates,
  processClientInputs,
  processServerNpcUpdates,
  setPhysicsWorldRef,
  tickRate = 50,
}) {
  if (gameLoopInterval) {
    console.warn('Game loop already running');
    return;
  }

  // Set physics world reference so processPhysicsUpdates can sync player bodies
  if (setPhysicsWorldRef && physicsWorld) {
    setPhysicsWorldRef(physicsWorld);
  }

  const GAME_LOOP_INTERVAL = 1000 / tickRate;
  previousTime = Date.now();
  serverTick = 0;

  gameLoopInterval = setInterval(() => {
    serverTick++;
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - previousTime) / 1000;
    previousTime = currentTime;

    // Process client inputs for server-authoritative physics (if enabled)
    if (processClientInputs) {
      processClientInputs(io, deltaTime, serverTick, physicsWorld);
    }

    // STEP 1: Process all pending physics updates FIRST
    // This syncs player bodies in the physics world with client-reported positions
    // so Rapier knows where all entities are before stepping
    processPhysicsUpdates(io, serverTick);

    // STEP 2: Step physics simulation
    // Now Rapier will naturally detect and resolve collisions between:
    // - Player bodies (synced from client)
    // - NPC bodies (server-controlled)
    // - Floor and other static geometry
    // This produces natural physics just like the client sees
    if (physicsWorld) {
      physicsWorld.step(deltaTime);
    }

    // STEP 3: Update NPCs driven by server-side physics
    // After stepping, NPCs have their new positions/velocities from Rapier
    // including any collision responses with player bodies
    if (processServerNpcUpdates) {
      processServerNpcUpdates(io, deltaTime, serverTick, physicsWorld);
    }

    // Process all pending latency updates
    processLatencyUpdates(io, serverTick);

    // Rapier handles collisions naturally now - no manual detection needed
    // The physics step above resolves player-NPC collisions with proper
    // impulses, friction, and angular momentum transfer

  }, GAME_LOOP_INTERVAL);

  console.log(`Game loop started at ${GAME_LOOP_INTERVAL} Hz`);
}

/**
 * Stop the game loop
 */
function stopGameLoop() {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    serverTick = 0;
    console.log('Game loop stopped');
  }
}

/**
 * Check if game loop is running
 */
function isGameLoopRunning() {
  return gameLoopInterval !== null;
}

/**
 * Get current server tick count
 */
function getServerTick() {
  return serverTick;
}

module.exports = {
  startGameLoop,
  stopGameLoop,
  isGameLoopRunning,
  getServerTick,
};
