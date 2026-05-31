import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

function MostBorrowedItems() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTopBorrowed();
    }, []);

    const fetchTopBorrowed = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.get("/api/charts/top-borrowed-items");
            setItems(res.data);
        } catch (error) {
            console.error('Error loading data:', error);
            setError("Failed to load");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="
            w-full h-full p-4 rounded-xl 
            flex flex-col

            bg-gray-50 text-gray-900
            dark:bg-gray-800 dark:border-gray-700 dark:text-white
        ">
            <h2 className="text-lg text-center font-semibold mb-4">
                Most Borrowed Items
            </h2>

            {/* Loading state */}
            {loading ? (
                <div className="flex justify-center items-center flex-1 min-h-[200px]">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <p className="text-center text-red-500 dark:text-red-400">
                    {error}
                </p>
            ) : items.length > 0 ? (
                <ul className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {items.map((item, index) => (
                        <li
                            key={index}
                            className="
                                flex justify-between items-center px-4 py-2 rounded-lg

                                bg-gray-200 hover:bg-gray-300 text-gray-900
                                dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white
                            "
                        >
                            {/* Left: Rank + Name */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-5">
                                    {index + 1}.
                                </span>
                                <span className="text-xs ">
                                    {item.title}
                                </span>
                            </div>

                            {/* Right: Count */}
                            <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap">
                                {item.total_borrows} {item.total_borrows > 1 ? "borrows" : "borrow"}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-600 dark:text-gray-400">
                    No data available
                </p>
            )}
        </div>
    );
}

export default MostBorrowedItems;