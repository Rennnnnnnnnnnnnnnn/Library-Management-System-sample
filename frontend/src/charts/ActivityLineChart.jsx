import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

import { Line } from 'react-chartjs-2';
import { useTheme } from '../context.js/ThemeContext';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function ActivityLineChart() {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [chartData, setChartData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { darkMode } = useTheme();

    const toggleType = (type) => {
        if (type === "All Activities") {
            setSelectedTypes([]);
            return;
        }

        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const formatLabel = (dateStr) => {
        const d = new Date(dateStr);

        return d.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric"
        });
    };

    const fetchActivity = async () => {
        setLoading(true);
        setError(null);

        try {
            const typesQuery =
                selectedTypes.length > 0
                    ? selectedTypes.join(";")
                    : null;

            const res = await api.get("/api/charts/activity-stats", {
                params: { types: typesQuery }
            });

            setChartData({
                ...res.data,
                labels: res.data.labels.map(formatLabel)
            });

        } catch (err) {
            console.error("Error fetching activity chart:", err);
            setError("Failed to load chart");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, [selectedTypes]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: darkMode ? "#ffffff" : "#111827",
                    usePointStyle: true
                }
            },

            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                titleColor: darkMode ? '#fff' : '#111827',
                bodyColor: darkMode ? '#fff' : '#111827',
                borderColor: darkMode ? '#374151' : '#e5e7eb',
                borderWidth: 1,
            },
        },

        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: darkMode ? "#9ca3af" : "#374151",
                    stepSize: 1
                },
                grid: {
                    color: darkMode ? "#374151" : "#e5e7eb",
                },
            },

            x: {
                ticks: {
                    color: darkMode ? "#9ca3af" : "#374151"
                },

                grid: {
                    color: "transparent",
                },
            },
        },
    };

    return (
        <div className="
            w-full min-h-[320px] h-[40vh] p-4 rounded-xl border
            bg-gray-50 border-gray-200 text-gray-900
            dark:bg-gray-800 dark:border-gray-700 dark:text-white
        ">

            {/* 🔘 FILTERS */}
            <div className="flex gap-6 mb-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedTypes.length === 0}
                        onChange={() => toggleType("All Activities")}
                    />
                    All Activities
                </label>

                {["Used Library", "Borrowed Item", "Returned Item"].map(type => (
                    <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <input
                            className="hover:cursor-pointer"
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={() => toggleType(type)}
                        />
                        {type}
                    </label>
                ))}
            </div>

            {/* 📈 CHART */}
            <div className="relative h-[300px] flex items-center justify-center">

                {loading ? (
                    <LoadingSpinner />

                ) : error ? (
                    <p className="text-red-500 dark:text-red-400 text-sm">
                        {error}
                    </p>

                ) : chartData ? (
                    <Line data={chartData} options={options} />

                ) : (
                    <p className="text-gray-500 dark:text-gray-300">
                        No data available
                    </p>
                )}

            </div>
        </div>
    );
}

export default ActivityLineChart;