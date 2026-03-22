const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");


// הרשמה
router.post("/register", authController.register);

// התחברות
router.post("/login", authController.login);

// שדרוג משתמש רגיל לבעל עסק
router.patch("/upgrade-to-owner", auth, authController.upgradeToBusinessOwner);

router.get("/me", auth, authController.me);


module.exports = router;

