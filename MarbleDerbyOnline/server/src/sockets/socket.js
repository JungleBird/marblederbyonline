
const { createNpcObject, createPlayerEntity } = require('./socketEntities');
const { startGameLoop, stopGameLoop, getServerTick } = require('./gameLoop');
const { computeJumpImpulse } = require('../game/jumpPhysics');
const PhysicsWorld = require('../game/physicsWorld');
const { getEnvironmentConfig, getAvailableEnvironments } = require('../config/environmentConfig');

// Store connected entities with physics state
// Key format: "clientId:entityType" (e.g., "client_123:player", "client_123:npc")
// { entityKey: { id, socketId, clientId, entityType, position, rotation, velocity, angularVelocity, lastUpdateTime, sphereType } }
const entities = new Map();
const pendingUpdates = [];
const pendingLatencyUpdates = [];
const pendingInputs = []; // Queue for client inputs (for server-authoritative physics)

// Map socketId -> clientId for cleanup on disconnect
const socketToClient = new Map();

// Map socketId -> environmentId for room management
const socketToEnvironment = new Map();

// Track which environments have been initialized with NPCs
const initializedEnvironments = new Set();

// Map socketId -> latency (in ms) for all connected players
const playerLatencies = new Map();

// Server-controlled NPCs (authoritative server entities)
const SERVER_NPCS = new Map();

// -----------------------------------------------------------------------------
// Queue helpers
// -----------------------------------------------------------------------------

/**
 * Shared function to queue physics state updates for batch processing
 * NOTE: In client-authoritative mode, this mirrors client state.
 * Client-sent positions can be used for reconciliation/validation but aren't the source of truth.
 * @param {string} socketId - Socket ID of the entity
 * @param {string} clientId - Persistent client ID for entity identification
 * @param {string} entityType - Entity type (e.g., "player", "npc")
 * @param {Object} worldData - Position, rotation, and velocity data
 */
function handlePhysicsUpdate(socketId, clientId, entityType, worldData) {
  // Queue the update instead of applying immediately
  pendingUpdates.push({ socketId, clientId, entityType, worldData });
}

/**
 * Queue client input for server-authoritative physics processing
 * @param {string} socketId - Socket ID of the entity
 * @param {string} clientId - Persistent client ID for entity identification
 * @param {Object} inputData - Input state and metadata
 */
function handleClientInput(socketId, clientId, inputData) {
  pendingInputs.push({ 
    socketId, 
    clientId, 
    inputData,
    receivedAt: Date.now() 
  });
}

// -----------------------------------------------------------------------------
// Processing pipelines
// -----------------------------------------------------------------------------

// Reference to physics world for syncing player bodies
let physicsWorldRef = null;

/**
 * Set the physics world reference for body synchronization
 * @param {PhysicsWorld} physicsWorld - The physics world instance
 */
function setPhysicsWorldRef(physicsWorld) {
  physicsWorldRef = physicsWorld;
}

/**
 * Process all queued physics updates atomically
 * Syncs player bodies with the physics world so Rapier can detect collisions naturally
 * @param {SocketIO} io - Socket.io instance
 * @param {number} serverTick - Current server tick number
 */
