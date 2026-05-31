import { Navigate, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context.js/AuthContext";

export default function ProtectedLayout() {
    const { user, loading } = useAuth();

    if (loading) {
        return null; // or <LoadingSpinner />
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
            <Navbar />

            <main>
                <Outlet />
            </main>
        </div>
    );
}