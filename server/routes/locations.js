// routes/locations.js
const express = require("express");
const router = express.Router();
const Location = require("../models/Location");

// ✅ FIXED: Correct Admin import
const Admin = require("../models/Admin");
// Optional: Validate Cloudinary URL
const isValidCloudinaryUrl = (url) => {
  try {
    const u = new URL(url);
    return (
      u.hostname === "res.cloudinary.com" &&
      u.pathname.startsWith(`/${process.env.CLOUDINARY_CLOUD_NAME}/`)
    );
  } catch {
    return false;
  }
};

// Get all locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find()
      .populate("serviceName")
      .populate("serviceType")
      .maxTimeMS(10000); // 10 second timeout
    res.json(locations);
  } catch (error) {
    console.error("Get locations error:", error);
    if (
      error.name === "MongooseError" &&
      error.message.includes("buffering timed out")
    ) {
      return res.status(503).json({
        message: "Database connection timeout. Please Login again",
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get locations by service type (for filtering)
router.get("/filter/service-type/:serviceTypeId", async (req, res) => {
  try {
    const locations = await Location.find({
      serviceType: req.params.serviceTypeId,
    })
      .populate("serviceName")
      .populate("serviceType")
      .maxTimeMS(10000);
    res.json(locations);
  } catch (error) {
    console.error("Filter locations error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get location by ID
router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate("serviceName")
      .populate("serviceType")
      .maxTimeMS(10000);
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    console.error("Get location error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create new location
router.post("/", async (req, res) => {
  console.log("Post request hit :-", req.body);
  try {
    const {
      serviceName,
      serviceType,
      notes,
      latitude,
      longitude,
      image,
      image2,
    } = req.body;

    // Validate required fields
    if (!serviceName || !serviceType || latitude == null || longitude == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate Cloudinary URLs (optional but recommended)
    if (image && !isValidCloudinaryUrl(image)) {
      return res.status(400).json({ message: "Invalid Cloudinary image URL" });
    }
    if (image2 && !isValidCloudinaryUrl(image2)) {
      return res.status(400).json({ message: "Invalid Cloudinary image2 URL" });
    }

    const locationData = {
      serviceName,
      serviceType,
      notes: notes || "",
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      ...(image && { image }),
      ...(image2 && { image2 }),
    };

    const location = new Location(locationData);
    const savedLocation = await location.save();
    const populatedLocation = await Location.findById(savedLocation._id)
      .populate("serviceName")
      .populate("serviceType")
      .maxTimeMS(10000);

    res.status(201).json(populatedLocation);
  } catch (error) {
    console.error("Create location error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update location
router.put("/:id", async (req, res) => {
  try {
    const {
      serviceName,
      serviceType,
      notes,
      latitude,
      longitude,
      image,
      image2,
    } = req.body;

    console.log(req.body);
    const { id } = req.params;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Valid coordinates required" });
    }

    const updateData = {
      serviceName,
      serviceType,
      notes,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      ...(image !== undefined && { image }),
      ...(image2 !== undefined && { image2 }),
    };

    // Validate Cloudinary URLs
    if (image && !isValidCloudinaryUrl(image)) {
      return res.status(400).json({ message: "Invalid Cloudinary image URL" });
    }
    if (image2 && !isValidCloudinaryUrl(image2)) {
      return res.status(400).json({ message: "Invalid Cloudinary image2 URL" });
    }

    const location = await Location.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("serviceName")
      .populate("serviceType")
      .maxTimeMS(10000);

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    console.error("Update location error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete location
router.delete("/:id/:adminId", async (req, res) => {
  try {
    const { id, adminId } = req.params;

    // Find and delete the location
    const deletedLocation = await Location.findOneAndDelete({
      _id: id,
    }).maxTimeMS(10000);

    if (!deletedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    // Extract coordinates from deleted location
    const { latitude, longitude } = deletedLocation.coordinates;

    // Find the admin
    const admin = await Admin.findById(adminId).maxTimeMS(10000);
    if (!admin || !admin.geojson) {
      return res.status(404).json({ message: "Admin or geojson not found" });
    }

    // Remove that specific coordinate from admin.geojson.features
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        $pull: {
          "geojson.features": {
            "coordinates.longitude": longitude,
            "coordinates.latitude": latitude,
          },
        },
      },
      { new: true }
    ).maxTimeMS(10000);

    res.json({
      message: "Location deleted and geojson updated successfully",
      updatedUser: {
        id: updatedAdmin._id,
        username: updatedAdmin.username,
        role: updatedAdmin.role,
        geojson: updatedAdmin.geojson,
      },
    });
  } catch (error) {
    console.error("Delete location error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard statistics
router.get("/stats/dashboard", async (req, res) => {
  try {
    const totalLocations = await Location.countDocuments().maxTimeMS(10000);
    const Service = require("../models/Service");
    const ServiceType = require("../models/ServiceType");

    const totalServices = await Service.countDocuments().maxTimeMS(10000);
    const totalServiceTypes = await ServiceType.countDocuments().maxTimeMS(
      10000
    );

    res.json({
      totalLocations,
      totalServices,
      totalServiceTypes,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
