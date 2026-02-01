// Database configuration
exports.DB_NAME = "marbleDB";
exports.COLLECTIONS = {
  USERS: "users",
  VERIFICATION_CODES: "verificationCodes",
};

// Authentication constants
exports.CODE_EXPIRY_MINUTES = 5;
exports.JWT_EXPIRY = "24h";
exports.COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting
exports.RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
exports.VERIFICATION_CODE_LIMIT = 5; // Max verification code requests per window
exports.LOGIN_ATTEMPT_LIMIT = 10; // Max login attempts per window

// Email validation regex (RFC 5322 simplified)
exports.EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// JWT Secret validation
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production");
}

exports.JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-for-development";
