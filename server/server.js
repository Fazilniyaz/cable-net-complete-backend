const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config();
const Admin = require("./models/Admin");

const app = express();

// Middleware
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

// ✅ FIXED: Improved MongoDB connection handling
const MONGODB_URI = process.env.MONGODB_URI;

// Configure mongoose for serverless
mongoose.set("strictQuery", false);
mongoose.set("bufferCommands", false); // Disable buffering for serverless

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // If connecting, wait for it
    if (mongoose.connection.readyState === 2) {
      return new Promise((resolve, reject) => {
        mongoose.connection.once("connected", () =>
          resolve(mongoose.connection)
        );
        mongoose.connection.once("error", reject);
      });
    }

    // Connect with optimized settings for serverless
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Minimum pool size
    });

    console.log("✅ MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "cable_network_secret_key_2024";

// ✅ FIXED: Middleware to ensure DB connection before each request
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(503).json({
      message: "Database connection failed. Please try again.",
      error: error.message,
    });
  }
};

// Apply to all routes
app.use(ensureDBConnection);

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
    dbStatus:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Import routes
const serviceRoutes = require("./routes/services");
const serviceTypeRoutes = require("./routes/serviceTypes");
const locationRoutes = require("./routes/locations");

app.use("/api/services", authenticateToken, serviceRoutes);
app.use("/api/service-types", authenticateToken, serviceTypeRoutes);
app.use("/api/locations", authenticateToken, locationRoutes);

// Initialize default admin
async function initializeAdmin() {
  try {
    await connectDB();
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

// Initialize admin on startup (for local development)
connectDB().then(() => initializeAdmin());

// Graceful shutdown (for local development)
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
});

// Start server (for local only)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(
    `Server running on port ${PORT} on ${process.env.NODE_ENV || "development"}`
  )
);

// Export app for Vercel
module.exports = app;
module.exports.Admin = Admin;
