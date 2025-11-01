import React from "react";
import { useState } from "react";
import {
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  Wifi,
  MapPin,
} from "lucide-react";

export function DataTable({ columns, data, onEdit, onDelete }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort data
  const sortedData = sortConfig.key
    ? [...data].sort((a, b) => {
        const aValue =
          columns.find((col) => col.key === sortConfig.key)?.render?.(a) ||
          a[sortConfig.key];
        const bValue =
          columns.find((col) => col.key === sortConfig.key)?.render?.(b) ||
          b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      })
    : data;

  // Get random icon for empty state
  const getRandomIcon = () => {
    const icons = [Zap, Wifi, MapPin];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-blue-100/50 overflow-hidden backdrop-blur-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-blue-100/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/30 transition-all duration-200 ${
                    col.className || ""
                  }`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.icon && (
                      <col.icon size={16} className="text-blue-500" />
                    )}
                    {col.header}
                    {col.sortable !== false && (
                      <div className="flex flex-col ml-1">
                        <ChevronUp
                          size={12}
                          className={`${
                            sortConfig.key === col.key &&
                            sortConfig.direction === "asc"
                              ? "text-blue-600"
                              : "text-gray-300"
                          } transition-colors`}
                        />
                        <ChevronDown
                          size={12}
                          className={`-mt-1 ${
                            sortConfig.key === col.key &&
                            sortConfig.direction === "desc"
                              ? "text-blue-600"
                              : "text-gray-300"
                          } transition-colors`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="p-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-blue-500" />
                    Actions
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100/20">
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <tr
                  key={item._id || index}
                  className="hover:bg-gradient-to-r from-blue-50/50 to-purple-50/30 transition-all duration-200 group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`p-4 text-sm text-gray-700 group-hover:text-gray-900 transition-colors ${
                        col.className || ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {col.icon && (
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <col.icon size={14} className="text-blue-600" />
                          </div>
                        )}
                        <span className="font-medium">
                          {col.render ? col.render(item) : item[col.key]}
                        </span>
                      </div>
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl group/btn relative overflow-hidden"
                            onClick={() => onEdit(item)}
                            title="Edit"
                          >
                            <Edit3 size={16} />
                            <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-300" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="p-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl group/btn relative overflow-hidden"
                            onClick={() => onDelete(item._id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                            <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-300" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="p-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                      {React.createElement(getRandomIcon(), {
                        size: 32,
                        className: "text-blue-500",
                      })}
                    </div>
                    <p className="text-lg font-bold text-gray-700 mb-2">
                      No data available
                    </p>
                    <p className="text-sm text-gray-500 max-w-md">
                      Your network data will appear here once you start adding
                      locations and services.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {/* <div className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30 border-t border-blue-100/30">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">System Status: </span>
            <span className="text-green-600 font-semibold">
              All Systems Operational
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              Last updated: Just now
            </span>
          </div>
        </div>
      </div> */}
    </div>
  );
}
