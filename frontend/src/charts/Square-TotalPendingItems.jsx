import { useEffect, useState } from "react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

function SquareTotalPendingItems() {
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTotalCheckedOutItems();
    }, []);

    const fetchTotalCheckedOutItems = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.get("/api/charts/getTotalCheckedOutItems");
            setTotal(res.data.total);
        } catch (err) {
            console.error("Error fetching checked out items:", err);
            setError("Failed to load");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="
            w-full aspect-square rounded-xl flex flex-col justify-center items-center 
            shadow-md hover:shadow-lg hover:-translate-y-1
            min-h-[120px]

            bg-gray-50 border border-gray-200 text-gray-900
            dark:bg-gray-800 dark:border-gray-700 dark:text-white
        ">

            {/* Label */}
            <p className="text-sm text-gray-500 dark:text-gray-400 tracking-wide text-center">
                Pending Return
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 tracking-wide text-center">
                Items
            </p>


            {/* Value */}
            {loading ? (
                <div className="flex justify-center items-center mt-2">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <span className="text-red-500 text-sm">--</span>
            ) : (
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                    {total}
                </p>
            )}
        </div>
    );
}

export default SquareTotalPendingItems;