function processPhysicsUpdates(io, serverTick) {
  // Apply all pending updates atomically
  pendingUpdates.forEach((update) => {
    // Use clientId for entity key (persistent across reconnects)
    const entityKey = `${update.clientId}:${update.entityType}`;

    // CRITICAL FIX: Verify that the socket that sent this update is still considered "connected"
    // If the socket has disconnected, 'socketToClient' will have been cleared.
    // We must ignore this update to prevent "resurrecting" a zombie entity.
    const isSocketActive = socketToClient.has(update.socketId);

    // Allow update if:
    // 1. Socket is arguably active (in socketToClient)
    // 2. OR if it's a new connection that hasn't fully registered yet (edge case, but safer to allow if entity doesn't exist)
    // But primarily, if entity DOES exist, we carefully check if we should update it.

    // Simplified logic: If we have an existing entity, ONLY update it if the socket matches or we can verify ownership.
    // If we DON'T have an entity, we should probably only create it if the socket is valid.

    if (!isSocketActive) {
      // Socket is gone. Drop this update.
      return;
    }

    const entity = entities.get(entityKey);

    // Skip update if entity doesn't exist - entity creation should happen at registration/connection
    if (!entity) {
      console.warn(`Received physics update for non-existent entity: ${entityKey}`);
      return;
    }

    // Update socketId if client reconnected with new socket
    entity.socketId = update.socketId;

    // Update current state from worldData
    entity.position = update.worldData.position;
    entity.rotation = update.worldData.rotation;
    entity.velocity = update.worldData.linearVelocity || { x: 0, y: 0, z: 0 };
    entity.angularVelocity = update.worldData.angularVelocity || { x: 0, y: 0, z: 0 };
    entity.lastUpdateTime = Date.now();

    // CRITICAL: Sync player body in physics world so Rapier can detect collisions with NPCs
    // This is what makes the server physics match client physics
    if (physicsWorldRef && update.entityType === 'player') {
      physicsWorldRef.syncBodyState(entityKey, {
        position: update.worldData.position,
        rotation: update.worldData.rotation,
        linvel: update.worldData.linearVelocity || { x: 0, y: 0, z: 0 },
        angvel: update.worldData.angularVelocity || { x: 0, y: 0, z: 0 },
      });
    }

    // Broadcast entity movement with clientId for filtering (to environment room only)
    const environmentId = entity.environmentId || 'default';
    // Broadcast to everyone in the environment except the originating socket
    io.to(environmentId).except(update.socketId).emit("entityMoved", {
      id: entityKey,
      socketId: update.socketId,
      clientId: update.clientId,
      entityType: update.entityType,
      position: update.worldData.position,
      rotation: update.worldData.rotation,
      linearVelocity: update.worldData.linearVelocity,
      angularVelocity: update.worldData.angularVelocity,
      radius: entity.radius,
      serverTick: serverTick,
    });
  });

  // Clear the queue
  pendingUpdates.length = 0;
}

/**
 * Process all queued latency updates
 * @param {SocketIO} io - Socket.io instance
 * @param {number} serverTick - Current server tick number
 */
function processLatencyUpdates(io, serverTick) {
  if (pendingLatencyUpdates.length === 0) return;

  pendingLatencyUpdates.forEach(({ socketId, latency }) => {
    playerLatencies.set(socketId, latency);
  });

  const latenciesObject = Object.fromEntries(playerLatencies);
  io.emit("playerLatencies", latenciesObject);

  pendingLatencyUpdates.length = 0;
}

/**
 * Process client inputs and run server-authoritative physics simulation
 * @param {SocketIO} io - Socket.io instance
 * @param {number} deltaTime - Time delta in seconds
 * @param {number} serverTick - Current server tick number
 */
