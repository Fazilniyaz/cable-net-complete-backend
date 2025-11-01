"use client";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  Map,
  MapPin,
  Settings,
  Wrench,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigationItems = [
    { path: "/dashboard", label: "Home", icon: Home },
    { path: "/network-map", label: "Network Map", icon: Map },
    { path: "/locations", label: "Locations", icon: MapPin },
    { path: "/services", label: "Services", icon: Settings },
    { path: "/service-types", label: "Service Types", icon: Wrench },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Overlay for Mobile */}
      {!isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed lg:relative z-30 h-full bg-white shadow-lg transition-all duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "w-64 translate-x-0"
              : "w-16 lg:w-20 -translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {isSidebarOpen && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Cable Network
                  </h2>
                  <p className="text-xs text-gray-600">Management System</p>
                </div>
              )}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <ul className="flex-1 py-4 space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path} className="relative">
                  <button
                    className={`
                      w-full flex items-center px-4 py-3 transition-all duration-200 relative group
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                      ${
                        isSidebarOpen
                          ? "justify-start space-x-3"
                          : "justify-center"
                      }
                    `}
                    onClick={() => navigate(item.path)}
                  >
                    <IconComponent size={20} />
                    {isSidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}

                    {/* Tooltip above the icon for collapsed state */}
                    {!isSidebarOpen && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 z-40 whitespace-nowrap">
                        {item.label}
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            {isSidebarOpen ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>Welcome,</p>
                  <p className="font-medium text-gray-800 truncate">
                    {currentUser?.username}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span className="ml-2 font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                {/* User Avatar with Tooltip above */}
                <div className="relative group">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">
                      {currentUser?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 z-40 whitespace-nowrap">
                    Welcome, {currentUser?.username}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                {/* Logout Button with Tooltip above */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors relative group"
                >
                  <LogOut size={18} />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 z-40 whitespace-nowrap">
                    Logout
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main
        className={`
        flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? "lg:ml-0" : "lg:ml-0"}
      `}
      >
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              Cable Network Management
            </h1>
            <div className="w-9"></div> {/* Spacer for balance */}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:block bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">
              Cable Network Management Dashboard
            </h1>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden xl:block"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
