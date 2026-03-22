const express = require("express");
const router = express.Router();
const businessController = require("../controllers/businessController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

/* ================= PUBLIC ================= */

router.get("/", businessController.getAllBusinesses);
router.get("/meta/categories", businessController.getCategories);
router.get("/map/pins", businessController.getMapPins);

/* ================= AUTH (USER / OWNER) ================= */

router.get("/me/mine", auth, requireRole("owner", "admin"), businessController.getMyBusinesses);
router.post("/", auth, requireRole("owner", "admin"), businessController.createBusiness);
router.post("/:id/report", auth, businessController.reportBusiness);
router.post("/:id/reviews", auth, businessController.addReview);
router.put("/:id", auth, businessController.updateBusiness);
router.delete("/:id", auth, businessController.deleteBusiness);

/* ================= ADMIN ================= */

router.get("/admin/all", auth, requireRole("admin"), businessController.getAllBusinessesAdmin);
router.get("/admin/pending", auth, requireRole("admin"), businessController.getPendingBusinesses);
router.get("/admin/reports", auth, requireRole("admin"), businessController.getReportedBusinesses);

router.patch("/:id/block", auth, requireRole("admin"), businessController.blockBusiness);
router.patch("/:id/unblock", auth, requireRole("admin"), businessController.unblockBusiness);
router.patch("/:id/approve", auth, requireRole("admin"), businessController.approveBusiness);
router.patch("/:id/reject", auth, requireRole("admin"), businessController.rejectBusiness);

/* ================= SINGLE BUSINESS (MUST BE LAST) ================= */

router.get("/:id", businessController.getBusinessById);

module.exports = router;




