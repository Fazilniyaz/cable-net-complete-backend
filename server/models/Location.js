const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  serviceName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceType",
    required: true,
  },
  image: {
    type: String,
    required: false, // Image/diagram specific to this location
  },
  image2: {
    type: String,
    required: false, // Additional image/diagram specific to this location
  },
  notes: {
    type: String,
    required: false,
    trim: true,
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  distanceFromCentralHub: {
    type: Number,
    required: false, // Will be auto-calculated
  },
  centralHub: {
    latitude: {
      type: Number,
      default: 10.98101, // Fixed central hub location
    },
    longitude: {
      type: Number,
      default: 76.9668453, // Fixed central hub location
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate distance from central hub before saving
locationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Calculate distance using Haversine formula
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (this.centralHub.latitude * Math.PI) / 180;
  const φ2 = (this.coordinates.latitude * Math.PI) / 180;
  const Δφ =
    ((this.coordinates.latitude - this.centralHub.latitude) * Math.PI) / 180;
  const Δλ =
    ((this.coordinates.longitude - this.centralHub.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  this.distanceFromCentralHub = Math.round(R * c); // Distance in meters

  next();
});

module.exports = mongoose.model("Location", locationSchema);
