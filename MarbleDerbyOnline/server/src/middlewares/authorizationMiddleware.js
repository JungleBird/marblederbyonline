const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate JWT tokens from HTTP-only cookies.
 * Extracts the token from cookies, verifies it, and attaches the decoded
 * user information to the request object.
 *
 * Usage: router.get("/protected-route", authenticateToken, routeHandler);
 */
function authenticateToken(req, res, next) {
  // 1. Extract token from HTTP-only cookie
  const token = req.cookies.authToken;

  // 2. Check if a token is present
  if (!token) {
    return res.status(401).json({ error: "No authentication token found." });
  }

  // 3. Verify the token with the secret key
  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    // Attach the decoded user payload to the request object
    req.user = user;
    next(); // Pass the request to the next middleware/route handler
  });
}

module.exports = authenticateToken;
