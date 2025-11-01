"use client";

import { useMap } from "./MapProvider";
import useSWR, { mutate } from "swr";
import { fetcher } from "./Fetcher";
import { useDebouncedState } from "./useDebouncedState";
import { MapPin, Search, X } from "lucide-react";
import { AutoCompleteApi, FetchPlaceApi } from "./Api";
import { useEffect, useRef, useState } from "react";
import { createLocationMarkerElement } from "./HubMarker";

// interface PlacePrediction {
//   structured_formatting: { secondary_text: string };
//   place_id: string;
//   description: string;
//   formatted_address: string;
//   geometry: {
//     location: {
//       lat: number,
//       lng: number,
//     },
//   };
// }

export function SearchBox() {
  const { map, olaMaps } = useMap();
  const [searchQuery, setSearchQuery, debouncedQuery] = useDebouncedState(
    "",
    500
  );
  const [placeId, setPlaceId] = useState("");
  const markerRef = useRef(null);

  const { data, error, isLoading } = useSWR(
    debouncedQuery
      ? [
          AutoCompleteApi(debouncedQuery),
          { method: "GET", headers: { "X-Request-Id": "request-123" } },
        ]
      : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  );

  const {
    data: placeData,
    error: placeError,
    isLoading: placeLoading,
  } = useSWR(
    placeId
      ? [
          FetchPlaceApi(placeId),
          { method: "GET", headers: { "X-Request-Id": "request-123" } },
        ]
      : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (placeData) {
      const location = placeData?.result?.geometry?.location;
      if (location?.lat && location?.lng) {
        // Remove previous marker
        if (markerRef.current) {
          markerRef.current.remove();
        }

        map.flyTo({
          center: [location.lng, location.lat],
          zoom: 14,
          speed: 1.2,
        });
        markerRef.current = olaMaps
          .addMarker({
            element: createLocationMarkerElement(),
            anchor: "center",
          })
          .setLngLat([Number(location.lng), Number(location.lat)])
          .addTo(map);
      }
    }
  }, [placeData]);

  const handleLocationSelect = async (place) => {
    setSearchQuery("");
    setPlaceId(place.place_id);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-gray-500 z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location..."
          className="w-full pl-10 pr-10 py-3.5 bg-white/95 border border-gray-300/80 rounded-xl 
                 shadow-sm focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 
                 transition-all duration-200 placeholder-gray-500 text-gray-800
                 backdrop-blur-sm hover:border-gray-400/60"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 
                   transition-colors duration-200"
          >
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        )}
      </div>
      {/* Loading state */}
      {isLoading && (
        <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-gray-200/50 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <p className="text-gray-700 font-medium">Finding places...</p>
        </div>
      )}

      {placeError && (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-md border border-red-200 flex items-start space-x-3 max-w-s">
          <div className="flex-shrink-0 h-4 w-4 text-red-500 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-red-700 text-sm leading-tight">
            Place not found. Check spelling or try a different location.
          </p>
        </div>
      )}

      {/* Results Dropdown */}
      <ul className="bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-lg overflow-hidden">
        {data?.predictions?.map((place) => (
          <li
            key={place.place_id}
            className="px-4 py-3.5 text-gray-800 hover:bg-blue-50/80 transition-all duration-200 
                   border-b border-gray-100/50 last:border-b-0 cursor-pointer"
            onClick={() => handleLocationSelect(place)}
          >
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-blue-500/70 mr-3 flex-shrink-0" />
              <span className="text-sm font-medium tracking-wide">
                {place.description}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
