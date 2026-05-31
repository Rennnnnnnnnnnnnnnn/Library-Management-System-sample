import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "../context.js/ThemeContext";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

ChartJS.register(ArcElement, Tooltip, Legend);

function ResourcesTypesDoughnut() {
    const [chartData, setChartData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("books");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { darkMode } = useTheme();

    const getBaseHueTriplet = () => {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 120) % 360;
        const h3 = (h1 + 240) % 360;
        return [h1, h2, h3];
    };

    const getShade = (h, s, l, alpha = 0.85) => {
        return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    };

    useEffect(() => {
        fetchResourceTypes();
    }, [selectedCategory]);

    const fetchResourceTypes = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.get(
                `/api/charts/getResourcesTypes/${selectedCategory}`
            );

            let combined = res.data.map((item) => ({
                label: item.type,
                value: item.total,
            }));

            combined = combined.sort(() => Math.random() - 0.5);

            const labels = combined.map((item) => item.label);
            const values = combined.map((item) => item.value);

            const [h1, h2, h3] = getBaseHueTriplet();

            setChartData({
                labels,
                datasets: [
                    {
                        label: "",
                        data: values,

                        backgroundColor: labels.map((_, i) => {
                            const cycle = i % 3;

                            const hue =
                                cycle === 0 ? h1 :
                                    cycle === 1 ? h2 : h3;

                            const saturation =
                                cycle === 0 ? 85 :
                                    cycle === 1 ? 70 : 80;

                            const lightness = 78 - (i % 5) * 10;

                            return getShade(
                                hue,
                                saturation,
                                Math.max(lightness, 30)
                            );
                        }),

                        borderColor: "rgba(255,255,255,0.25)",
                        borderWidth: 1,
                        hoverOffset: 30,
                        borderRadius: 5,
                        spacing: 8,
                    },
                ],
            });
        } catch (error) {
            console.error("Error fetching resource types:", error);
            setError("Failed to load chart");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="
            p-4 w-full h-full min-h-[320px] rounded-xl border 
            flex flex-col 
            bg-gray-50 border-gray-200 text-gray-900
            dark:bg-gray-800 dark:border-gray-700 dark:text-white
        ">

            {/* 🔘 CATEGORY SELECTOR */}
            <div className="flex justify-center gap-6 mb-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        value="books"
                        checked={selectedCategory === "books"}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    />
                    <span className="text-gray-700 dark:text-gray-300">Books</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        value="academic-papers"
                        checked={selectedCategory === "academic-papers"}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                        Academic Papers
                    </span>
                </label>
            </div>

            {/* 📊 CHART */}
            <div className="relative w-full flex-1 min-h-[260px] flex items-center justify-center">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <p className="text-red-500 dark:text-red-400 text-sm">
                        {error}
                    </p>
                ) : chartData ? (
                    <Doughnut
                        data={chartData}
                        options={{
                            layout: { padding: 20 },
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: "60%",
                            plugins: {
                                legend: {
                                    position: "bottom",
                                    labels: {
                                        color: darkMode ? "#ffffff" : "#111827",
                                        padding: 8,
                                        font: {
                                            size: window.innerWidth < 640 ? 9 : 11,
                                        },
                                    },
                                },
                                tooltip: {
                                    backgroundColor: "#1f2937",
                                    titleColor: "#fff",
                                    bodyColor: "#fff",
                                    borderColor: "#374151",
                                    borderWidth: 1,
                                    padding: 10,
                                    cornerRadius: 8,
                                },
                            },
                        }}
                    />
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-300">
                        No data available
                    </p>
                )}
            </div>
        </div>
    );
}

export default ResourcesTypesDoughnut;