function processClientInputs(io, deltaTime, serverTick, physicsWorld) {
  if (pendingInputs.length === 0) return;

  pendingInputs.forEach((inputEvent) => {
    const entityKey = `${inputEvent.clientId}:player`;
    const entity = entities.get(entityKey);

    if (!entity || !socketToClient.has(inputEvent.socketId)) {
      return; // Skip if entity doesn't exist or socket disconnected
    }

    const { inputs, sequenceNumber, clientPosition } = inputEvent.inputData;
    const { forceVector, torqueVector, jump, reset, isGrounded, jumpIntent } = inputs;

    // Initialize jump state if not present
    if (!entity.jumpState) {
      entity.jumpState = {
        isJumping: false,
        jumpStartTime: 0,
        targetVelocity: 0,
        maxHoldTime: 0.25,
      };
    }

    const jumpState = entity.jumpState;
    const currentTime = Date.now();

    // Server-authoritative physics simulation using client-computed force vectors
    // The client sends world-space forces already calculated relative to camera orientation
    // This allows the server to apply forces without knowing camera state
    
    // Handle jump intent (server-computed for smoothness)
    if (jumpIntent && jumpIntent.jumpHeld && isGrounded) {
      // Start new jump if not already jumping
      if (!jumpState.isJumping) {
        jumpState.isJumping = true;
        jumpState.jumpStartTime = currentTime;
        jumpState.targetVelocity = jumpIntent.targetVelocity || 0;
        jumpState.maxHoldTime = jumpIntent.maxHoldTime || 0.25;
      }
    } else if (jumpIntent && !jumpIntent.jumpHeld) {
      // Client released jump key
      jumpState.isJumping = false;
    }

    // Compute and apply jump impulse if jumping
    if (jumpState.isJumping) {
      const elapsedSeconds = (currentTime - jumpState.jumpStartTime) / 1000;
      const jumpImpulse = computeJumpImpulse(
        deltaTime,
        elapsedSeconds,
        jumpState.targetVelocity,
        jumpState.maxHoldTime
      );

      if (jumpImpulse > 0) {
        // Apply jump impulse to physics body
        if (physicsWorld) {
          physicsWorld.applyImpulse(entityKey, { x: 0, y: jumpImpulse, z: 0 }, true);
        }
      } else {
        // Jump has naturally ended (exceeded maxHoldTime)
        jumpState.isJumping = false;
      }
    }
    
    // Apply force impulse for movement (if grounded on client)
    if (isGrounded && forceVector) {
      const force = {
        x: forceVector.x || 0,
        y: forceVector.y || 0,
        z: forceVector.z || 0,
      };
      
      // Apply force to physics body
      if (physicsWorld) {
        physicsWorld.applyImpulse(entityKey, force, true);
      }
      
      // Apply torque for rolling effect
      if (torqueVector) {
        const torque = {
          x: torqueVector.x || 0,
          y: torqueVector.y || 0,
          z: torqueVector.z || 0,
        };
        // Apply torque to physics body
        if (physicsWorld) {
          physicsWorld.applyTorqueImpulse(entityKey, torque, true);
        }
      }
    }
    
    // Handle reset
    if (reset) {
      // Reset entity position via physics world
      if (physicsWorld) {
        physicsWorld.setPosition(entityKey, { x: 0, y: 2, z: 0 });
        physicsWorld.setLinvel(entityKey, { x: 0, y: 0, z: 0 });
      }
      jumpState.isJumping = false;
    }
    
    // Update entity state from physics body
    if (physicsWorld) {
      const bodyState = physicsWorld.getBodyState(entityKey);
      if (bodyState) {
        entity.position = bodyState.position;
        entity.rotation = bodyState.rotation;
        entity.velocity = bodyState.linvel;
        entity.angularVelocity = bodyState.angvel;
      }
    }
    
    // Optional: Validate client position for anti-cheat
    // const positionError = distance(entity.position, clientPosition);
    // if (positionError > MAX_POSITION_ERROR_THRESHOLD) {
    //   console.warn(`Position desync for ${entityKey}: ${positionError}`);
    // }

    // Store input sequence for client reconciliation
    entity.lastProcessedInput = sequenceNumber;
    entity.lastUpdateTime = Date.now();

    // Send reconciliation state only to the owning socket (not broadcast)
    // This avoids sending player data to everyone and simplifies client filtering
    const owningSocket = io.sockets.sockets.get(inputEvent.socketId);
    if (owningSocket) {
      owningSocket.emit("playerReconciliation", {
        id: entityKey,
        clientId: inputEvent.clientId,
        position: entity.position,
        rotation: entity.rotation,
        velocity: entity.velocity,
        angularVelocity: entity.angularVelocity,
        radius: entity.radius,
        lastProcessedInput: sequenceNumber,
        serverTick: serverTick,
      });
    }
  });

  pendingInputs.length = 0;
}

