"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { DataTable } from "../components/DataTable";

const ServiceTypes = () => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    colorForMarking: "#3498db",
    icon: "",
    service: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [serviceTypesRes, servicesRes] = await Promise.all([
        axios.get("/api/service-types"),
        axios.get("/api/services"),
      ]);
      setServiceTypes(serviceTypesRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingServiceType) {
        await axios.put(
          `/api/service-types/${editingServiceType._id}`,
          formData
        );
        setSuccess("Service type updated successfully");
      } else {
        await axios.post("/api/service-types", formData);
        setSuccess("Service type created successfully");
      }

      fetchData();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (serviceType) => {
    setEditingServiceType(serviceType);
    setFormData({
      name: serviceType.name,
      colorForMarking: serviceType.colorForMarking,
      icon: serviceType.icon,
      service: serviceType.service._id,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service type?")) {
      try {
        await axios.delete(`/api/service-types/${id}`);
        setSuccess("Service type deleted successfully");
        fetchData();
      } catch (error) {
        setError("Failed to delete service type");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      colorForMarking: "#3498db",
      icon: "",
      service: "",
    });
    setEditingServiceType(null);
    setShowForm(false);
  };

  const iconOptions = [
    "📡",
    "🔌",
    "📶",
    "🌐",
    "⚡",
    "🔧",
    "📊",
    "🎯",
    "🔗",
    "📋",
    "🏢",
    "🏠",
    "🏭",
    "🏪",
    "🏫",
    "🏥",
    "🏦",
    "🏨",
    "🏩",
    "🏰",
    // Original icons
    "📡",
    "🔌",
    "📶",
    "🌐",
    "⚡",
    "🔧",
    "📊",
    "🎯",
    "🔗",
    "📋",
    "🏢",
    "🏠",
    "🏭",
    "🏪",
    "🏫",
    "🏥",
    "🏦",
    "🏨",
    "🏩",
    "🏰",

    // Network & Technology
    "🖥️",
    "💻",
    "📱",
    "🖨️",
    "⌨️",
    "🖱️",
    "📞",
    "📠",
    "📹",
    "📼",
    "💾",
    "💿",
    "📀",
    "🧮",
    "📟",
    "📺",
    "📻",
    "🎙️",
    "🎚️",
    "🎛️",

    // Infrastructure & Utilities
    "🗼",
    "🏗️",
    "🚧",
    "⚓",
    "⛽",
    "🏮",
    "🗿",
    "🏟️",
    "🎪",
    "🎭",
    "🛤️",
    "🛣️",
    "🚦",
    "🚥",
    "🗺️",
    "🧭",
    "⛰️",
    "🏔️",
    "🌋",
    "🏕️",

    // Business & Commerce
    "💼",
    "💰",
    "💵",
    "💳",
    "🧾",
    "📈",
    "📉",
    "📅",
    "📆",
    "🕐",
    "🕑",
    "🕒",
    "🕓",
    "🕔",
    "🕕",
    "🕖",
    "🕗",
    "🕘",
    "🕙",
    "🕚",

    // Transportation
    "🚗",
    "🚕",
    "🚙",
    "🚌",
    "🚎",
    "🏎️",
    "🚓",
    "🚑",
    "🚒",
    "🚐",
    "🚚",
    "🚛",
    "🚜",
    "🛴",
    "🚲",
    "🛵",
    "🏍️",
    "🚁",
    "✈️",
    "🛩️",

    // Colored Circles (Heatmap style)
    "🔴",
    "🟠",
    "🟡",
    "🟢",
    "🔵",
    "🟣",
    "🟤",
    "⚫",
    "⚪",
    "🟥",
    "🟧",
    "🟨",
    "🟩",
    "🟦",
    "🟪",
    "🟫",
    "⬛",
    "⬜",
    "◼️",
    "◻️",
    // Gradient colored circles
    "🟥",
    "🟧",
    "🟨",
    "🟩",
    "🟦",
    "🟪",
    "🟫",
    "🔴",
    "🟠",
    "🟡",
    "🟢",
    "🔵",
    "🟣",
    "🟤",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🤎",

    // Shapes & Symbols
    "⭐",
    "🌟",
    "🌀",
    "🌈",
    "🌊",
    "🔥",
    "💧",
    "🌙",
    "☀️",
    "☁️",
    "⛈️",
    "🌩️",
    "🌪️",
    "❄️",
    "💨",
    "🌫️",
    "☄️",
    "💫",
    "✨",
    "🎇",

    // Indicators & Status
    "✅",
    "❌",
    "⚠️",
    "🚨",
    "🔔",
    "📢",
    "📍",
    "🛑",
    "⭕",
    "❓",
    "❗",
    "🔴",
    "🟢",
    "🟡",
    "🔵",
    "🟣",
    "⚫",
    "⚪",
    "🔶",
    "🔷",

    // Professional & Office
    "📁",
    "📂",
    "📃",
    "📄",
    "📑",
    "📊",
    "📈",
    "📉",
    "🗃️",
    "🗄️",
    "🗂️",
    "📌",
    "📍",
    "📎",
    "🖇️",
    "✂️",
    "📏",
    "📐",
    "🧰",
    "🔨",

    // Specialized Location Markers
    "🗽",
    "🏛️",
    "💒",
    "🕍",
    "🕌",
    "⛪",
    "🛕",
    "📿",
    "⚱️",
    "⚰️",
    "🪦",
    "🪔",
    "💡",
    "🔦",
    "🕯️",
    "⛺",
    "🛖",
    "🌠",
    "🎆",
    "🎑",

    // Weather & Environment
    "🌡️",
    "🧪",
    "🔬",
    "🔭",
    "📡",
    "🛰️",
    "🧲",
    "🔋",
    "🪫",
    "🔌",
    "💡",
    "🔦",
    "🕯️",
    "🪔",
    "🧭",
    "🌡️",
    "💧",
    "💨",
    "🔥",
    "❄️",

    // Additional colored variants
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "7️⃣",
    "8️⃣",
    "9️⃣",
    "🔟",
    "🔠",
    "🔡",
    "🔢",
    "🔣",
    "🔤",
    "🅰️",
    "🅱️",
    "🆎",
    "🆑",
    "🆒",
  ];

  if (loading) {
    return <div className="loading">Loading service types...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-lg rounded-2xl p-6 lg:p-8">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-gray-800 tracking-wide">
            Service Type Management
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "Add New Service Type"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
            <div className="form-group">
              <label className="form-label">Service Type Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., AC Node, Injector, Tenda, Railwire"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Service</label>
              <select
                className="form-select"
                value={formData.service}
                onChange={(e) =>
                  setFormData({ ...formData, service: e.target.value })
                }
                required
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Color for Marking</label>
              <div className="flex flex-col gap-4">
                {/* Color Preview and Input */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border border-gray-300 shadow-sm cursor-pointer"
                    style={{ backgroundColor: formData.colorForMarking }}
                    onClick={() =>
                      document.getElementById("colorPicker").click()
                    }
                  />
                  <input
                    id="colorPicker"
                    type="color"
                    value={formData.colorForMarking}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colorForMarking: e.target.value,
                      })
                    }
                    className="sr-only" // Hide the default color input but keep it functional
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      className="form-input"
                      value={formData.colorForMarking}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          colorForMarking: e.target.value,
                        })
                      }
                      placeholder="#3498db"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>

                {/* Color Palette Grid */}
                <div className="grid grid-cols-10 gap-2">
                  {[
                    "#FF0000",
                    "#FF6B6B",
                    "#FFA500",
                    "#FFD93D",
                    "#6BCF7F",
                    "#4ECDC4",
                    "#45B7D1",
                    "#4D96FF",
                    "#9B59B6",
                    "#34495E",
                    "#E74C3C",
                    "#EC7063",
                    "#E67E22",
                    "#F1C40F",
                    "#2ECC71",
                    "#1ABC9C",
                    "#3498DB",
                    "#9B59B6",
                    "#8E44AD",
                    "#2C3E50",
                    "#FF4757",
                    "#FF6348",
                    "#FFA502",
                    "#FFFA65",
                    "#7BED9F",
                    "#70A1FF",
                    "#5352ED",
                    "#3742FA",
                    "#2F3542",
                    "#747D8C",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, colorForMarking: color })
                      }
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          formData.colorForMarking === color
                            ? "#3498db"
                            : "#e5e7eb",
                      }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Popular Colors Section */}
                <div className="mt-2">
                  <label className="text-sm text-gray-600 mb-2 block">
                    Popular Colors
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { name: "Red", value: "#FF0000" },
                      { name: "Green", value: "#00FF00" },
                      { name: "Blue", value: "#0000FF" },
                      { name: "Yellow", value: "#FFFF00" },
                      { name: "Purple", value: "#800080" },
                      { name: "Orange", value: "#FFA500" },
                      { name: "Teal", value: "#008080" },
                      { name: "Pink", value: "#FFC0CB" },
                      { name: "Brown", value: "#A52A2A" },
                      { name: "Gray", value: "#808080" },
                    ].map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            colorForMarking: color.value,
                          })
                        }
                        className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:border-gray-400 transition-all duration-200 hover:bg-gray-50"
                        style={{
                          borderColor:
                            formData.colorForMarking === color.value
                              ? "#3498db"
                              : "#e5e7eb",
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-xs text-gray-600">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(10, 1fr)",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    style={{
                      padding: "8px",
                      border:
                        formData.icon === icon
                          ? "2px solid #3498db"
                          : "1px solid #ddd",
                      borderRadius: "4px",
                      background: formData.icon === icon ? "#e3f2fd" : "white",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="form-input"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="Select an icon above or enter custom"
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn btn-success">
                {editingServiceType
                  ? "Update Service Type"
                  : "Create Service Type"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <DataTable
          data={serviceTypes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          columns={[
            { key: "name", header: "Name" },
            {
              key: "service",
              header: "Service",
              render: (s) => s.service?.name || "N/A",
            },
            {
              key: "colorForMarking",
              header: "Color",
              render: (s) => (
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: s.colorForMarking,
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  />
                  {s.colorForMarking}
                </div>
              ),
            },
            {
              key: "icon",
              header: "Icon",
              render: (s) => <span className="text-lg">{s.icon}</span>,
            },
            {
              key: "createdAt",
              header: "Created At",
              render: (s) => new Date(s.createdAt).toLocaleDateString(),
            },
          ]}
        />

        {serviceTypes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No service types found. Create your first service type to get
            started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceTypes;
