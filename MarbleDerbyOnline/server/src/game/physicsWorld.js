const RAPIER = require('@dimforge/rapier3d-compat');

/**
 * Server-side physics world using Rapier
 * Manages all rigid bodies and physics simulation
 */
class PhysicsWorld {
  constructor() {
    this.world = null;
    this.bodies = new Map(); // key -> RigidBody
    this.entityToBody = new Map(); // entityKey -> bodyHandle
  }

  /**
   * Initialize the physics world
   * @returns {Promise<void>}
   */
  async init() {
    // Initialize Rapier (compat version handles WASM initialization)
    await RAPIER.init();
    
    // Create world with gravity
    const gravity = { x: 0, y: -9.81, z: 0 };
    this.world = new RAPIER.World(gravity);
    
    // Configure fixed timestep for deterministic physics (50 FPS physics)
    this.world.integrationParameters.dt = 1/50;
  }

  /**
   * Create a rigid body for an entity
   * @param {string} entityKey - Unique entity identifier
   * @param {Object} position - Initial position { x, y, z }
   * @param {number} radius - Sphere radius
   * @param {Object} options - Additional options
   * @returns {Object} - Body info with handle and initial state
   */
  createSphereBody(entityKey, position, radius, options = {}) {
    const {
      mass = 1.0,
      linearDamping = 0.1,
      angularDamping = 0.1,
      restitution = 0.1,
      friction = 0.7,
      isKinematic = false,  // For client-controlled entities
    } = options;

    // Create rigid body descriptor
    // Use kinematic for client-controlled entities (position synced from client)
    // Use dynamic for server-controlled entities (NPCs)
    const bodyDesc = isKinematic
      ? RAPIER.RigidBodyDesc.kinematicPositionBased()
          .setTranslation(position.x, position.y, position.z)
      : RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(position.x, position.y, position.z)
          .setLinearDamping(linearDamping)
          .setAngularDamping(angularDamping);

    const body = this.world.createRigidBody(bodyDesc);

    // Create sphere collider with friction combine rule set to Max
    // This ensures rolling behavior when in contact with high-friction surfaces
    const colliderDesc = RAPIER.ColliderDesc.ball(radius)
      .setRestitution(restitution)
      .setFriction(friction)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max)  // Use max friction for rolling
      .setDensity(mass / (4 / 3 * Math.PI * radius ** 3)); // Approximate density from mass

    this.world.createCollider(colliderDesc, body);

    // Store mapping (track if kinematic for sync method)
    this.entityToBody.set(entityKey, body.handle);
    this.bodies.set(body.handle, { entityKey, body, radius, isKinematic });

