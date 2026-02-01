require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const userRoutes = require("./src/routes/userRoutes");
const loginRoutes = require("./src/routes/loginRoutes");
const client = require("./src/database/mongoDBclient");
const initializeSocket = require("./src/sockets/socket");
const port = process.env.PORT || 5000;

// CORS configuration to allow credentials (cookies)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Initialize socket event handlers
initializeSocket(io);

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    console.log("Attempting to connect to MongoDB...");
    // Debug: Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    const uriPreview = process.env.MONGO_URI.substring(0, 50) + "...";
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.error("\nTroubleshooting MongoDB connection:");
    console.error("1. Verify MONGO_URI is set in your .env file");
    console.error("2. Check that your IP is whitelisted in MongoDB Atlas (Security > Network Access)");
    console.error("3. Verify the connection string syntax: mongodb+srv://username:password@cluster.mongodb.net/dbname");
    console.error("4. Test your network connection to MongoDB Atlas");
    console.error("\nServer will continue but database operations will fail.");
    return false;
  }
}

// Start server only after attempting DB connection
run().then((isConnected) => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.IO server ready on port ${port}`);
    if (!isConnected) {
      console.warn("WARNING: MongoDB is not connected. Database features will not work.");
    }
  });
});

// Health check endpoint
app.get("/api/v1/ping", async (req, res) => {
  try {
    await client.db("admin").command({ ping: 1 });
    res.json({
      message: "Pinged your deployment. You successfully connected to MongoDB!",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount user routes under versioned API path
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/login", loginRoutes);

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
