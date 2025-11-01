"use client"

import { useState, useEffect } from "react"

const NetworkAnalytics = ({ locations, serviceTypes, services }) => {
  const [analytics, setAnalytics] = useState({
    totalCoverage: 0,
    averageDistance: 0,
    serviceDistribution: {},
    distanceRanges: {},
    networkDensity: 0,
  })

  useEffect(() => {
    calculateAnalytics()
  }, [locations, serviceTypes, services])

  const calculateAnalytics = () => {
    if (!locations.length) {
      setAnalytics({
        totalCoverage: 0,
        averageDistance: 0,
        serviceDistribution: {},
        distanceRanges: {},
        networkDensity: 0,
      })
      return
    }

    // Calculate average distance from central hub
    const totalDistance = locations.reduce((sum, loc) => sum + loc.distanceFromCentralHub, 0)
    const averageDistance = Math.round(totalDistance / locations.length)

    // Calculate service distribution
    const serviceDistribution = {}
    services.forEach((service) => {
      const count = locations.filter((loc) => loc.serviceName._id === service._id).length
      serviceDistribution[service.name] = count
    })

    // Calculate distance ranges
    const distanceRanges = {
      "0-500m": 0,
      "500m-1km": 0,
      "1-2km": 0,
      "2km+": 0,
    }

    locations.forEach((loc) => {
      const distance = loc.distanceFromCentralHub
      if (distance <= 500) distanceRanges["0-500m"]++
      else if (distance <= 1000) distanceRanges["500m-1km"]++
      else if (distance <= 2000) distanceRanges["1-2km"]++
      else distanceRanges["2km+"]++
    })

    // Calculate network density (locations per square km - simplified)
    const maxDistance = Math.max(...locations.map((loc) => loc.distanceFromCentralHub))
    const coverageArea = Math.PI * Math.pow(maxDistance / 1000, 2) // Area in km²
    const networkDensity = coverageArea > 0 ? (locations.length / coverageArea).toFixed(2) : 0

    setAnalytics({
      totalCoverage: Math.round(maxDistance),
      averageDistance,
      serviceDistribution,
      distanceRanges,
      networkDensity: Number.parseFloat(networkDensity),
    })
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Network Analytics</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #9b59b6, #8e44ad)",
            color: "white",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h4 style={{ margin: "0 0 5px 0", fontSize: "20px" }}>{analytics.totalCoverage}m</h4>
          <p style={{ margin: 0, fontSize: "12px" }}>Max Coverage Radius</p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #f39c12, #e67e22)",
            color: "white",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h4 style={{ margin: "0 0 5px 0", fontSize: "20px" }}>{analytics.averageDistance}m</h4>
          <p style={{ margin: 0, fontSize: "12px" }}>Average Distance</p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #1abc9c, #16a085)",
            color: "white",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h4 style={{ margin: "0 0 5px 0", fontSize: "20px" }}>{analytics.networkDensity}</h4>
          <p style={{ margin: 0, fontSize: "12px" }}>Locations/km²</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
        <div>
          <h4 style={{ marginBottom: "15px", color: "#2c3e50" }}>Service Distribution</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(analytics.serviceDistribution).map(([service, count]) => (
              <div key={service} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ minWidth: "100px", fontSize: "14px" }}>{service}:</div>
                <div
                  style={{
                    flex: 1,
                    height: "20px",
                    background: "#e9ecef",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #3498db, #2980b9)",
                      width: `${locations.length > 0 ? (count / locations.length) * 100 : 0}%`,
                      borderRadius: "10px",
                    }}
                  />
                </div>
                <div style={{ minWidth: "30px", fontSize: "14px", fontWeight: "bold" }}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: "15px", color: "#2c3e50" }}>Distance Distribution</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(analytics.distanceRanges).map(([range, count]) => (
              <div key={range} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ minWidth: "80px", fontSize: "14px" }}>{range}:</div>
                <div
                  style={{
                    flex: 1,
                    height: "20px",
                    background: "#e9ecef",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #27ae60, #229954)",
                      width: `${locations.length > 0 ? (count / locations.length) * 100 : 0}%`,
                      borderRadius: "10px",
                    }}
                  />
                </div>
                <div style={{ minWidth: "30px", fontSize: "14px", fontWeight: "bold" }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NetworkAnalytics
