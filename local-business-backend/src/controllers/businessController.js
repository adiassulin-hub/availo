const Business = require("../models/Business");
const ALLOWED_CATEGORIES = [
  "השכרת שמלות",
  "לייזר",
  "גבות",
  "אוכל ביתי",
  "ספר",
  "מורה פרטי",
  "קוסמטיקה",
  "אחר"
];
const projection =
  "name category city description address phone instagram images geo owner createdAt";

exports.getAllBusinesses = async (req, res) => {
  try {
    const {
      category,
      city,
      q,
      lat,
      lng,
      radiusKm = 5,
      page = 1,
      limit = 20,
      sort = "new"
    } = req.query;

    const filter = {};
    filter.status = "approved";


    if (category) filter.category = category;
    if (city) filter.city = city;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } }
      ];
    }

    // Map / nearby
    if (lat && lng) {
      filter.geo = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: Number(radiusKm) * 1000
        }
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortObj =
      sort === "old" ? { createdAt: 1 } :
      sort === "name" ? { name: 1 } :
      { createdAt: -1 };

    

    const [items, total] = await Promise.all([Business.find(filter)
      .select(projection)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit)),
      Business.countDocuments(filter)
    ]);


    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingBusinesses = async (req, res) => {
  try {
    const {
      category,
      city,
      q,
      page = 1,
      limit = 20,
      sort = "new"
    } = req.query;

    const filter = { status: "pending" };

    if (category) filter.category = category;
    if (city) filter.city = city;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortObj =
      sort === "old" ? { createdAt: 1 } :
      sort === "name" ? { name: 1 } :
      { createdAt: -1 };

    const [items, total] = await Promise.all([
      Business.find(filter)
        .populate("owner", "name email role")
        .select(projection+ "owner")
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Business.countDocuments(filter)
    ]);

    res.json({ page: Number(page), limit: Number(limit), total, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getAllBusinessesAdmin = async (req, res) => {
  try {
    const {
      category,
      city,
      q,
      page = 1,
      limit = 20,
      sort = "new",
      status 
    } = req.query;

    const filter = {};
    if (status) filter.status = status; 

    if (category) filter.category = category;
    if (city) filter.city = city;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortObj =
      sort === "old" ? { createdAt: 1 } :
      sort === "name" ? { name: 1 } :
      { createdAt: -1 };

    const [items, total] = await Promise.all([
      Business.find(filter)
        .select(projection)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Business.countDocuments(filter)
    ]);

    res.json({ page: Number(page), limit: Number(limit), total, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.createBusiness = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    if (!userId) return res.status(401).json({ message: "No user in token" });

    const role = req.user?.role;
    if (role !== "owner" && role !== "admin") {
    return res.status(403).json({ message: "Only owners can create businesses" });
    }

    const { owner, lat, lng, ...safeBody } = req.body;

    if (safeBody.category) {
       safeBody.category = safeBody.category.trim().replace(/\s+/g, " ");
    }

    if (!safeBody.category || !ALLOWED_CATEGORIES.includes(safeBody.category)) {
      return res.status(400).json({ message: "Invalid category" });
    }


    if (lat == null || lng == null) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const business = new Business({
      ...safeBody,
      owner: userId,
      status: "pending",
      geo: { type: "Point", coordinates: [Number(lng), Number(lat)] }
    });

    await business.save();
    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).select(projection);

    if (!business) return res.status(404).json({ message: "Business not found" });

    const isAdmin = req.user?.role === "admin";
    const isOwner = req.user && String(business.owner) === String(req.user.id || req.user._id || req.user.userId);

    if (!isAdmin && !isOwner && business.status !== "approved") {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: "Business not found" });

    const userId = req.user?.id || req.user?._id || req.user?.userId;
    const isOwner = String(business.owner) === String(userId);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden - not owner" });
    }

    const { owner, geo, ...updates } = req.body;

    if (req.body.lat != null && req.body.lng != null) {
      updates.geo = {
        type: "Point",
        coordinates: [Number(req.body.lng), Number(req.body.lat)],
      };
    }

    const updated = await Business.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




exports.deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: "Business not found" });

    const userId = req.user?.id || req.user?._id || req.user?.userId;
    const isOwner = String(business.owner) === String(userId);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden - not owner" });
    }

    await business.deleteOne();
    res.json({ message: "Business deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  res.json(ALLOWED_CATEGORIES);
};

// ✅ GET /api/businesses/me/mine  (רק לעסק של המשתמש המחובר)
exports.getMyBusinesses = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    const items = await Business.find({ owner: userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET /api/businesses/map/pins  (קל למפה)
exports.getMapPins = async (req, res) => {
  try {
    const { lat, lng, radiusKm = 5, category, city, q } = req.query;
    const filter = {};
    filter.status = "approved";


    if (category) filter.category = category;
    if (city) filter.city = city;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    if (lat && lng) {
      filter.geo = {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radiusKm) * 1000
        }
      };
    }

    const pins = await Business.find(filter).select("name category city geo images");
    res.json(pins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.blockBusiness = async (req, res) => {
  try {
    const updated = await Business.findByIdAndUpdate(
      req.params.id,
      { status: "blocked" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Business not found" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.unblockBusiness = async (req, res) => {
  try {
    const updated = await Business.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Business not found" });
    res.json({ message: "Business unblocked", business: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { rating, text = "" } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const r = Number(rating);

    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (business.status !== "approved") {
      return res.status(400).json({ message: "Cannot review this business" });
    }

    const already = business.reviews?.some(
      r => String(r.user) === String(userId)
    );

    if (already) {
      return res.status(400).json({ message: "You already reviewed this business" });
    }

    business.reviews.push({
      user: userId,
      rating: r,
      text
    });

    const count = business.reviews.length;
    const avg = business.reviews.reduce((sum, review) => sum + review.rating, 0) / count;

    business.reviewsCount = count;
    business.avgRating = Math.round(avg * 10) / 10;

    await business.save();

    res.status(201).json({
      message: "Review added",
      avgRating: business.avgRating,
      reviewsCount: business.reviewsCount
    });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.reportBusiness = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "No user in token" });

    const { reason = "other", message = "" } = req.body;

    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: "Business not found" });

    const already = business.reports?.some(r => String(r.user) === String(userId));
    if (already) return res.status(400).json({ message: "You already reported this business" });

    business.reports.push({ user: userId, reason, message });
    business.reportsCount = business.reports.length;

    const AUTO_BLOCK_AFTER = 5;
    if (business.reportsCount >= AUTO_BLOCK_AFTER) {
      business.status = "blocked";
    }

    await business.save();

    res.status(201).json({
      message: "Report submitted",
      reportsCount: business.reportsCount,
      status: business.status
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.approveBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!business) return res.status(404).json({ message: "Business not found" });
    res.json(business);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.rejectBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!business) return res.status(404).json({ message: "Business not found" });
    res.json(business);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getReportedBusinesses = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;

    const filter = { reportsCount: { $gt: 0 } };

    const [items, total] = await Promise.all([
      Business.find(filter)
        .select("name city category status reportsCount reports owner createdAt")
        .populate("owner", "name email")
        .populate("reports.user", "name email")
        .sort({ reportsCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Business.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};








