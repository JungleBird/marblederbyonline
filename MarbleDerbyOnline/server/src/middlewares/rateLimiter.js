const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for verification code requests.
 * Limits to 5 requests per 15 minutes per IP address.
 * This prevents abuse and protects email sending infrastructure.
 */
exports.verificationCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many verification code requests. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for successful requests (optional)
  skipSuccessfulRequests: false,
  // Store in memory (for production, consider Redis)
  // store: new RedisStore({ ... })
});

/**
 * Stricter rate limiter for login attempts.
 * Limits to 10 attempts per 15 minutes per IP address.
 */
exports.loginAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
