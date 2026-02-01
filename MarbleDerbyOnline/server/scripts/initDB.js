/**
 * Database Initialization Script
 * Run this script once to set up required indexes.
 *
 * Usage: node scripts/initDB.js
 */

require("dotenv").config({ path: "../.env" });
const client = require("../src/database/mongoDBclient");

async function initDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB.");

    const db = client.db("marbleDB");
    const usersCollection = db.collection("users");
    const verificationCodesCollection = db.collection("verificationCodes");

    // Create unique index on email field
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log("Created unique index on 'email' field in 'users' collection.");

    // Create TTL index on expiresAt field for automatic cleanup
    await verificationCodesCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 } 
    );

    console.log("Created TTL index on 'expiresAt' field in 'verificationCodes' collection.");

    console.log("Database initialization complete.");
  } catch (error) {
    console.error("Database initialization error:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

initDatabase();
