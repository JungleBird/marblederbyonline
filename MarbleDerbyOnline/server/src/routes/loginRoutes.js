const router = require("express").Router();
const loginController = require("../controllers/loginController");
const { verificationCodeLimiter, loginAttemptLimiter } = require("../middlewares/rateLimiter");

// Route to request a verification code (rate limited)
router.post("/request-code", verificationCodeLimiter, loginController.requestCode);

// Route to verify the code and login/signup (rate limited)
router.post("/verify-code", loginAttemptLimiter, loginController.verifyCode);

// Route to logout (clear auth cookie)
router.post("/logout", loginController.logout);

module.exports = router;
