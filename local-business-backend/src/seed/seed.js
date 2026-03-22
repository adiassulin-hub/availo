require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Business = require("../models/Business");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Mongo connected");

  await User.deleteMany({});
  await Business.deleteMany({});
  console.log("🧹 Cleared Users + Businesses");

  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    passwordHash,
    role: "admin",
  });

  const owner = await User.create({
    name: "Owner",
    email: "owner@test.com",
    passwordHash,
    role: "owner",
  });

  const user = await User.create({
    name: "User",
    email: "user@test.com",
    passwordHash,
    role: "user",
  });

  await Business.insertMany([
    {
      name: "Pending Business",
      category: "beauty",
      city: "Ashdod",
      address: "Herzl 1",
      description: "Waiting approval",
      owner: owner._id,
      status: "pending",
      geo: { type: "Point", coordinates: [34.6553, 31.8044] }
    },
    {
      name: "Approved Business",
      category: "beauty",
      city: "Tel Aviv",
      address: "Dizengoff 100",
      description: "Visible to users",
      owner: owner._id,
      status: "approved",
      geo: { type: "Point", coordinates: [34.7818, 32.0853] }
    }
  ]);

  console.log("👤 Users created:");
  console.log("admin@test.com / 123456");
  console.log("owner@test.com / 123456");
  console.log("user@test.com / 123456");

  console.log("🏪 Businesses created");
  console.log("✅ Seed finished");

  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});