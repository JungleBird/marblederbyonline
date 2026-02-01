const client = require("../database/mongoDBclient");
const jwt = require("jsonwebtoken");
const userController = require("./userController");
const { DB_NAME, COLLECTIONS, CODE_EXPIRY_MINUTES, JWT_SECRET, JWT_EXPIRY, COOKIE_MAX_AGE } = require("../config/constants");
const { isValidEmail, getSafeErrorMessage } = require("../utils/validators");

exports.sendEmailCode = async (email, code) => {
  // Placeholder function to simulate sending email
    console.log(`[AUTH] Verification code for ${email}: ${code}`);
}

/**
 * Generates a JWT token for the given user.
 *
 * @param {Object} user - User object with _id and email
 * @returns {string} Signed JWT token
 */
exports.generateAuthToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

/**
 * Sends the authentication response with JWT cookie and user data.
 * Handles setting the secure HTTP-only cookie and returning user info.
 *
 * @param {Object} res - Express response object
 * @param {string} token - JWT token to set as cookie
 * @param {Object} user - User object with _id, email, username
 * @param {boolean} isNewUser - Whether this is a newly created user
 */
exports.sendAuthResponse = (res, token, user, isNewUser) => {
  res
    .cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE,
    })
    .status(200)
    .json({
      message: isNewUser
        ? "Account created and logged in."
        : "Logged in successfully.",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
};

/**
 * Generates and stores a verification code for the given email.
 */
exports.requestCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Store in verificationCodes collection
    await client
      .db(DB_NAME)
      .collection(COLLECTIONS.VERIFICATION_CODES)
      .updateOne({ email }, { $set: { code, expiresAt } }, { upsert: true });

    // In a real app, send email here. For now, log to console.
    await exports.sendEmailCode(email, code);

    res.status(200).json({ message: "Verification code sent to email." });
  } catch (error) {
    console.error("Error requesting code:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verifies the code and logs in/signs up the user.
 */
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required." });
    }

    // --- STEP 1: Validate verification code ---
    const record = await client
      .db(DB_NAME)
      .collection(COLLECTIONS.VERIFICATION_CODES)
      .findOne({ email });

    // Use generic error message to avoid information leakage
    if (!record || record.code !== code || new Date() > record.expiresAt) {
      return res.status(401).json({ error: getSafeErrorMessage("verification") });
    }

    // --- STEP 2: Get or create user ---
    const { user, isNewUser } = await userController.getOrCreateUser(email);

    // --- STEP 3: Generate JWT token ---
    const token = exports.generateAuthToken(user);

    // --- STEP 4: Clean up verification code ---
    await client
      .db(DB_NAME)
      .collection(COLLECTIONS.VERIFICATION_CODES)
      .deleteOne({ email });

    // --- STEP 5: Send authentication response ---
    exports.sendAuthResponse(res, token, user, isNewUser);
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Logs out the user by clearing the auth cookie.
 */
exports.logout = (req, res) => {
  res
    .clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .status(200)
    .json({ message: "Logged out successfully." });
};
