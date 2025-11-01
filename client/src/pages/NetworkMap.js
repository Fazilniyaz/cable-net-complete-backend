"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import AddLocationModal from "../components/AddLocationModal";
import NetworkAnalytics from "../components/NetworkAnalytics";
import AdvancedFilters from "../components/AdvancedFilters";
import NetworkExport from "../components/NetworkExport";
import { CENTRAL_HUB, useMap } from "../components/Map/MapProvider";
import polyline from "polyline";
import { SearchBox } from "../components/Map/AutoComplete";
import MapContainer from "../components/Map/MapContainer";
import { useMemo } from "react";
import useUserStore from "../store/adminStore";
import Swal from "sweetalert2";
import * as turf from "@turf/turf";

const NetworkMap = () => {
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickedCoordinates, setClickedCoordinates] = useState(null);
  const [success, setSuccess] = useState("");
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [mapServiceTypeFilter, setMapServiceTypeFilter] = useState("");
  const [showRoutes, setShowRoutes] = useState(true); // 👈 Route visibility state
  const { map, olaMaps } = useMap();
  const { user, setUser } = useUserStore();

  const mapRef = useRef(null);
  const olaMapsRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    if (map) mapRef.current = map;
  }, [map]);

  useEffect(() => {
    if (olaMaps) olaMapsRef.current = olaMaps;
  }, [olaMaps]);

  useEffect(() => {
    if (user) {
      console.log("The geojson : ", user.geojson);
      userRef.current = user;
    }
  }, [user]);

  const isMapLoaded = useRef(false);
  const cleanupScheduled = useRef(false);

  const EARTH_RADIUS = 6378137;

  // drawCable function
  const drawCable = useCallback((location, onCancel, onSave) => {
    const map = mapRef.current;
    const olaMaps = olaMapsRef.current;
    const user = userRef.current;

    if (!map || !olaMaps || !isMapLoaded.current) {
      console.log("Returning:", map, olaMaps, isMapLoaded);
      return;
    }
    try {
      const geojson = user.geojson;
      console.log("MakeCable coordinate : ", location);

      const idx = geojson.features.findIndex(
        (el) =>
          el.coordinates?.latitude === location.coordinates?.latitude &&
          el.coordinates?.longitude === location.coordinates?.longitude
      );

      const routeCoords = geojson.features[idx].geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

      const line = turf.lineString(geojson.features[idx].geometry.coordinates);
      const length = turf.length(line, { units: "meters" });
      console.log("Route length:", length, "ms");

      // Store markers in case you want to remove later
      const interval = 1;
      const markers = [];
      const updatedGeoJSON = structuredClone(geojson);

      routeCoords.forEach((coord, index) => {
        if (index % interval !== 0) return;

        const markerEl = document.createElement("div");
        markerEl.className =
          "w-5 h-5 rounded-full bg-red-400 border-2 border-white cursor-grab z-50";

        const marker = olaMaps
          .addMarker({ element: markerEl, anchor: "center", draggable: true })
          .setLngLat([Number(coord[1]), Number(coord[0])])
          .addTo(map);

        marker.on("drag", (event) => {
          const { lat, lng } = event.target._lngLat;
          routeCoords[index] = [lat, lng];

          // // Update only this feature's coordinates
          updatedGeoJSON.features[idx].geometry.coordinates = routeCoords.map(
            ([lat, lng]) => [lng, lat]
          );
          map.getSource("routes").setData(updatedGeoJSON); // redraw
        });

        markers.push(marker);
      });

      // ✅ Attach cancel/save handlers
      if (onCancel) {
        onCancel(async () => {
          const result = await Swal.fire({
            title: "Discard changes?",
            text: "Your unsaved cable edits will be lost.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, discard",
            cancelButtonText: "No, keep editing",
            confirmButtonColor: "#e74c3c",
            cancelButtonColor: "#2ecc71",
          });

          if (result.isConfirmed) {
            // 🗑️ Remove all draggable markers
            markers.forEach((m) => m.remove());

            // 🔄 Restore original GeoJSON data (no edits)
            map.getSource("routes").setData(geojson);

            Swal.fire({
              title: "Changes discarded",
              text: "Your route has been restored to its original shape.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });

            console.log("Cable drawing cancelled and reverted");
          }
        });
      }

      if (onSave) {
        onSave(async () => {
          const geojsonResponse = await axios.put(
            `/api/admin/${user.id}/geojson`,
            {
              geojson: updatedGeoJSON,
            }
          );
          if (geojsonResponse.status === 200) {
            alert("Cable saved successfully ✅:", geojson);
            markers.forEach((m) => m.remove());
            const updateUser = geojsonResponse.data.user;
            setUser(updateUser);
            localStorage.setItem("auth", JSON.stringify(updateUser));
            // Add or update source
            if (!map.getSource("routes")) {
              map.addSource("routes", {
                type: "geojson",
                data: updatedGeoJSON,
              });
            } else {
              map.getSource("routes").setData(updatedGeoJSON);
            }
          }
        });
      }
    } catch (error) {
      console.log("Error While Custom Route : ", error);
    }
  }, []);

  const createLocationMarkerElement = useCallback((location) => {
    const el = document.createElement("div");
    el.className =
      "w-10 h-10 flex items-center justify-center rounded-full shadow-lg border border-gray-300 bg-white hover:scale-110 transition-transform duration-200 cursor-pointer";

    const span = document.createElement("span");
    span.className = "text-xl";
    span.innerText = location.serviceType?.icon || "📍";
    el.appendChild(span);

    const popupDiv = document.createElement("div");
    popupDiv.className =
      "location-popup hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white p-3 rounded shadow-lg border z-10 w-64";
    // ${
    //   location.image
    //     ? `<img src="${location.image}" alt="Location" class="w-full h-32 object-cover rounded mb-2" />`
    //     : ""
    // }
    // ${
    //   location.image2
    //     ? `<img src="${location.image2}" alt="Location" class="w-full h-32 object-cover rounded mb-2" />`
    //     : ""
    // }
    popupDiv.innerHTML = `
  <div class="max-w-xs bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
    <!-- Header with gradient background -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-700 p-4 text-white">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-bold text-lg truncate">${
            location.serviceName?.name || "Unknown Service"
          }</h3>
          <div class="flex items-center mt-1">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A1 1 0 013 10V3a1 1 0 011-1h7a1 1 0 011 1v7z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm font-medium">${
              location.serviceType?.name || "Unknown Type"
            }</span>
          </div>
        </div>
        <div class="bg-white bg-opacity-20 rounded-full p-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="p-4">
      <!-- Coordinates in elegant format -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="flex items-center text-xs text-gray-500 mb-1">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            LATITUDE
          </div>
          <div class="font-mono text-sm font-semibold text-gray-800">
            ${location.coordinates?.latitude?.toFixed(6) || "N/A"}
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="flex items-center text-xs text-gray-500 mb-1">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            LONGITUDE
          </div>
          <div class="font-mono text-sm font-semibold text-gray-800">
            ${location.coordinates?.longitude?.toFixed(6) || "N/A"}
          </div>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="space-y-3">
        <!-- Distance Card -->
        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div class="flex items-center">
            <div class="bg-blue-100 p-2 rounded-lg mr-3">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div>
              <div class="text-xs text-gray-500">DISTANCE FROM HUB</div>
              <div class="font-semibold text-gray-800">${
                location.distanceFromCentralHub || 0
              }m</div>
            </div>
          </div>
        </div>

        <!-- Notes Section (if available) -->
        ${
          location.notes
            ? `
          <div class="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <div class="flex items-start">
              <div class="bg-amber-100 p-2 rounded-lg mr-3 mt-0.5">
                <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="text-xs text-amber-600 font-medium mb-1">NOTES</div>
                <div class="text-sm text-gray-700 leading-relaxed">${location.notes}</div>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- Timestamp -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
          <div class="flex items-center text-gray-500">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-xs">Last Updated</span>
          </div>
          <div class="text-xs text-gray-600 font-medium">
            ${new Date(location.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>

   
`;

    function createImageModal(images) {
      // Create modal overlay
      const modalOverlay = document.createElement("div");
      modalOverlay.className =
        "fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4";
      modalOverlay.style.backdropFilter = "blur(5px)";

      // Create modal container
      const modalContainer = document.createElement("div");
      modalContainer.className =
        "bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col";

      // Create header with close button
      const modalHeader = document.createElement("div");
      modalHeader.className =
        "flex justify-between items-center p-6 border-b border-gray-200";

      const modalTitle = document.createElement("h2");
      modalTitle.className = "text-2xl font-bold text-gray-800";
      modalTitle.textContent = "All Images";

      const closeButton = document.createElement("button");
      closeButton.innerHTML = `
        <svg class="w-6 h-6 text-gray-500 hover:text-gray-700 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
    `;
      closeButton.className = "p-2 hover:bg-gray-100 rounded-full transition";

      // Create image container
      const imageContainer = document.createElement("div");
      imageContainer.className = "flex-1 overflow-y-auto p-6";

      // Create images grid
      const imagesGrid = document.createElement("div");
      imagesGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-6";

      // Add images to grid
      images.forEach((imgSrc, index) => {
        const imageWrapper = document.createElement("div");
        imageWrapper.className =
          "group relative overflow-hidden rounded-xl bg-gray-100";

        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = `Location image ${index + 1}`;
        img.className =
          "w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105";
        img.loading = "lazy";

        imageWrapper.appendChild(img);
        imagesGrid.appendChild(imageWrapper);
      });

      // Assemble the modal
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(closeButton);
      imageContainer.appendChild(imagesGrid);
      modalContainer.appendChild(modalHeader);
      modalContainer.appendChild(imageContainer);
      modalOverlay.appendChild(modalContainer);

      // Add to document
      document.body.appendChild(modalOverlay);
      document.body.style.overflow = "hidden";

      // Close functionality
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          closeModal();
        }
      };

      const closeModal = () => {
        document.body.removeChild(modalOverlay);
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };

      closeButton.addEventListener("click", closeModal);

      // Close on overlay click (outside modal)
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          closeModal();
        }
      });

      // Close on Escape key
      document.addEventListener("keydown", handleEscape);
    }

    // 👉 Buttons container
    const btnContainer = document.createElement("div");
    btnContainer.className = "flex gap-2 mt-3";

    const viewImages = document.createElement("button");
    viewImages.innerText = "View All Images";
    viewImages.className =
      "px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition";
    btnContainer.appendChild(viewImages);

    // Make Cable button
    const makeBtn = document.createElement("button");
    makeBtn.innerText = "Make Cable";
    makeBtn.className =
      "px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition";
    btnContainer.appendChild(makeBtn);

    // Save button (hidden initially)
    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Save";
    saveBtn.className =
      "px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition hidden";
    btnContainer.appendChild(saveBtn);

    // Cancel button (hidden initially)
    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Cancel";
    cancelBtn.className =
      "px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition hidden";
    btnContainer.appendChild(cancelBtn);

    popupDiv.appendChild(btnContainer);
    el.appendChild(popupDiv);

    // 🧠 Handlers
    let cancelHandler = null;
    let saveHandler = null;

    // Add click event to the button
    viewImages.addEventListener("click", function () {
      // Get the images from your location object
      const images = [];
      if (location.image) images.push(location.image);
      if (location.image2) images.push(location.image2);

      if (images.length === 0) {
        alert("No images available");
        return;
      }

      createImageModal(images);
    });

    makeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      drawCable(
        location,
        (cancelCb) => (cancelHandler = cancelCb),
        (saveCb) => (saveHandler = saveCb)
      );

      makeBtn.classList.add("hidden");
      saveBtn.classList.remove("hidden");
      cancelBtn.classList.remove("hidden");
    });

    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      cancelHandler?.();
      makeBtn.classList.remove("hidden");
      saveBtn.classList.add("hidden");
      cancelBtn.classList.add("hidden");
    });

    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      saveHandler?.();
      makeBtn.classList.remove("hidden");
      saveBtn.classList.add("hidden");
      cancelBtn.classList.add("hidden");
    });

    // ✅ Only show/hide on click
    el.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent map click from interfering

      const isHidden = popupDiv.classList.contains("hidden");
      document
        .querySelectorAll(".location-popup")
        .forEach((p) => p.classList.add("hidden")); // close others

      if (isHidden) {
        popupDiv.classList.remove("hidden");
        setHoveredLocation(location);
      } else {
        popupDiv.classList.add("hidden");
        setHoveredLocation(null);
      }
    });

    return el;
  }, []);

  const locationsForMap = useMemo(() => {
    if (!mapServiceTypeFilter) return filteredLocations;
    return filteredLocations.filter(
      (loc) => loc.serviceType?._id === mapServiceTypeFilter
    );
  }, [filteredLocations, mapServiceTypeFilter]);

  const calculateDestinationPoint = useCallback(
    (lat, lng, distance, bearing) => {
      const latRad = (lat * Math.PI) / 180;
      const lngRad = (lng * Math.PI) / 180;
      const bearingRad = (bearing * Math.PI) / 180;

      const angularDistance = distance / EARTH_RADIUS;

      const lat2 = Math.asin(
        Math.sin(latRad) * Math.cos(angularDistance) +
          Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
      );

      const lng2 =
        lngRad +
        Math.atan2(
          Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
          Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2)
        );

      return {
        lat: (lat2 * 180) / Math.PI,
        lng: (lng2 * 180) / Math.PI,
      };
    },
    []
  );

  const createCircleCoordinates = useCallback(
    (centerLat, centerLng, radius) => {
      const points = [];
      const numPoints = 64;

      for (let i = 0; i <= numPoints; i++) {
        const bearing = (i * 360) / numPoints;
        const point = calculateDestinationPoint(
          centerLat,
          centerLng,
          radius,
          bearing
        );
        points.push([point.lng, point.lat]);
      }

      return points;
    },
    [calculateDestinationPoint]
  );

  const safeRemoveLayer = useCallback((mapInstance, layerId) => {
    if (mapInstance && mapInstance.getLayer && mapInstance.getLayer(layerId)) {
      mapInstance.removeLayer(layerId);
    }
  }, []);

  const safeRemoveSource = useCallback((mapInstance, sourceId) => {
    if (
      mapInstance &&
      mapInstance.getSource &&
      mapInstance.getSource(sourceId)
    ) {
      mapInstance.removeSource(sourceId);
    }
  }, []);

  const drawRadiusCircles = useCallback(
    (maxDistance = 1000, interval = 100) => {
      if (!map || !isMapLoaded.current) return;

      try {
        safeRemoveLayer(map, "radius-circles-layer");
        safeRemoveLayer(map, "radius-circles-labels");
        safeRemoveSource(map, "radius-circles");

        const numCircles = Math.ceil(maxDistance / interval);
        const circleFeatures = [];

        for (let i = 1; i <= numCircles; i++) {
          const radius = i * interval;
          const coordinates = createCircleCoordinates(
            parseFloat(CENTRAL_HUB.lat),
            parseFloat(CENTRAL_HUB.lng),
            radius
          );

          circleFeatures.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
            properties: {
              radius: radius,
              opacity: Math.max(0.2, 1 - i * 0.1),
              color: `rgba(52, 152, 219, ${Math.max(0.2, 1 - i * 0.1)})`,
            },
          });

          if (radius % 200 === 0 || radius === interval) {
            circleFeatures.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [
                  calculateDestinationPoint(
                    parseFloat(CENTRAL_HUB.lat),
                    parseFloat(CENTRAL_HUB.lng),
                    radius,
                    0
                  ).lng,
                  calculateDestinationPoint(
                    parseFloat(CENTRAL_HUB.lat),
                    parseFloat(CENTRAL_HUB.lng),
                    radius,
                    0
                  ).lat,
                ],
              },
              properties: {
                radius: radius,
                type: "label",
                label: `${radius}m`,
                color: `rgba(52, 152, 219, ${Math.max(0.4, 1 - i * 0.1)})`,
              },
            });
          }
        }

        map.addSource("radius-circles", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: circleFeatures,
          },
        });

        map.addLayer({
          id: "radius-circles-layer",
          type: "line",
          source: "radius-circles",
          filter: ["!=", "type", "label"],
          paint: {
            "line-color": ["get", "color"],
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });

        map.addLayer({
          id: "radius-circles-labels",
          type: "symbol",
          source: "radius-circles",
          filter: ["==", "type", "label"],
          layout: {
            "text-field": ["get", "label"],
            "text-size": 12,
            "text-anchor": "left",
            "text-offset": [0.5, 0],
          },
          paint: {
            "text-color": ["get", "color"],
            "text-halo-color": "white",
            "text-halo-width": 1,
          },
        });
      } catch (error) {
        console.log("Error drawing radius circles:", error);
      }
    },
    [
      map,
      createCircleCoordinates,
      calculateDestinationPoint,
      safeRemoveLayer,
      safeRemoveSource,
    ]
  );

  const buildRoutesGeoJSON = useCallback((elements) => {
    return {
      type: "FeatureCollection",
      features: elements.map((conn, index) => {
        const decoded = polyline
          .decode(conn.polyline)
          .map(([lat, lng]) => [lng, lat]);

        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: decoded,
          },
          properties: {
            color: conn.serviceType?.colorForMarking || "#3498db",
            id: index,
          },
          coordinates: conn.location,
        };
      }),
    };
  }, []);

  const renderConnections = useCallback(
    async (connections) => {
      if (!map || !olaMaps || !isMapLoaded.current) return;

      try {
        const mapContainer = map.getContainer();
        const existingMarkers =
          mapContainer.querySelectorAll(".location-marker");
        existingMarkers.forEach((marker) => {
          if (marker.parentNode) {
            marker.parentNode.removeChild(marker);
          }
        });

        // Always clean up route layer and source
        safeRemoveLayer(map, "routes-layer");
        safeRemoveSource(map, "routes");

        // Add markers
        for (let conn of connections) {
          const markerElement = createLocationMarkerElement(conn);
          markerElement.classList.add("location-marker");
          olaMaps
            .addMarker({ element: markerElement, anchor: "center" })
            .setLngLat([
              Number(conn.coordinates.longitude),
              Number(conn.coordinates.latitude),
            ])
            .addTo(map);
        }
        if (user.geojson && user.geojson !== "null") {
          // Add or update source
          const geojson = user.geojson;
          if (!map.getSource("routes")) {
            map.addSource("routes", { type: "geojson", data: geojson });
          } else {
            map.getSource("routes").setData(geojson);
          }
        } else {
          if (connections.length > 0) {
            const locationString = connections
              .map(
                (conn) =>
                  `${conn.coordinates.latitude}%2C${conn.coordinates.longitude}`
              )
              .join("%7C");

            console.log("The Geojson Routing Api is calling ..");

            const response = await fetch(
              `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${CENTRAL_HUB.lat}%2C${CENTRAL_HUB.lng}&destinations=${locationString}&api_key=dxEuToWnHB5W4e4lcqiFwu2RwKA64Ixi0BFR73kQ`,
              {
                method: "GET",
                headers: { "X-Request-Id": "XXX" },
              }
            );

            const data = await response.json();
            const elements = data.rows[0].elements;
            const convertedElementsVal = elements.map((el, index) => ({
              distance: el.distance,
              duration: `${Math.floor(el.duration / 3600)} hrs ${Math.floor(
                (el.duration % 3600) / 60
              )} min`,
              polyline: el.polyline,
              service: connections[index]?.serviceName,
              serviceType: connections[index]?.serviceType,
              createdAt: connections[index]?.createdAt,
              distanceFromCentralHub:
                connections[index]?.distanceFromCentralHub,
              image: connections[index]?.image,
              notes: connections[index]?.notes,
              location: connections[index]?.coordinates || "N/A",
            }));

            const geojson = buildRoutesGeoJSON(convertedElementsVal);
            const geojsonResponse = await axios.put(
              `/api/admin/${user.id}/geojson`,
              {
                geojson,
              }
            );
            if (geojsonResponse.status === 200) {
              const updateUser = geojsonResponse.data.user;
              setUser(updateUser);
              localStorage.setItem("auth", JSON.stringify(updateUser));
              // Add or update source
              if (!map.getSource("routes")) {
                map.addSource("routes", { type: "geojson", data: geojson });
              } else {
                map.getSource("routes").setData(geojson);
              }
            }
          }
        }

        // 👇 Only add layer if routes should be visible
        if (showRoutes) {
          if (!map.getLayer("routes-layer")) {
            map.addLayer({
              id: "routes-layer",
              type: "line",
              source: "routes",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-width": 4,
                "line-color": ["get", "color"],
              },
            });
          }
        }

        const maxDistance =
          connections.length > 0
            ? Math.max(
                ...connections.map((conn) => conn.distanceFromCentralHub || 0)
              )
            : 1000;

        const circleMaxDistance = Math.max(
          500,
          Math.ceil(maxDistance / 100) * 100 + 100
        );
        drawRadiusCircles(circleMaxDistance, 100);
      } catch (error) {
        console.log("Error in renderConnections:", error);
      }
    },
    [
      map,
      olaMaps,
      createLocationMarkerElement,
      drawRadiusCircles,
      buildRoutesGeoJSON,
      safeRemoveLayer,
      safeRemoveSource,
      showRoutes,
    ]
  );

  // 👇 Toggle function to show/hide routes
  const toggleRoutes = useCallback(() => {
    if (!map || !isMapLoaded.current) return;

    if (showRoutes) {
      // Hide routes
      safeRemoveLayer(map, "routes-layer");
    } else {
      // Show routes (re-add layer if source exists)
      if (map.getSource("routes") && !map.getLayer("routes-layer")) {
        map.addLayer({
          id: "routes-layer",
          type: "line",
          source: "routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-width": 4,
            "line-color": ["get", "color"],
          },
        });
      }
    }
    setShowRoutes(!showRoutes);
  }, [map, showRoutes, safeRemoveLayer]);

  useEffect(() => {
    if (!map || !olaMaps) return;

    const handleMapLoad = () => {
      isMapLoaded.current = true;

      const handleClick = (e) => {
        const { lng, lat } = e.lngLat;
        handleMapClick({ longitude: lng, latitude: lat });
      };

      map.on("click", handleClick);

      map.flyTo({
        center: [parseFloat(CENTRAL_HUB.lng), parseFloat(CENTRAL_HUB.lat)],
        zoom: 14,
        duration: 1000,
      });

      fetchData();

      return () => {
        cleanupScheduled.current = true;
        map.off("click", handleClick);
        safeRemoveLayer(map, "radius-circles-layer");
        safeRemoveLayer(map, "radius-circles-labels");
        safeRemoveLayer(map, "routes-layer");
        safeRemoveSource(map, "radius-circles");
        safeRemoveSource(map, "routes");
      };
    };

    if (map.isStyleLoaded()) {
      const cleanup = handleMapLoad();
      return cleanup;
    } else {
      const handleStyleLoad = () => {
        map.off("styledata", handleStyleLoad);
        const cleanup = handleMapLoad();
        return () => {
          if (cleanup) cleanup();
        };
      };

      map.on("styledata", handleStyleLoad);

      return () => {
        map.off("styledata", handleStyleLoad);
        cleanupScheduled.current = true;
      };
    }
  }, [map, olaMaps, safeRemoveLayer, safeRemoveSource]);

  useEffect(() => {
    setFilteredLocations(allLocations);
  }, [allLocations]);

  useEffect(() => {
    if (map && olaMaps && isMapLoaded.current && locationsForMap.length >= 0) {
      renderConnections(locationsForMap);
    }
  }, [locationsForMap, map, olaMaps, renderConnections]);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const fetchData = async () => {
    try {
      const [locationsRes, servicesRes, serviceTypesRes] = await Promise.all([
        axios.get("/api/locations"),
        axios.get("/api/services"),
        axios.get("/api/service-types"),
      ]);

      const fixedLocations = locationsRes.data.map((loc) => {
        if (loc.image && loc.image.startsWith("/uploads")) {
          return {
            ...loc,
            image: `${API_BASE_URL}${loc.image}`,
          };
        }
        return loc;
      });

      setAllLocations(fixedLocations);
      setServices(servicesRes.data);
      setServiceTypes(serviceTypesRes.data);

      setTimeout(() => {
        if (map && olaMaps && isMapLoaded.current) {
          renderConnections(fixedLocations);
        }
      }, 100);
    } catch (error) {
      console.log("Error fetching data:", error);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (filters) => {
    try {
      let filtered = [...allLocations];

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (location) =>
            location.notes?.toLowerCase().includes(searchTerm) ||
            location.serviceName?.name?.toLowerCase().includes(searchTerm) ||
            location.serviceType?.name?.toLowerCase().includes(searchTerm) ||
            location.coordinates.latitude.toString().includes(searchTerm) ||
            location.coordinates.longitude.toString().includes(searchTerm)
        );
      }

      if (filters.service.length > 0) {
        filtered = filtered.filter((location) =>
          filters.service.includes(location.serviceName._id)
        );
      }

      if (filters.serviceType.length > 0) {
        filtered = filtered.filter((location) =>
          filters.serviceType.includes(location.serviceType._id)
        );
      }

      if (filters.distanceRange.length > 0) {
        filtered = filtered.filter((location) => {
          const distance = location.distanceFromCentralHub;
          return filters.distanceRange.some((range) => {
            if (range.includes("+")) {
              const min = Number.parseInt(range.replace("+", ""));
              return distance >= min;
            } else {
              const [min, max] = range.split("-").map(Number);
              return distance >= min && distance < max;
            }
          });
        });
      }

      if (filters.sortBy.length > 0) {
        filters.sortBy.forEach((sortKey) => {
          filtered.sort((a, b) => {
            let aValue, bValue;
            switch (sortKey) {
              case "name":
                aValue = a.serviceName?.name || "";
                bValue = b.serviceName?.name || "";
                break;
              case "type":
                aValue = a.serviceType?.name || "";
                bValue = b.serviceType?.name || "";
                break;
              case "created":
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
                break;
              case "distance":
              default:
                aValue = a.distanceFromCentralHub;
                bValue = b.distanceFromCentralHub;
                break;
            }
            if (filters.sortOrder.includes("desc")) {
              return aValue < bValue ? 1 : -1;
            }
            return aValue > bValue ? 1 : -1;
          });
        });
      }
      const user = userRef.current;
      const geojson = user.geojson;
      const updatedGeoJSON = structuredClone(geojson);
      const features = JSON.parse(
        JSON.stringify(userRef.current.geojson.features)
      );
      const filtered2 = features.filter((f) => f);

      updatedGeoJSON.features = filtered2.filter((feature) => {
        const latitude = feature.coordinates?.latitude;
        const longitude = feature.coordinates?.longitude;
        return filtered.some(
          (conn) =>
            conn.coordinates.latitude === latitude &&
            conn.coordinates.longitude === longitude
        );
      });

      safeRemoveSource();
      safeRemoveLayer();
      map.getSource("routes").setData(updatedGeoJSON); // redraw

      // now updatedGeoJSON only contains the filtered connections
      if (map.getSource("routes")) {
        map.getSource("routes").setData(updatedGeoJSON);
      } else {
        map.addSource("routes", {
          type: "geojson",
          data: updatedGeoJSON,
        });

        map.addLayer({
          id: "routes",
          type: "line",
          source: "routes",
          paint: {
            "line-color": "#007bff",
            "line-width": 3,
          },
        });
      }
      setFilteredLocations(filtered);
    } catch (error) {
      console.log(
        ("Error while Handling the Filtering the Locations : ", error)
      );
    }
  };

  const handleMapClick = (coordinates) => {
    setClickedCoordinates(coordinates);
    setShowAddModal(true);
  };

  // Function to update route data
  const updateRoutes = (updatedGeojson) => {
    if (map && map.getSource("routes")) {
      map.getSource("routes").setData(updatedGeojson);
    } else {
      // if source doesn't exist yet, create it
      map.addSource("routes", {
        type: "geojson",
        data: updatedGeojson,
      });
      map.addLayer({
        id: "routes",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#6BCF7F",
          "line-width": 3,
        },
      });
    }
  };

  const handleLocationCreated = async (newLocation) => {
    try {
      if (newLocation.image && newLocation.image.startsWith("/uploads")) {
        newLocation.image = `${API_BASE_URL}${newLocation.image}`;
      }
      const response = await fetch(
        `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${CENTRAL_HUB.lat}%2C${CENTRAL_HUB.lng}&destinations=${newLocation?.coordinates.latitude}%2C${newLocation?.coordinates.longitude}&api_key=dxEuToWnHB5W4e4lcqiFwu2RwKA64Ixi0BFR73kQ`,
        {
          method: "GET",
          headers: { "X-Request-Id": "XXX" },
        }
      );
      const data = await response.json();
      const elements = data.rows[0].elements;
      const decoded = polyline
        .decode(elements[0].polyline)
        .map(([lat, lng]) => [lng, lat]);
      const addRoute = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: decoded,
        },
        properties: {
          color: newLocation.serviceType?.colorForMarking || "#3498db",
          id: user.geojson ? user.geojson.features.length : 0,
        },
        coordinates: newLocation.coordinates,
      };

      const updatedGeoJSON = { ...user.geojson };
      updatedGeoJSON.features.push(addRoute);

      const geojsonResponse = await axios.put(`/api/admin/${user.id}/geojson`, {
        geojson: updatedGeoJSON,
      });
      if (geojsonResponse.status === 200) {
        alert("Connection created successfully ✅:");
        const updateUser = geojsonResponse.data.user;
        setUser(updateUser);
        localStorage.setItem("auth", JSON.stringify(updateUser));
        console.log("Locaiton Added REs : ", updateUser.geojson);

        const markerElement = createLocationMarkerElement(newLocation);
        markerElement.classList.add("location-marker");
        olaMaps
          .addMarker({ element: markerElement, anchor: "center" })
          .setLngLat([
            Number(newLocation.coordinates.longitude),
            Number(newLocation.coordinates.latitude),
          ])
          .addTo(map);

        setAllLocations((prev) => [...prev, newLocation]);
        setSuccess("Location added successfully!");
        setTimeout(() => {
          if (map && olaMaps && isMapLoaded.current) {
            updateRoutes(updateUser.geojson);
            // renderConnections([...allLocations, newLocation]);
          }
        }, 100);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.log("Error While Creating a Location : ", error);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setClickedCoordinates(null);
  };

  useEffect(() => {
    return () => {
      cleanupScheduled.current = true;
    };
  }, []);

  return (
    <div>
      <div className="relative">
        <MapContainer className="w-full h-[600px]" />

        {/* 👇 Toggle Button - Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleRoutes}
            className={`px-4 py-2 rounded-md text-white font-medium shadow-md transition-colors ${
              showRoutes
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {showRoutes ? "Hide Routes" : "Show Routes"}
          </button>
        </div>

        {/* Left Filters */}
        <div className="absolute top-4 left-0 w-[250px] px-4">
          <AdvancedFilters
            onFiltersChange={handleFiltersChange}
            services={services}
            serviceTypes={serviceTypes}
            locations={filteredLocations}
          />
        </div>

        {/* Center Search */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2">
          <SearchBox />
        </div>
      </div>

      <NetworkAnalytics
        locations={filteredLocations}
        serviceTypes={serviceTypes}
        services={services}
      />

      <NetworkExport
        locations={filteredLocations}
        services={services}
        serviceTypes={serviceTypes}
      />

      <AddLocationModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        coordinates={clickedCoordinates}
        onLocationCreated={handleLocationCreated}
      />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Network Locations ({filteredLocations.length})
          </h3>
        </div>

        {filteredLocations.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Type</th>
                <th>Coordinates</th>
                <th>Distance from Hub</th>
                <th>Notes</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((location) => (
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
                      <span
                        style={{
                          fontSize: "16px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            location.serviceType?.colorForMarking || "#3498db",
                          color: "white",
                        }}
                      >
                        {location.serviceType?.icon}
                      </span>
                      {location.serviceType?.name || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px" }}>
                      <div>Lat: {location.coordinates.latitude.toFixed(6)}</div>
                      <div>
                        Lng: {location.coordinates.longitude.toFixed(6)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: "bold", color: "#2c3e50" }}>
                      {location.distanceFromCentralHub}m
                    </span>
                  </td>
                  <td
                    style={{
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {location.notes || "No notes"}
                  </td>
                  <td>{new Date(location.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No locations match your current filters. Try adjusting your search
            criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkMap;
