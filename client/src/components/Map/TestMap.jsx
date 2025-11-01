import { useEffect, useState, useRef, createContext, useContext } from "react";
import { OlaMaps } from "olamaps-web-sdk";
import { createHubMarkerElement } from "./HubMarker";

const OLA_MAP_API_KEY = "dxEuToWnHB5W4e4lcqiFwu2RwKA64Ixi0BFR73kQ"; // Replace with your actual API key
const CENTRAL_HUB = { lat: 10.981156, lng: 76.964189 };

const MapContext = createContext({ map: null, olaMaps: null });

export function useMap() {
  return useContext(MapContext);
}

const TestMap = ({ children }) => {
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [olaMaps, setOlaMaps] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ola = new OlaMaps({
      apiKey: OLA_MAP_API_KEY,
    });
    const mapInstance = ola.init({
      style:
        "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
      container: containerRef.current,
      center: [CENTRAL_HUB.lng, CENTRAL_HUB.lat],
      zoom: 15,
    });

    // Add marker
    ola
      .addMarker({
        element: createHubMarkerElement(),
        anchor: "center",
      })
      .setLngLat([CENTRAL_HUB.lng, CENTRAL_HUB.lat])
      .addTo(mapInstance);

    setOlaMaps(ola);
    setMap(mapInstance);

    // Optionally, you can return a cleanup function if the SDK supports destroying the map instance
    return () => mapInstance.remove();
  }, []);

  return (
    <>
      <MapContext.Provider value={{ olaMaps, map }}>
        <div
          ref={containerRef}
          style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
        />
        {map && <div className="relative z-10">{children}</div>}
      </MapContext.Provider>
    </>
  );
};

export default TestMap;