/**
 * Update NPCs controlled by the server's physics world and broadcast state
 * @param {SocketIO} io - Socket.io instance
 * @param {number} deltaTime - Time delta in seconds
 * @param {number} serverTick - Current server tick number
 * @param {PhysicsWorld} physicsWorld - Rapier physics world
 */
function processServerNpcUpdates(io, deltaTime, serverTick, physicsWorld) {
  if (!physicsWorld || SERVER_NPCS.size === 0) return;

  SERVER_NPCS.forEach((npc, npcId) => {
    const bodyState = physicsWorld.getBodyState(npcId);
    if (!bodyState) return;

    npc.position = bodyState.position;
    npc.rotation = bodyState.rotation;
    npc.velocity = bodyState.linvel;
    npc.angularVelocity = bodyState.angvel;
    npc.lastUpdateTime = Date.now();

    const environmentId = npc.environmentId || "default";
    io.to(environmentId).emit("serverEntityState", {
      id: npcId,
      clientId: npc.clientId,
      position: npc.position,
      rotation: npc.rotation,
      velocity: npc.velocity,
      angularVelocity: npc.angularVelocity,
      radius: npc.radius,
      entityType: npc.entityType,
      serverTick: serverTick,
    });
  });
}

/**
 * Initialize NPCs for a specific environment based on config
 * @param {string} environmentId - The environment to initialize
 * @param {PhysicsWorld} physicsWorld - The physics world instance
 */
function initializeEnvironmentNpcs(environmentId, physicsWorld) {
  const envConfig = getEnvironmentConfig(environmentId);
  
  if (!envConfig.npcs || envConfig.npcs.length === 0) {
    console.log(`No NPCs configured for environment: ${environmentId}`);
    return;
  }

  console.log(`Initializing ${envConfig.npcs.length} NPC(s) for environment: ${environmentId}`);

  envConfig.npcs.forEach((npcConfig) => {
    const npcId = `${environmentId}:SERVER:npc:${npcConfig.id}`;
    
    // Create NPC entity with environment-specific config
    const npc = createNpcObject(npcConfig.id, npcConfig.position, npcConfig.radius);
    npc.environmentId = environmentId;
    npc.id = npcId;
    npc.mass = npcConfig.mass || 2.0;
    npc.restitution = npcConfig.restitution || 0.8;
    npc.sphereType = npcConfig.sphereType || "soccerBall";
    
    // Store in maps
    SERVER_NPCS.set(npcId, npc);
    entities.set(npcId, npc);

    // Create physics body for NPC
    if (physicsWorld) {
      const bodyState = physicsWorld.createSphereBody(npcId, npcConfig.position, npcConfig.radius, {
        mass: npcConfig.mass || 2.0,
        restitution: npcConfig.restitution || 0.3,  // Lower restitution for better ground contact
        friction: npcConfig.friction || 0.8,        // Higher friction for rolling instead of sliding
        linearDamping: npcConfig.linearDamping || 0.1,
        angularDamping: npcConfig.angularDamping || 0.05,  // Lower angular damping to allow rolling
      });
      npc.physicsBodyHandle = bodyState.handle;
    }

    console.log(`Created NPC: ${npcId} at position (${npcConfig.position.x}, ${npcConfig.position.y}, ${npcConfig.position.z}) with radius ${npcConfig.radius}`);
  });

  // Initialize floor for this environment
  if (envConfig.floor && physicsWorld) {
    const floorConfig = envConfig.floor;
    physicsWorld.createFloor({
      width: floorConfig.width || 100,
      length: floorConfig.length || 100,
      depth: floorConfig.depth || 2,
      restitution: floorConfig.restitution || 0.2,
      friction: floorConfig.friction || 0.8,
      position: floorConfig.position || { x: 0, y: -(floorConfig.depth || 2) / 2, z: 0 },
    });
    console.log(`Initialized floor for environment: ${environmentId}`);
  }

  // Initialize walls for this environment
  if (envConfig.walls && envConfig.walls.length > 0 && physicsWorld) {
    console.log(`Initializing ${envConfig.walls.length} wall(s) for environment: ${environmentId}`);
    
    envConfig.walls.forEach((wallConfig, index) => {
      physicsWorld.createWall(wallConfig.position, {
        width: wallConfig.width || 1,
        height: wallConfig.height || 6,
        depth: wallConfig.depth || 0.5,
        restitution: wallConfig.restitution || 0.1,
        friction: wallConfig.friction || 0.8,
      });
    });
    
    console.log(`Initialized all walls for environment: ${environmentId}`);
  }

  // Initialize track segments for this environment
  if (envConfig.trackSegments && envConfig.trackSegments.length > 0 && physicsWorld) {
    console.log(`Initializing ${envConfig.trackSegments.length} track segment(s) for environment: ${environmentId}`);
    
    envConfig.trackSegments.forEach((segment, index) => {
      const trackId = `${environmentId}:track:${index}`;
      physicsWorld.createTrackSegment(
        trackId,
        segment.position,
        segment.type,
        {
          width: segment.width || 3,
          height: segment.height || 0.3,
          length: segment.length || 5,
        },
        segment.rotation || [0, 0, 0]
      );
    });
    
    console.log(`Initialized all track segments for environment: ${environmentId}`);
  }
}

