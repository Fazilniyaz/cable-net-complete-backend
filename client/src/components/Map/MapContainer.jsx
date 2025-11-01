import { useEffect } from "react";
import { useMap, CENTRAL_HUB } from "./MapProvider";
import { OlaMaps } from "olamaps-web-sdk";
import { createHubMarkerElement } from "./HubMarker";

const OLA_MAP_API_KEY = "dxEuToWnHB5W4e4lcqiFwu2RwKA64Ixi0BFR73kQ";

export default function MapContainer({ className = "w-full h-[500px]" }) {
  const { containerRef, setMap, setOlaMaps } = useMap();

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const ola = new OlaMaps({ apiKey: OLA_MAP_API_KEY });
    const mapInstance = ola.init({
      style:
        "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
      container: containerRef.current,
      center: [CENTRAL_HUB.lng, CENTRAL_HUB.lat],
      zoom: 15,
    });

    ola
      .addMarker({
        element: createHubMarkerElement(),
        anchor: "center",
      })
      .setLngLat([CENTRAL_HUB.lng, CENTRAL_HUB.lat])
      .addTo(mapInstance);

    setOlaMaps(ola);
    setMap(mapInstance);

    return () => mapInstance.remove();
  }, [containerRef]);

  return <div ref={containerRef} className={className} />;
}
