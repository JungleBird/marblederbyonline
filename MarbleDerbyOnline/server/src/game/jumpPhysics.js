/**
 * Shared jump physics computation
 * Pure function that computes jump impulse based on elapsed time
 */

/**
 * Calculate jump impulse for a given frame
 * @param {number} delta - Time delta in seconds for this frame
 * @param {number} elapsed - Total elapsed time since jump started (in seconds)
 * @param {number} targetVelocity - Maximum upward velocity to achieve
 * @param {number} maxHoldTime - Maximum time jump can be held (in seconds)
 * @returns {number} - Y-axis impulse to apply this frame (0 if jump should end)
 */
function computeJumpImpulse(delta, elapsed, targetVelocity, maxHoldTime) {
  // If elapsed time exceeds max hold time, jump has ended
  if (elapsed >= maxHoldTime) {
    return 0;
  }

  // Calculate progress through jump (0 to 1)
  const progress = elapsed / maxHoldTime;
  
  // Quadratic decay: (1 - progress)^2 gives stronger force at start, weaker at end
  const decayFactor = Math.pow(1 - progress, 2);
  
  // Combine target velocity distribution, quadratic decay (x3), and frame time
  const impulsePerSecond = (targetVelocity / maxHoldTime) * decayFactor * 3;
  const frameImpulse = impulsePerSecond * delta;
  
  return frameImpulse;
}

/**
 * Calculate target velocity needed to reach desired height
 * @param {number} howHigh - Desired jump height in units
 * @param {number} gravity - Gravity constant (default: 9.81)
 * @returns {number} - Required upward velocity
 */
function calculateTargetVelocity(howHigh, gravity = 9.81) {
  return Math.sqrt(2 * gravity * howHigh);
}

module.exports = {
  computeJumpImpulse,
  calculateTargetVelocity,
};
