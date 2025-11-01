"use client"

import { useState } from "react"

const NetworkExport = ({ locations, services, serviceTypes }) => {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = () => {
    const headers = [
      "Service Name",
      "Service Type",
      "Service Type Icon",
      "Latitude",
      "Longitude",
      "Distance from Hub (m)",
      "Notes",
      "Created Date",
    ]

    const csvData = locations.map((location) => [
      location.serviceName?.name || "N/A",
      location.serviceType?.name || "N/A",
      location.serviceType?.icon || "",
      location.coordinates.latitude,
      location.coordinates.longitude,
      location.distanceFromCentralHub,
      location.notes || "",
      new Date(location.createdAt).toLocaleDateString(),
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `network-locations-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      centralHub: {
        latitude: 10.98101,
        longitude: 76.9668453,
      },
      services: services.map((service) => ({
        id: service._id,
        name: service.name,
        image: service.image,
      })),
      serviceTypes: serviceTypes.map((type) => ({
        id: type._id,
        name: type.name,
        icon: type.icon,
        color: type.colorForMarking,
        serviceId: type.service._id,
      })),
      locations: locations.map((location) => ({
        id: location._id,
        serviceName: location.serviceName?.name,
        serviceType: location.serviceType?.name,
        coordinates: location.coordinates,
        distanceFromHub: location.distanceFromCentralHub,
        notes: location.notes,
        createdAt: location.createdAt,
      })),
      statistics: {
        totalLocations: locations.length,
        totalServices: services.length,
        totalServiceTypes: serviceTypes.length,
      },
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `network-data-${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateReport = async () => {
    setExporting(true)

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const reportData = {
      title: "Cable Network Management Report",
      generatedDate: new Date().toLocaleDateString(),
      summary: {
        totalLocations: locations.length,
        totalServices: services.length,
        totalServiceTypes: serviceTypes.length,
        averageDistance: Math.round(
          locations.reduce((sum, loc) => sum + loc.distanceFromCentralHub, 0) / locations.length || 0,
        ),
        maxDistance: Math.max(...locations.map((loc) => loc.distanceFromCentralHub), 0),
      },
      serviceBreakdown: services.map((service) => ({
        name: service.name,
        locationCount: locations.filter((loc) => loc.serviceName._id === service._id).length,
      })),
      distanceAnalysis: {
        "0-500m": locations.filter((loc) => loc.distanceFromCentralHub <= 500).length,
        "500m-1km": locations.filter((loc) => loc.distanceFromCentralHub > 500 && loc.distanceFromCentralHub <= 1000)
          .length,
        "1-2km": locations.filter((loc) => loc.distanceFromCentralHub > 1000 && loc.distanceFromCentralHub <= 2000)
          .length,
        "2km+": locations.filter((loc) => loc.distanceFromCentralHub > 2000).length,
      },
    }

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportData.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportData.title}</h1>
          <p>Generated on: ${reportData.generatedDate}</p>
        </div>
        
        <div class="section">
          <h2>Network Summary</h2>
          <div class="stats">
            <div class="stat-card">
              <h3>${reportData.summary.totalLocations}</h3>
              <p>Total Locations</p>
            </div>
            <div class="stat-card">
              <h3>${reportData.summary.averageDistance}m</h3>
              <p>Average Distance</p>
            </div>
            <div class="stat-card">
              <h3>${reportData.summary.maxDistance}m</h3>
              <p>Max Distance</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Service Breakdown</h2>
          <table>
            <thead>
              <tr><th>Service</th><th>Location Count</th></tr>
            </thead>
            <tbody>
              ${reportData.serviceBreakdown.map((service) => `<tr><td>${service.name}</td><td>${service.locationCount}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Distance Analysis</h2>
          <table>
            <thead>
              <tr><th>Distance Range</th><th>Location Count</th></tr>
            </thead>
            <tbody>
              ${Object.entries(reportData.distanceAnalysis)
                .map(([range, count]) => `<tr><td>${range}</td><td>${count}</td></tr>`)
                .join("")}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([reportHtml], { type: "text/html" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `network-report-${new Date().toISOString().split("T")[0]}.html`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setExporting(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Export & Reports</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
        <button className="btn btn-primary" onClick={exportToCSV}>
          📊 Export CSV
        </button>
        <button className="btn btn-success" onClick={exportToJSON}>
          📄 Export JSON
        </button>
        <button className="btn btn-secondary" onClick={generateReport} disabled={exporting}>
          {exporting ? "Generating..." : "📋 Generate Report"}
        </button>
      </div>

      <div style={{ marginTop: "15px", fontSize: "12px", color: "#666" }}>
        <p style={{ margin: 0 }}>
          • CSV: Spreadsheet format for data analysis
          <br />• JSON: Complete data backup with structure
          <br />• Report: Formatted HTML report with analytics
        </p>
      </div>
    </div>
  )
}

export default NetworkExport
