const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // לבדוק אם כבר יש משתמש עם אותו מייל
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // הצפנת סיסמה
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ ברירת מחדל: user (ולא בעל עסק)
    const finalRole = role === "business_owner" ? "business_owner" : "user";

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: finalRole
    });

    // יצירת טוקן
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // למצוא משתמש
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // השוואת סיסמה
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // יצירת טוקן
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.upgradeToBusinessOwner = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "No user in token" });


    const user = await User.findByIdAndUpdate(
      userId,
      { role: "business_owner" },
      { new: true }
    );

    res.json({
      message: "Upgraded to business owner",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};


