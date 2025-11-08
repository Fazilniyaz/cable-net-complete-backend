const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Location = require("../models/Location"); // ← Import Location

// Get all services
router.get("/", async (req, res) => {
  try {
    const services = await Service.find().populate("location");
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service by ID
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("location");
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new service
router.post("/", async (req, res) => {
  try {
    const service = new Service(req.body);
    const savedService = await service.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update service
router.put("/:id", async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete service
router.delete("/:id", async (req, res) => {
  try {
    const serviceId = req.params.id;

    // Check if any location references this service
    const locationExists = await Location.exists({ serviceName: serviceId });

    if (locationExists) {
      return res.status(403).json({
        message:
          "This service contains many locations. Please delete all its locations first to delete this service.",
        error: "Not allowed",
      });
    }

    const service = await Service.findByIdAndDelete(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
