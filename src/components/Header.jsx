// export default function Header() {
//   return (
//     <header className="bg-indigo-950 text-white px-6 py-3 shadow flex items-center">
//       <h1 className="text-base font-bold tracking-tight">Timesheet Approval</h1>
//     </header>
//   );
// }

// Header.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaEnvelope,
  FaKey,
  FaShieldAlt,
  FaTimes,
  FaUserCircle,
  FaUserPlus,
  FaSearch,
  FaPlay, // ← ADD THIS
  FaPause, // ← ADD THIS
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import { Save, LogOut, Delete } from "lucide-react";
import { backendUrl } from "./config";

const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.textContent = message;
  const bgColor = type === "success" ? "#4ade80" : "#ef4444";
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: ${bgColor}; color: white; padding: 12px 16px;
    border-radius: 6px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  document.body.appendChild(toast);
  setTimeout(() => document.body.removeChild(toast), 3000);
};

const Header = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem("currentUser");
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setCurrentUser(parsedUser);
        if (parsedUser.role && parsedUser.role.toLowerCase() === "admin") {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error("Failed to parse user info", e);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setUserLoaded(false);
    showToast("Logged out successfully", "info");
    navigate("/");
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-200 shadow-sm rounded-t-lg">
      {/* Left: Logo */}
      <div className="flex items-center">
        <img src="/Columbus_Logo.png" alt="Timesheet" className="h-10 mr-3" />
        {/* <span className="text-white font-bold text-xl hidden sm:block">Columbus</span> */}
      </div>

      {/* Right: Welcome + Logout */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white">
          Welcome,{" "}
          <span className="font-bold text-blue-600">{currentUser?.name}</span>
        </h1>
        <button
          onClick={handleLogout}
          title="Logout"
          // className="flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-2 rounded-md text-xs font-medium hover:bg-red-200 transition-colors shadow-sm"
          className="text-white px-4 py-2 "
        >
          <LogOut size={20} />
          {/* Logout */}
        </button>
      </div>
    </div>
  );

  // return (
  //   <div className="w-full flex justify-between items-center mb-4 px-4 py-3 bg-gray-800 border-b border-gray-200 shadow-sm rounded-t-lg">
  //     {/* Left: Welcome Message (1/3 width) */}

  //     {/* Center: Logo (1/3 width) */}
  //     <div className="w-1/3 flex justify-start">
  //       <div className="bg-slate-800 rounded-md p-2 shadow-inner">
  //         <img src="/Columbus_Logo.png" alt="Logo" className="h-10" />
  //       </div>
  //     </div>

  //     {/* Right: Logout Button (1/3 width) */}
  //     <div className="flex justify-end">
  //       {/* <div className="w-1/3"> */}
  //       <h1 className="text-xl font-semibold text-white">
  //         Welcome,{" "}
  //         <span className="font-bold text-blue-600">{currentUser?.name}</span>
  //       </h1>
  //     </div>
  //     <button
  //       onClick={handleLogout}
  //       className="flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-2 rounded-md text-xs font-medium hover:bg-red-200 transition-colors shadow-sm"
  //     >
  //       <LogOut size={14} />
  //     </button>
  //     {/* </div> */}
  //   </div>
  // );
};

export default Header;
