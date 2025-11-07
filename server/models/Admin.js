const mongoose = require("mongoose");

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
  geojson: { type: Object, default: null },
});

module.exports = mongoose.model("Admin", adminSchema);
