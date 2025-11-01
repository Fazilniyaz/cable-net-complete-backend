"use client";

import { SearchBox } from "./AutoComplete";
import MapProvider from "./MapProvider";

export default function MapWithSearch() {
  return (
    <div className="relative h-full w-full">
      {/* Page Heading */}
      <div className="absolute top-6 left-6 z-20">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-lg border border-gray-200/50">
          <h1 className="text-2xl font-bold text-gray-800">Network Map</h1>
        </div>
      </div>

      {/* Fullscreen Map */}
      <MapProvider>
        <div className="inset-0" />
        {/* Search Bar Positioned at Top Center */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-lg px-4">
          <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
            <SearchBox />
          </div>
        </div>
      </MapProvider>
    </div>
  );
}
