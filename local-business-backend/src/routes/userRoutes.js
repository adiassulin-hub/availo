const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const requireRole = require("../middleware/requireRole");



router.get("/me/favorites", auth, userController.getMyFavorites);
router.post("/me/favorites/:businessId", auth, userController.addFavorite);
router.delete("/me/favorites/:businessId", auth, userController.removeFavorite);
router.patch("/:id/role", auth, requireRole("admin"), userController.setRole);

module.exports = router;
