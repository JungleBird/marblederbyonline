const client = require("../database/mongoDBclient");
const { DB_NAME, COLLECTIONS } = require("../config/constants");

// List of nouns for random username generation
const ADJECTIVES = [
  "Swift",
  "Brave",
  "Clever",
  "Mighty",
  "Fierce",
  "Nimble",
  "Bold",
  "Wise",
  "Loyal",
  "Fearless",
  "Gentle",
  "Valiant",
  "Radiant",
  "Sturdy",
  "Vigilant",
  "Daring",
  "Gallant",
  "Heroic",
  "Resolute",
  "Steadfast",
  "Tenacious",
  "Vigorous",
  "Zealous",
  "Audacious",
];

const NOUNS = [
  "Phoenix",
  "Dragon",
  "Tiger",
  "Eagle",
  "Wolf",
  "Bear",
  "Falcon",
  "Raven",
  "Storm",
  "Mountain",
  "Ocean",
  "Forest",
  "River",
  "Thunder",
  "Shadow",
  "Fire",
  "Crystal",
  "Diamond",
  "Pearl",
  "Emerald",
  "Marble",
  "Quartz",
  "Granite",
  "Silver",
  "Cloud",
  "Wind",
  "Wave",
  "Flame",
  "Frost",
  "Blaze",
  "Spark",
  "Ember",
];

// Generate a random two-word noun username
exports.generateRandomUsername = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}${noun}`;
};

/**
 * Checks if a username already exists in the database.
 *
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if username exists, false otherwise
 */
exports.checkUsernameExists = async (username) => {
  const user = await client
    .db(DB_NAME)
    .collection(COLLECTIONS.USERS)
    .findOne({ username });
  return !!user;
};

/**
 * Generates a unique username with collision handling.
 * Tries base username first, then appends random numbers if collisions occur.
 *
 * @param {number} maxAttempts - Maximum number of generation attempts (default: 10)
 * @returns {Promise<string>} A unique username
 * @throws {Error} If unable to generate unique username after max attempts
 */
exports.generateUniqueUsername = async (maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let username = exports.generateRandomUsername();
    
    // Add random numbers if this isn't the first attempt
    if (attempt > 0) {
      const randomNum = Math.floor(Math.random() * 10000);
      username = `${username}${randomNum}`;
    }
    
    const exists = await exports.checkUsernameExists(username);
    if (!exists) {
      return username;
    }
  }
  
  // Fallback: use timestamp-based unique username
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `User${timestamp}${randomSuffix}`;
};

// Check if a user with given email already exists
exports.checkUserExists = async (email) => {
  return await client.db(DB_NAME).collection(COLLECTIONS.USERS).findOne({ email });
};

/**
 * Creates a new user with a generated username and returns the user object with _id.
 * Used by both the login flow and the user creation endpoint.
 *
 * @param {string} email - The user's email address
 * @returns {Promise<Object>} The created user object with _id, email, username, and timestamps
 */
exports.createNewUser = async (email) => {
  const username = await exports.generateUniqueUsername();
  const now = new Date().toISOString();
  
  const newUser = {
    email,
    username,
    lastLogin: now,
    createdAt: now,
  };

  const result = await client
    .db(DB_NAME)
    .collection(COLLECTIONS.USERS)
    .insertOne(newUser);

  return { ...newUser, _id: result.insertedId };
};

/**
 * Gets an existing user or creates a new one if they don't exist.
 * Updates lastLogin for existing users.
 * Returns the user object and a flag indicating if the user is new.
 *
 * @param {string} email - The user's email address
 * @returns {Promise<{user: Object, isNewUser: boolean}>} User object and new user flag
 */
exports.getOrCreateUser = async (email) => {
  let user = await exports.checkUserExists(email);
  let isNewUser = false;

  if (!user) {
    // Create new user
    isNewUser = true;
    user = await exports.createNewUser(email);
  } else {
    // Update last login for existing user
    await client
      .db(DB_NAME)
      .collection(COLLECTIONS.USERS)
      .updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date().toISOString() } }
      );
  }

  return { user, isNewUser };
};

// Get all users from the database
exports.getAllUsers = async (req, res) => {
  try {
    const users = await client
      .db(DB_NAME)
      .collection(COLLECTIONS.USERS)
      .find({})
      .toArray();

    res.status(200).json({
      message: "Users retrieved successfully.",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new user
exports.handleCreateUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing required field: email." });
    }

    // Check for existing user with same email
    const existingUser = await exports.checkUserExists(email);

    if (existingUser) {
      return res.status(409).json({
        error: "A user with this email already exists.",
      });
    }

    // Use the shared utility to create the user
    const user = await exports.createNewUser(email);

    res.status(201).json({
      message: "User created successfully.",
      userId: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000) {
      return res.status(409).json({
        error: "A user with this email already exists.",
      });
    }

    res.status(500).json({ error: error.message });
  }
};
