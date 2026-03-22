require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const connectDB = require("./config/db");
connectDB();
const businessRoutes = require("./routes/businessRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
console.log("userRoutes resolved:", require.resolve("./routes/userRoutes"));
console.log("userRoutes keys:", userRoutes ? Object.keys(userRoutes) : null);
console.log("userRoutes value:", userRoutes);


console.log("businessRoutes type:", typeof businessRoutes);
console.log("authRoutes type:", typeof authRoutes);
console.log("userRoutes type:", typeof userRoutes);


// middlewares
app.use(cors());
app.use(express.json());
app.use("/api/businesses", businessRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes.router || userRoutes.default || userRoutes);


// test route
app.get("/", (req, res) => {
  res.send("Local Business API is running ✔️");
});

// start server
const PORT = process.env.PORT || 5000;
const SERVER_ID = `srv-${Date.now()}-${Math.random().toString(16).slice(2)}`;

app.get("/__whoami", (req, res) => {
  res.json({
    ok: true,
    SERVER_ID,
    pid: process.pid,
    mongoUriStart: (process.env.MONGODB_URI || "").slice(0, 35) + "...",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



