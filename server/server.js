const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
// ...existing code...
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// ...existing code...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Use environment variable for DB connection
const MONGODB_URI = process.env.MONGODB_URI;

// ✅ Maintain a single global connection (important for Vercel)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = conn.connections[0].readyState === 1;
    console.log("✅ MongoDB connected successfully");
    await initializeAdmin();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

connectDB(); // Call once on startup

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "cable_network_secret_key_2024";

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
  geojson: { type: Object, default: null },
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    await connectDB(); // ensure DB is connected

    if (!username || !password)
      return res
        .status(400)
        .json({ message: "Username and password required" });

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        geojson: admin.geojson,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GeoJSON Update Route
app.put("/api/admin/:adminId/geojson", async (req, res) => {
  try {
    const { geojson } = req.body;
    const { adminId } = req.params;
    await connectDB();

    if (!geojson || typeof geojson !== "object")
      return res.status(400).json({ message: "Valid GeoJSON required" });

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { geojson },
      { new: true, runValidators: true }
    );

    if (!updatedAdmin)
      return res.status(404).json({ message: "Admin not found" });

    res.status(200).json({
      message: "GeoJSON updated successfully",
      user: {
        id: updatedAdmin._id,
        username: updatedAdmin.username,
        role: updatedAdmin.role,
        geojson: updatedAdmin.geojson,
      },
    });
  } catch (error) {
    console.error("GeoJSON update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Token Verify Route
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({ message: "Token is valid", user: req.user });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Cable Network Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// Import routes (if needed)
const serviceRoutes = require("./routes/services");
const serviceTypeRoutes = require("./routes/serviceTypes");
const locationRoutes = require("./routes/locations");
// const locationNameRoutes = require("./routes/locationNames");

// app.use("/api/location-names", authenticateToken, locationNameRoutes);
app.use("/api/services", authenticateToken, serviceRoutes);
app.use("/api/service-types", authenticateToken, serviceTypeRoutes);
app.use("/api/locations", authenticateToken, locationRoutes);

// Initialize default admin (run once)
async function initializeAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const defaultAdmin = new Admin({
        username: "admin",
        password: hashedPassword,
        role: "admin",
      });
      await defaultAdmin.save();
      console.log("Default admin created: username=admin, password=admin123");
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
  }
}

// Start server (for local only)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ✅ Export app for Vercel
module.exports = app;
