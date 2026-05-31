import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import ACTS_Logo from "../assets/ACTS_Logo.png";
import MyAccount_Logo from "../assets/MyAccount_Logo.png";
import LoadingSpinner from "../components/LoadingSpinner";
import { useTheme } from "../context.js/ThemeContext";
import { useAuth } from "../context.js/AuthContext";

function Navbar() {
    const [showLogout, setShowLogout] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const { logout } = useAuth();

    const linkBase = "relative hover:text-gray-300 transition pb-1";
    const activeStyle =
        "after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-white";

    const handleLogout = () => {
        setLoading(true);

        setTimeout(() => {
            logout();
            window.location.href = "/";
        }, 1000);
    };

    useEffect(() => {
        setShowLogout(false);
    }, [location.pathname]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowLogout(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <nav className="px-6 py-3 bg-green-700 dark:bg-green-800 text-gray-200 dark:text-white">
                <div className="flex justify-between items-center">

                    <div className="flex items-center">
                        <img src={ACTS_Logo} alt="ACTS Logo" className="h-10 w-10 mr-3" />
                        <h1 className="text-xl font-semibold tracking-wide">
                            ACTS Library
                        </h1>
                    </div>

                    <div className="flex space-x-6 items-center relative">
                        {/* TOGGLE THEME */}
                        <button
                            onClick={toggleTheme}
                            className={`relative w-14 h-7 flex items-center rounded-full px-1 transition-all duration-300
                            ${darkMode ? "bg-gray-500" : "bg-gray-300"} cursor-pointer`}
                        >
                            <span className="absolute left-1 text-xs">🌙</span>
                            <span className="absolute right-1 text-xs">☀️</span>

                            <div
                                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300
                                ${darkMode ? "translate-x-7" : "translate-x-0"}`}
                            />
                        </button>

                        <NavLink to="/home" className={({ isActive }) => `${linkBase} ${isActive ? activeStyle : ""}`}>Home</NavLink>
                        <NavLink to="/activities" className={({ isActive }) => `${linkBase} ${isActive ? activeStyle : ""}`}>Activities</NavLink>
                        <NavLink to="/transactions" className={({ isActive }) => `${linkBase} ${isActive ? activeStyle : ""}`}>Transactions</NavLink>
                        <NavLink to="/resources" className={({ isActive }) => `${linkBase} ${isActive ? activeStyle : ""}`}>Resources</NavLink>
                        <NavLink to="/accounts" className={({ isActive }) => `${linkBase} ${isActive ? activeStyle : ""}`}>Accounts</NavLink>

                        <div className="relative" ref={dropdownRef}>
                            <img
                                src={MyAccount_Logo}
                                alt="My Account"
                                className="h-8 w-8 hover:opacity-80 transition hover:cursor-pointer"
                                onClick={() => setShowLogout(prev => !prev)}
                            />

                            {showLogout && (
                                <div className="absolute right-0 mt-7 
                                        bg-white text-black 
                                        dark:bg-gray-300 dark:text-black 
                                        px-3 py-2 rounded shadow-md text-sm w-24 text-center z-50
                                        hover:cursor-pointer hover:bg-gray-200
                                        "


                                    onClick={handleLogout}
                                >
                                    Logout
                                </div>
                            )}
                        </div>

                    </div>
                </div>


             
            </nav>

            {loading && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/30 dark:bg-white/10 backdrop-blur-xs z-50">
                    <div className="w-full max-w-sm 
                                bg-white text-gray-800 
                                dark:bg-gray-800 dark:text-white 
                                p-6 rounded-lg shadow-md flex flex-col gap-6">
                        <LoadingSpinner />
                        <p className="text-sm text-center text-gray-600 dark:text-gray-200">
                            Logging out
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

export default Navbar;