// -----------------------------------------------------------------------------
// Socket lifecycle
// -----------------------------------------------------------------------------

function attachSocketListeners(io, socket, physicsWorld) {
  console.log(`Player connected: ${socket.id}`);

  // Send player their own ID
  socket.emit("playerId", socket.id);

  // Send welcome message
  socket.emit("welcome", { message: "Welcome to the server!" });

  // Initial entities will be sent after registerClient with environment filtering

  // Send current latencies to the new player
  const latenciesObject = Object.fromEntries(playerLatencies);
  socket.emit("playerLatencies", latenciesObject);

  socket.on("message", (data) => {
    console.log(`Message from ${socket.id}: ${data}`);
  });

  // Handle client registration with persistent clientId
  socket.on("registerClient", (data) => {
    const { clientId, entityType = "player", environmentId = "default", radius = 0.6 } = data;
    if (clientId) {
      console.log(`Client registered: ${clientId} (socket: ${socket.id}) in environment: ${environmentId}`);
      socketToClient.set(socket.id, clientId);
      socketToEnvironment.set(socket.id, environmentId);

      // Join the environment room for scoped broadcasts
      socket.join(environmentId);
      console.log(`Socket ${socket.id} joined room: ${environmentId}`);

      const entityKey = `${clientId}:${entityType}`;
      const existingEntity = entities.get(entityKey);

      if (existingEntity) {
        // Update existing entity with new socketId and environment (reconnection)
        existingEntity.socketId = socket.id;
        existingEntity.environmentId = environmentId;
        // Update radius if client sent one
        if (radius) existingEntity.radius = radius;
        console.log(`Updated entity ${entityKey} with new socketId`);
      } else {
        // Create new entity for this client
        const newEntity = createPlayerEntity(clientId, socket.id, entityType, radius);
        newEntity.environmentId = environmentId;
        entities.set(entityKey, newEntity);
        
        // Create physics body for this entity
        // Players use kinematic bodies since their position is controlled by the client
        // This allows Rapier to properly compute collision impulses against dynamic NPCs
        if (physicsWorld) {
          const initialPos = newEntity.position || { x: 0, y: 2, z: 0 };
          const bodyState = physicsWorld.createSphereBody(entityKey, initialPos, radius || 0.6, {
            isKinematic: true,  // Client-controlled, position synced from client
            restitution: 0.7,
            friction: 0.5,
          });
          // Store body reference in entity
          newEntity.physicsBodyHandle = bodyState.handle;
        }
        
        console.log(`Created new entity: ${entityKey}`);
      }

      // Initialize environment NPCs if first player joining this environment
      if (!initializedEnvironments.has(environmentId)) {
        initializeEnvironmentNpcs(environmentId, physicsWorld);
        initializedEnvironments.add(environmentId);
      }

      // Send entities filtered to this environment
      const environmentEntities = {};
      entities.forEach((entity, key) => {
        if (entity.socketId !== socket.id && entity.environmentId === environmentId) {
          environmentEntities[key] = entity;
        }
      });
      socket.emit("otherEntities", environmentEntities);

      // Send current server tick to client for synchronization
      socket.emit("serverTickSync", {
        serverTick: getServerTick(),
        timestamp: Date.now(),
      });
    }
  });

  // Handle latency measurement (ping/pong)
  socket.on("ping", (timestamp) => {
    // Just echo back the timestamp - client will calculate latency
    socket.emit("pong", timestamp);
  });

  // Handle latency updates from clients
  socket.on("latencyUpdate", (latency) => {
    pendingLatencyUpdates.push({ socketId: socket.id, latency });
  });

  // Listen for combined client updates (inputs + state batched)
  socket.on("clientUpdate", (data) => {
    const { entityType, inputs, sequenceNumber, state } = data;
    const clientId = socketToClient.get(socket.id);
    
    if (!clientId) {
      console.warn(`Received update from unregistered client: ${socket.id}`);
      return;
    }

    // Extract state data for validation/logging and mirroring
    const { position, rotation, linearVelocity, angularVelocity } = state;
    const worldData = {
      position,
      rotation,
      linearVelocity,
      angularVelocity,
    };

    // Queue state update for mirroring (client-authoritative broadcast)
    if (entityType && position && rotation) {
      handlePhysicsUpdate(socket.id, clientId, entityType, worldData);
    }

    // Queue inputs for server-authoritative physics simulation
    handleClientInput(socket.id, clientId, {
      inputs,                   // { forward, backward, left, right, jump, etc. }
      sequenceNumber,           // Client's input sequence number for reconciliation
      clientPosition: position, // Client's predicted position (for validation/anti-cheat)
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Get the clientId and environmentId associated with this socket
    const clientId = socketToClient.get(socket.id);
    const environmentId = socketToEnvironment.get(socket.id);

    // Remove all entities associated with this clientId
    if (clientId) {
      for (const [key, entity] of entities.entries()) {
        if (entity.clientId === clientId) {
          entities.delete(key);
          console.log(`Removed entity: ${key}`);
        }
      }
      socketToClient.delete(socket.id);
    }

    // Clean up environment tracking
    socketToEnvironment.delete(socket.id);

    // Remove latency data for this player
    playerLatencies.delete(socket.id);

    // Broadcast updated latencies to remaining clients
    const latenciesObject = Object.fromEntries(playerLatencies);
    io.emit("playerLatencies", latenciesObject);

    // Notify other players in same environment (send clientId for proper cleanup)
    if (environmentId) {
      io.to(environmentId).emit("playerDisconnected", clientId || socket.id);
    } else {
      socket.broadcast.emit("playerDisconnected", clientId || socket.id);
    }
  });
}

function initializeSocket(io) {
  // Initialize physics world
  const physicsWorld = new PhysicsWorld();
  
  // Initialize Rapier WASM before starting game loop
  physicsWorld.init().then(() => {
    console.log('Physics world initialized');

    // Floor and walls are now initialized per-environment when first player joins
    // See initializeEnvironmentNpcs() called from registerClient handler

    // Start the game loop with physics world
    startGameLoop({
      io,
      entities,
      physicsWorld,
      processPhysicsUpdates,
      processLatencyUpdates,
      processClientInputs,
      processServerNpcUpdates,
      setPhysicsWorldRef,  // Pass function to set physics world reference for body sync
      tickRate: 50,
    });

    // Clean up game loop when server shuts down
    process.on("SIGTERM", () => {
      stopGameLoop();
    });

    io.on("connection", (socket) => attachSocketListeners(io, socket, physicsWorld));
  }).catch((error) => {
    console.error('Failed to initialize physics world:', error);
    process.exit(1);
  });
}

module.exports = initializeSocket;
