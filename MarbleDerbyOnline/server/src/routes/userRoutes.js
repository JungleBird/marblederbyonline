const router = require("express").Router();
const userController = require("../controllers/userController");
const authenticateToken = require("../middlewares/authorizationMiddleware");

// Define routes relative to the base path defined in app.js
router.get("/", authenticateToken, userController.getAllUsers); // Protected: requires valid JWT
router.post("/createUser", userController.handleCreateUser); // Public route


module.exports = router;
