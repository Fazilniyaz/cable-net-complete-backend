// components/AddLocationModal.js
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const AddLocationModal = ({
  isOpen,
  onClose,
  coordinates,
  onLocationCreated,
}) => {
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [imageFile2, setImageFile2] = useState(null);
  const [imagePreview2, setImagePreview2] = useState(null);
  const [filteredServiceTypes, setFilteredServiceTypes] = useState([]);
  const [formData, setFormData] = useState({
    serviceName: "",
    serviceType: "",
    notes: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Reset form when modal opens
      setFormData({ serviceName: "", serviceType: "", notes: "" });
      setImageFile(null);
      setImageFile2(null); // 👈 reset
      setImagePreview(null);
      setImagePreview2(null); // 👈 reset
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.serviceName) {
      const filtered = serviceTypes.filter(
        (st) => st.service?._id === formData.serviceName
      );
      setFilteredServiceTypes(filtered);
    } else {
      setFilteredServiceTypes([]);
    }
  }, [formData.serviceName, serviceTypes]);

  const fetchData = async () => {
    try {
      const [servicesRes, serviceTypesRes] = await Promise.all([
        axios.get("/api/services"),
        axios.get("/api/service-types"),
      ]);
      setServices(servicesRes.data);
      setServiceTypes(serviceTypesRes.data);
    } catch (error) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  // Handle second image
  const handleImageChange2 = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }
      setImageFile2(file);
      setImagePreview2(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formDataToSend = new FormData();
    formDataToSend.append("serviceName", formData.serviceName);
    formDataToSend.append("serviceType", formData.serviceType);
    if (formData.notes) formDataToSend.append("notes", formData.notes);
    formDataToSend.append("latitude", coordinates.latitude);
    formDataToSend.append("longitude", coordinates.longitude);
    if (imageFile) formDataToSend.append("image", imageFile);
    if (imageFile2) formDataToSend.append("image2", imageFile2); // 👈

    try {
      const response = await axios.post("/api/locations", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onLocationCreated(response.data);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create location");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, color: "#2c3e50" }}>Add New Location</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            background: "#f8f9fa",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <strong>Selected Coordinates:</strong>
          <br />
          Latitude: {coordinates?.latitude?.toFixed(6)}
          <br />
          Longitude: {coordinates?.longitude?.toFixed(6)}
        </div>

        {error && (
          <div
            style={{
              background: "#fee",
              color: "#c33",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "20px",
              border: "1px solid #fcc",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#333",
              }}
            >
              Service *
            </label>
            <select
              value={formData.serviceName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  serviceName: e.target.value,
                  serviceType: "",
                })
              }
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid #e1e5e9",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#333",
              }}
            >
              Service Type *
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) =>
                setFormData({ ...formData, serviceType: e.target.value })
              }
              required
              disabled={!formData.serviceName}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid #e1e5e9",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: !formData.serviceName ? "#f5f5f5" : "white",
              }}
            >
              <option value="">Select a service type</option>
              {filteredServiceTypes.map((serviceType) => (
                <option key={serviceType._id} value={serviceType._id}>
                  {serviceType.icon} {serviceType.name}
                </option>
              ))}
            </select>
          </div>

          {/* 👇 REPLACED URL INPUT WITH FILE UPLOAD */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#333",
              }}
            >
              Upload Image (Optional, max 5MB)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                width: "100%",
                padding: "8px 0",
              }}
            />
            {imagePreview && (
              <div style={{ marginTop: "10px", textAlign: "center" }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxHeight: "150px",
                    maxWidth: "100%",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#333",
              }}
            >
              Upload Second Image (Optional, max 5MB)
            </label>
            <input type="file" accept="image/*" onChange={handleImageChange2} />
            {imagePreview2 && (
              <div style={{ marginTop: "10px", textAlign: "center" }}>
                <img
                  src={imagePreview2}
                  alt="Preview 2"
                  style={{
                    maxHeight: "150px",
                    maxWidth: "100%",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#333",
              }}
            >
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about this location..."
              rows="3"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid #e1e5e9",
                borderRadius: "6px",
                fontSize: "14px",
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 20px",
                border: "2px solid #e1e5e9",
                borderRadius: "6px",
                background: "white",
                color: "#666",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: "6px",
                background: loading ? "#95a5a6" : "#27ae60",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              {loading ? "Creating..." : "Create Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;
