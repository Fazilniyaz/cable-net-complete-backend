const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const upload = require("../middleware/upload");
// const Admin = require("./models/Admin");
const Admin = require("../server");

// Get all locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find()
      .populate("serviceName")
      .populate("serviceType");
    res.json(locations);
  } catch (error) {
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
      .populate("serviceType");
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get location by ID
router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate("serviceName")
      .populate("serviceType");
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new location
// Create new location
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image2", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const locationData = {
        serviceName: req.body.serviceName,
        serviceType: req.body.serviceType,
        notes: req.body.notes || "",
        coordinates: {
          latitude: parseFloat(req.body.latitude),
          longitude: parseFloat(req.body.longitude),
        },
      };

      if (req.files?.image?.[0]) {
        locationData.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files?.image2?.[0]) {
        locationData.image2 = `/uploads/${req.files.image2[0].filename}`;
      }

      const location = new Location(locationData);
      const savedLocation = await location.save();
      const populatedLocation = await Location.findById(savedLocation._id)
        .populate("serviceName")
        .populate("serviceType");

      res.status(201).json(populatedLocation);
    } catch (error) {
      // Cleanup uploaded files
      const fs = require("fs");
      if (req.files?.image?.[0]) fs.unlinkSync(req.files.image[0].path);
      if (req.files?.image2?.[0]) fs.unlinkSync(req.files.image2[0].path);
      res.status(400).json({ message: error.message });
    }
  }
);

// Update location
// Update location
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image2", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updateData = {
        serviceName: req.body.serviceName,
        serviceType: req.body.serviceType,
        notes: req.body.notes,
        coordinates: {
          latitude: parseFloat(req.body.coordinates.latitude),
          longitude: parseFloat(req.body.coordinates.longitude),
        },
      };

      if (req.files?.image?.[0]) {
        updateData.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files?.image2?.[0]) {
        updateData.image2 = `/uploads/${req.files.image2[0].filename}`;
      }

      const location = await Location.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate("serviceName")
        .populate("serviceType");

      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete location
router.delete("/:id/:adminId", async (req, res) => {
  try {
    const { id, adminId } = req.params;

    // 1️. Find and delete the location
    const deletedLocation = await Location.findOneAndDelete({ _id: id });

    if (!deletedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    // 2️. Extract coordinates from deleted location
    const { latitude, longitude } = deletedLocation.coordinates;

    // 3️. Find the admin
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.geojson) {
      return res.status(404).json({ message: "Admin or geojson not found" });
    }

    // 4️. Remove that specific coordinate from admin.geojson.features (if it's a FeatureCollection)
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
    );

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
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard statistics
router.get("/stats/dashboard", async (req, res) => {
  try {
    const totalLocations = await Location.countDocuments();
    const Service = require("../models/Service");
    const ServiceType = require("../models/ServiceType");

    const totalServices = await Service.countDocuments();
    const totalServiceTypes = await ServiceType.countDocuments();

    res.json({
      totalLocations,
      totalServices,
      totalServiceTypes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