    return {
      handle: body.handle,
      position: body.translation(),
      rotation: body.rotation(),
      linvel: body.linvel(),
      angvel: body.angvel(),
    };
  }

  /**
   * Create a static floor collider
   * @param {Object} options - { width, length, depth, restitution, friction, position }
   */
  createFloor(options = {}) {
    const {
      width = 100,
      length = 100,
      depth = 2,
      restitution = 0.2,
      friction = 0.8,
      position = { x: 0, y: -depth / 2, z: 0 },
    } = options;

    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y !== undefined ? position.y : -depth / 2,
      position.z
    );
    const body = this.world.createRigidBody(bodyDesc);

    // High friction + Max combine rule ensures spheres roll instead of slide
    const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, depth / 2, length / 2)
      .setRestitution(restitution)
      .setFriction(friction)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max);

    this.world.createCollider(colliderDesc, body);
  }

  /**
   * Create a static wall collider
   * @param {Object} position - Wall center position { x, y, z }
   * @param {Object} options - { width, height, depth, restitution, friction }
   */
  createWall(position, options = {}) {
    const {
      width = 1,
      height = 6,
      depth = 0.5,
      restitution = 0.1,
      friction = 0.8,
    } = options;

    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z);
    const body = this.world.createRigidBody(bodyDesc);

    // High friction for walls to prevent sliding
    const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
      .setRestitution(restitution)
      .setFriction(friction)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max);

    this.world.createCollider(colliderDesc, body);
  }

  /**
   * Get body for an entity
   * @param {string} entityKey - Entity identifier
   * @returns {RAPIER.RigidBody|null}
   */
  getBody(entityKey) {
    const handle = this.entityToBody.get(entityKey);
    if (handle === undefined) return null;
    return this.world.getRigidBody(handle);
  }

  /**
   * Apply impulse to a body
   * @param {string} entityKey - Entity identifier
   * @param {Object} impulse - Impulse vector { x, y, z }
   * @param {boolean} wake - Wake up body (default: true)
   */
  applyImpulse(entityKey, impulse, wake = true) {
    const body = this.getBody(entityKey);
    if (!body) return;
    body.applyImpulse(impulse, wake);
  }

  /**
   * Apply torque impulse to a body
   * @param {string} entityKey - Entity identifier
   * @param {Object} torque - Torque vector { x, y, z }
   * @param {boolean} wake - Wake up body (default: true)
   */
  applyTorqueImpulse(entityKey, torque, wake = true) {
    const body = this.getBody(entityKey);
    if (!body) return;
    body.applyTorqueImpulse(torque, wake);
  }

  /**
   * Set body position directly
   * @param {string} entityKey - Entity identifier
   * @param {Object} position - New position { x, y, z }
   */
  setPosition(entityKey, position) {
    const body = this.getBody(entityKey);
    if (!body) return;
    body.setTranslation(position, true); // true = wake up
  }

  /**
   * Set body velocity
   * @param {string} entityKey - Entity identifier
   * @param {Object} velocity - New velocity { x, y, z }
   */
  setLinvel(entityKey, velocity) {
    const body = this.getBody(entityKey);
    if (!body) return;
    body.setLinvel(velocity, true);
  }

  /**
   * Set body angular velocity
   * @param {string} entityKey - Entity identifier
   * @param {Object} angularVelocity - New angular velocity { x, y, z }
   */
  setAngvel(entityKey, angularVelocity) {
    const body = this.getBody(entityKey);
    if (!body) return;
    body.setAngvel(angularVelocity, true);
  }

  /**
   * Sync body state from external source (e.g., client-authoritative updates)
   * For kinematic bodies: Uses setNextKinematicTranslation/Rotation so Rapier
   * computes proper velocity from position delta and generates correct collision impulses
   * For dynamic bodies: Directly sets position/velocity (less common use case)
   * @param {string} entityKey - Entity identifier
   * @param {Object} state - { position, rotation, linvel, angvel }
   */
  syncBodyState(entityKey, state) {
    const body = this.getBody(entityKey);
    if (!body) return;
    
    const handle = this.entityToBody.get(entityKey);
    const bodyInfo = this.bodies.get(handle);
    const isKinematic = bodyInfo?.isKinematic || false;
    
    if (isKinematic) {
      // For kinematic bodies, use setNextKinematic* methods
      // This tells Rapier where the body WILL BE next frame
      // Rapier computes velocity from position delta and generates proper collision impulses
      if (state.position) {
        body.setNextKinematicTranslation(state.position);
      }
      if (state.rotation) {
        body.setNextKinematicRotation(state.rotation);
      }
      // Note: Kinematic bodies don't use linvel/angvel - Rapier computes them from position delta
    } else {
      // For dynamic bodies, set state directly (teleport)
      if (state.position) {
        body.setTranslation(state.position, true);
      }
      if (state.rotation) {
        body.setRotation(state.rotation, true);
      }
      if (state.linvel) {
        body.setLinvel(state.linvel, true);
      }
      if (state.angvel) {
        body.setAngvel(state.angvel, true);
      }
    }
  }

  /**
   * Get current state of a body
   * @param {string} entityKey - Entity identifier
   * @returns {Object|null} - { position, rotation, linvel, angvel }
   */
  getBodyState(entityKey) {
    const body = this.getBody(entityKey);
    if (!body) return null;

    return {
      position: body.translation(),
      rotation: body.rotation(),
      linvel: body.linvel(),
      angvel: body.angvel(),
    };
  }

  /**
   * Simulate physics for one step
   * Rapier uses the fixed timestep configured in integrationParameters.dt
   * @param {number} deltaTime - Time step in seconds (unused - kept for API consistency)
   */
  step(deltaTime) {
    // Note: Rapier's step() doesn't take arguments - it uses the configured timestep
    // For variable timestep, use an accumulator pattern or adjust integrationParameters.dt
    this.world.step();
  }

  /**
   * Remove a body from the world
   * @param {string} entityKey - Entity identifier
   */
  removeBody(entityKey) {
    const handle = this.entityToBody.get(entityKey);
    if (handle === undefined) return;

    const bodyInfo = this.bodies.get(handle);
    if (bodyInfo) {
      this.world.removeRigidBody(bodyInfo.body);
      this.bodies.delete(handle);
    }

    this.entityToBody.delete(entityKey);
  }

  /**
   * Create a static track segment collider
   * @param {string} segmentId - Unique segment identifier
   * @param {Object} position - Center position { x, y, z }
   * @param {string} type - Segment type: "straight", "cross", or "drop"
   * @param {Object} dimensions - { width, height, length }
   * @param {Array} rotation - [x, y, z] rotation in radians (optional)
   */
  createTrackSegment(segmentId, position, type, dimensions = {}, rotation = [0, 0, 0]) {
    const { width = 3, height = 0.3, length = 5 } = dimensions;
    
    // Create fixed rigid body for track
    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(position.x, position.y, position.z);
    
    const body = this.world.createRigidBody(bodyDesc);

    // Convert rotation to quaternion if Y rotation is present (for 90 degree turns)
    let quat = null;
    if (rotation[1] !== 0) {
      // For Y-axis rotation (yaw), create quaternion
      const halfAngle = rotation[1] / 2;
      quat = {
        x: 0,
        y: Math.sin(halfAngle),
        z: 0,
        w: Math.cos(halfAngle),
      };
    }

    if (type === "straight") {
      // Single straight track strip
      const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, length / 2)
        .setRestitution(0.3)
        .setFriction(0.6);
      
      if (quat) {
        colliderDesc.setRotation(quat);
      }
      
      this.world.createCollider(colliderDesc, body);
    } else if (type === "cross") {
      // Two perpendicular cuboids for cross-shaped track
      const colliderDesc1 = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, length / 2)
        .setRestitution(0.3)
        .setFriction(0.6);
      
      if (quat) {
        colliderDesc1.setRotation(quat);
      }
      
      this.world.createCollider(colliderDesc1, body);
      
      const colliderDesc2 = RAPIER.ColliderDesc.cuboid(length / 2, height / 2, width / 2)
        .setRestitution(0.3)
        .setFriction(0.6);
      
      if (quat) {
        colliderDesc2.setRotation(quat);
      }
      
      this.world.createCollider(colliderDesc2, body);
    } else if (type === "drop") {
      // Drop segment with hole in middle - 4 strips forming a cross with gap
      const holeSize = Math.min(width, length) * 0.4;
      const stripLength = (length / 2) - (holeSize / 2);
      
      // North strip (negative Z offset)
      const northCollider = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, stripLength / 2)
        .setTranslation(0, 0, -(length / 4 + holeSize / 2))
        .setRestitution(0.3)
        .setFriction(0.6);
      
      if (quat) {
        northCollider.setRotation(quat);
      }
      
      this.world.createCollider(northCollider, body);
      
      // South strip (positive Z offset)
      const southCollider = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, stripLength / 2)
        .setTranslation(0, 0, length / 4 + holeSize / 2)
        .setRestitution(0.3)
        .setFriction(0.6);
      
      if (quat) {
        southCollider.setRotation(quat);
      }
      
      this.world.createCollider(southCollider, body);
      
      // West strip (negative X offset)
      const westCollider = RAPIER.ColliderDesc.cuboid(stripLength / 2, height / 2, width / 2)
        .setTranslation(-(length / 4 + holeSize / 2), 0, 0)
        .setRestitution(0.3)
        .setFriction(0.6);
      
      if (quat) {
        westCollider.setRotation(quat);
      }
      
      this.world.createCollider(westCollider, body);
      
      // East strip (positive X offset)
      const eastCollider = RAPIER.ColliderDesc.cuboid(stripLength / 2, height / 2, width / 2)
        .setTranslation(length / 4 + holeSize / 2, 0, 0)
        .setRestitution(0.3)
        .setFriction(0.6);
      
      if (quat) {
        eastCollider.setRotation(quat);
      }
      
      this.world.createCollider(eastCollider, body);
    }
  }

  /**
   * Get all bodies currently in world
   * @returns {Array} - Array of { entityKey, body, radius }
   */
  getAllBodies() {
    return Array.from(this.bodies.values());
  }
}

module.exports = PhysicsWorld;
