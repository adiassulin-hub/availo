const User = require("../models/User");
const Business = require("../models/Business");


const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId; // חשוב!
    if (!userId) return res.status(401).json({ message: "No user id in token" });

    const user = await User.findById(userId).populate({
      path: "favorites",
      select: "name category city images geo avgRating reviewsCount",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.favorites || []);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId; // חשוב!
    const { businessId } = req.params;

    if (!userId) return res.status(401).json({ message: "No user id in token" });

    const exists = await Business.exists({ _id: businessId });
    if (!exists) return res.status(404).json({ message: "Business not found" });

    const updated = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: businessId } },
      { new: true }
    ).select("favorites");

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Added to favorites", favorites: updated.favorites });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { businessId } = req.params;

    await User.findByIdAndUpdate(userId, { $pull: { favorites: businessId } });
    res.json({ message: "Removed from favorites" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const setRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // "owner" / "admin" / "user"

    const updated = await User.findByIdAndUpdate(id, { role }, { new: true }).select("name email role");
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getMyFavorites, addFavorite, removeFavorite, setRole };


