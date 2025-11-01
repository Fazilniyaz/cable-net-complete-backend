// components/MapServiceTypeFilter.js
"use client";

import { useState } from "react";

const MapServiceTypeFilter = ({ serviceTypes, onServiceTypeFilterChange }) => {
  const [selectedServiceType, setSelectedServiceType] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedServiceType(value);
    onServiceTypeFilterChange(value); // Pass selected ID (or empty string for "All")
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Filter by Type:
      </label>
      <select
        className="form-select text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={selectedServiceType}
        onChange={handleChange}
      >
        <option value="">All Types</option>
        {serviceTypes.map((type) => (
          <option key={type._id} value={type._id}>
            {type.icon} {type.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MapServiceTypeFilter;
