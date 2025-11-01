import { createContext, useContext, useRef, useState } from "react";

const MapContext = createContext({
  map: null,
  olaMaps: null,
  containerRef: null,
  setMap: () => {},
  setOlaMaps: () => {},
});

export const CENTRAL_HUB = { lat: 10.981156, lng: 76.964189 };

export function useMap() {
  return useContext(MapContext);
}

export default function MapProvider({ children }) {
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [olaMaps, setOlaMaps] = useState(null);

  return (
    <MapContext.Provider
      value={{ map, olaMaps, containerRef, setMap, setOlaMaps }}
    >
      {children}
    </MapContext.Provider>
  );
}
