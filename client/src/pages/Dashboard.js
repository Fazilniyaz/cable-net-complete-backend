"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NetworkAnalytics from "../components/NetworkAnalytics";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLocations: 0,
    totalServices: 0,
    totalServiceTypes: 0,
  });
  const [recentLocations, setRecentLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, locationsRes, servicesRes, serviceTypesRes] =
        await Promise.all([
          axios.get("/api/locations/stats/dashboard"),
          axios.get("/api/locations"),
          axios.get("/api/services"),
          axios.get("/api/service-types"),
        ]);
      setStats(statsRes.data);
      setRecentLocations(locationsRes.data.slice(0, 5));
      setServices(servicesRes.data);
      setServiceTypes(serviceTypesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="relative h-full w-full">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Dashboard Overview</h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, #3498db, #2980b9)",
              color: "white",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              Total Locations
            </h3>
            <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold" }}>
              {stats.totalLocations}
            </p>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, #27ae60, #229954)",
              color: "white",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              Total Services
            </h3>
            <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold" }}>
              {stats.totalServices}
            </p>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              color: "white",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              Service Types
            </h3>
            <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold" }}>
              {stats.totalServiceTypes}
            </p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/locations")}
          >
            📍 Add New Location
          </button>
          <button
            className="btn btn-success"
            onClick={() => navigate("/services")}
          >
            ⚙️ Create Service
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/network-map")}
          >
            🗺️ View Network Map
          </button>
        </div>
      </div>
      <NetworkAnalytics
        locations={recentLocations}
        serviceTypes={serviceTypes}
        services={services}
      />
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Locations</h3>
        </div>

        {recentLocations.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Type</th>
                <th>Distance from Hub</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentLocations.map((location) => (
                <tr key={location._id}>
                  <td>{location.serviceName?.name || "N/A"}</td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>
                        {location.serviceType?.icon}
                      </span>
                      {location.serviceType?.name || "N/A"}
                    </div>
                  </td>
                  <td>{location.distanceFromCentralHub}m</td>
                  <td>{new Date(location.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No locations created yet. Start by adding your first location.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
