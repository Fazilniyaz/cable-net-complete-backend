"use client";

import { useEffect, useRef, useState } from "react";
import { OlaMaps } from "olamaps-web-sdk";

const OLAMap = ({ locations = [], onMapClick, selectedServiceType = "" }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [clickedCoordinates, setClickedCoordinates] = useState(null);

  // Central hub coordinates
  const CENTRAL_HUB = {
    lat: 10.981156,
    lng: 76.964189,
  };

  const olaMaps = new OlaMaps({
    apiKey: "Q6C37NcZ0KHYAyq6WEpo4dXOKSAg1OuCf5X34TPE",
  });

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) return;

      const map = olaMaps.init({
        style:
          "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: mapRef.current,
        center: [CENTRAL_HUB.lng, CENTRAL_HUB.lat],
        zoom: 15,
      });

      mapInstanceRef.current = map;

      // All map-modifying logic must go inside this 'load' event handler
      map.on("load", () => {
        console.log("Map style loaded. Proceeding to add markers and layers.");
        addCentralHubMarker();
        updateMarkers();

        // Handle map clicks for adding new locations
        map.on("click", (e) => {
          const { lng, lat } = e.lngLat;
          setClickedCoordinates({ latitude: lat, longitude: lng });
          if (onMapClick) {
            onMapClick({ latitude: lat, longitude: lng });
          }
        });
      });
    };

    // The SDK is already imported, so we don't need to load it via a script tag.
    // We can call initializeMap directly.
    initializeMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run this effect only once on component mount

  useEffect(() => {
    // Only call updateMarkers if the map instance is ready and the style is loaded
    if (mapInstanceRef.current && mapInstanceRef.current.isStyleLoaded()) {
      updateMarkers();
    }
  }, [locations, selectedServiceType]);

  const addCentralHubMarker = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const hubElement = document.createElement("div");
    hubElement.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
      ">🏢</div>
    `;

    const hubMarker = new window.OlaMaps.Marker({
      element: hubElement,
    })
      .setLngLat([CENTRAL_HUB.lng, CENTRAL_HUB.lat])
      .addTo(map);

    const hubPopup = new window.OlaMaps.Popup({
      offset: 25,
      closeButton: false,
    }).setHTML(`
      <div style="padding: 10px; text-align: center;">
        <h4 style="margin: 0 0 5px 0; color: #2c3e50;">Central Hub</h4>
        <p style="margin: 0; font-size: 12px; color: #666;">
          Main Network Center<br/>
          Lat: ${CENTRAL_HUB.lat}<br/>
          Lng: ${CENTRAL_HUB.lng}
        </p>
      </div>
    `);

    hubMarker.setPopup(hubPopup);
  };

  const updateMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) {
      console.log("Map not ready for updating markers.");
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const filteredLocations = selectedServiceType
      ? locations.filter(
          (location) => location.serviceType._id === selectedServiceType
        )
      : locations;

    filteredLocations.forEach((location) => {
      const markerElement = document.createElement("div");
      markerElement.innerHTML = `
        <div style="
          background: ${location.serviceType?.colorForMarking || "#3498db"};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
          ${location.serviceType?.icon || "📍"}
        </div>
      `;

      const marker = new window.OlaMaps.Marker({
        element: markerElement,
      })
        .setLngLat([
          location.coordinates.longitude,
          location.coordinates.latitude,
        ])
        .addTo(map);

      const popup = new window.OlaMaps.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(`
        <div style="padding: 12px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #2c3e50; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${
              location.serviceType?.icon || "📍"
            }</span>
            ${location.serviceType?.name || "Unknown Type"}
          </h4>
          <p style="margin: 0 0 6px 0; font-weight: 500; color: #27ae60;">
            Service: ${location.serviceName?.name || "Unknown Service"}
          </p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;">
            Distance from Hub: <strong>${
              location.distanceFromCentralHub
            }m</strong>
          </p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;">
            Coordinates: ${location.coordinates.latitude.toFixed(
              6
            )}, ${location.coordinates.longitude.toFixed(6)}
          </p>
          ${
            location.notes
              ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #555; font-style: italic;">${location.notes}</p>`
              : ""
          }
        </div>
      `);

      marker.setPopup(popup);
      markersRef.current.push(marker);
      drawConnectionLine(location);
    });
  };

  const drawConnectionLine = (location) => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const lineId = `line-${location._id}`;

    if (map.getLayer(lineId)) {
      map.removeLayer(lineId);
      map.removeSource(lineId);
    }

    map.addSource(lineId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [CENTRAL_HUB.lng, CENTRAL_HUB.lat],
            [location.coordinates.longitude, location.coordinates.latitude],
          ],
        },
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: lineId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": location.serviceType?.colorForMarking || "#3498db",
        "line-width": 3,
        "line-opacity": 0.7,
      },
    });
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "500px" }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />

      {/* Map Controls and Legend - no changes needed here */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "white",
          borderRadius: "6px",
          padding: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <div style={{ marginBottom: "4px" }}>🏢 Central Hub</div>
        <div>📍 Click to add location</div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          background: "white",
          borderRadius: "6px",
          padding: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          maxWidth: "200px",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#2c3e50" }}>
          Legend
        </h4>
        <div style={{ fontSize: "12px", color: "#666" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#e74c3c",
                borderRadius: "50%",
              }}
            ></div>
            Central Hub
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#3498db",
                borderRadius: "50%",
              }}
            ></div>
            Network Locations
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{ width: "12px", height: "2px", background: "#3498db" }}
            ></div>
            Connection Lines
          </div>
        </div>
      </div>
    </div>
  );
};

export default OLAMap;
