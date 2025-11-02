const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./db");

dotenv.config();
const app = express();

// ✅ CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://cable-net-client.vercel.app",
      "https://cable-net-fe.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Connect to MongoDB (Vercel-safe)
(async () => {
  await connectDB();
  await initializeAdmin();
})();

// ✅ JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "cable_network_secret_key_2024";

// ✅ Admin Schema
const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
  geojson: { type: Object, default: null },
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
module.exports = Admin;

// ✅ JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// ✅ Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res
        .status(400)
        .json({ message: "Username and password required" });

    await connectDB(); // ensures DB connection for serverless functions

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

// ✅ GeoJSON Update Route
app.put("/api/admin/:adminId/geojson", async (req, res) => {
  try {
    const { geojson } = req.body;
    const { adminId } = req.params;

    if (!geojson || typeof geojson !== "object")
      return res.status(400).json({ message: "Valid GeoJSON required" });

    await connectDB();

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

// ✅ Verify Route
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({ message: "Token is valid", user: req.user });
});

// ✅ Health Check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Cable Network Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Import Routes
app.use("/api/services", authenticateToken, require("./routes/services"));
app.use(
  "/api/service-types",
  authenticateToken,
  require("./routes/serviceTypes")
);
app.use("/api/locations", authenticateToken, require("./routes/locations"));

// ✅ Initialize Admin once
const initializeAdmin = async () => {
  await connectDB();
  const existingAdmin = await Admin.findOne({ username: "admin" });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await new Admin({ username: "admin", password: hashedPassword }).save();
    console.log("🧑‍💻 Default admin created: username=admin, password=admin123");
  }
};

// ✅ Local server only (Vercel will ignore)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Export for Vercel
module.exports = app;
