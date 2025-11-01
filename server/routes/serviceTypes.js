const express = require("express")
const router = express.Router()
const ServiceType = require("../models/ServiceType")

// Get all service types
router.get("/", async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find().populate("service")
    res.json(serviceTypes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get service types by service ID
router.get("/service/:serviceId", async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find({ service: req.params.serviceId }).populate("service")
    res.json(serviceTypes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get service type by ID
router.get("/:id", async (req, res) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id).populate("service")
    if (!serviceType) {
      return res.status(404).json({ message: "Service type not found" })
    }
    res.json(serviceType)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create new service type
router.post("/", async (req, res) => {
  try {
    const serviceType = new ServiceType(req.body)
    const savedServiceType = await serviceType.save()
    const populatedServiceType = await ServiceType.findById(savedServiceType._id).populate("service")
    res.status(201).json(populatedServiceType)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Update service type
router.put("/:id", async (req, res) => {
  try {
    const serviceType = await ServiceType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("service")
    if (!serviceType) {
      return res.status(404).json({ message: "Service type not found" })
    }
    res.json(serviceType)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Delete service type
router.delete("/:id", async (req, res) => {
  try {
    const serviceType = await ServiceType.findByIdAndDelete(req.params.id)
    if (!serviceType) {
      return res.status(404).json({ message: "Service type not found" })
    }
    res.json({ message: "Service type deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
