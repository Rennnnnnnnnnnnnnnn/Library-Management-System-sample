import { useEffect, useState } from "react";
import TablePagination from "@mui/material/TablePagination";
import AddActivityModal from "../components/modals/AddNewActivityModal";
import EditActivityModal from "../components/modals/EditActivityModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import EditIcon from "../assets/icons/action-icons/EditIcon";
import DeleteIcon from "../assets/icons/action-icons/DeleteIcon";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import DownloadIcon from "../assets/icons/action-icons/DownloadIcon";

function Activities() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [activities, setActivities] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        type: "",
    });

    const getActivities = async () => {
        try {
            setIsFetching(true);

            const filters = selectedTypes.join(";");

            const res = await api.get("/api/activity/getActivities", {
                params: {
                    filters,
                    page,
                    limit,
                    searchTerm,
                    startDate,
                    endDate
                },
            });

            setActivities(res.data.rows);
            setTotal(res.data.total);
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleExport = async () => {
        try {
            const filters = selectedTypes.join(";");

            const res = await api.get("/api/activity/downloadActivities", {
                params: {
                    filters,
                    searchTerm,
                    startDate,
                    endDate
                }
            });

            const data = res.data.rows;

            const worksheet = XLSX.utils.json_to_sheet(data);

            // 📏 AUTO-FIT COLUMNS
            const colWidths = Object.keys(data[0] || {}).map((key) => {
                const maxLength = Math.max(
                    key.length,
                    ...data.map(row => {
                        const value = row?.[key];

                        if (value === null || value === undefined) return 0;

                        // format dates nicely if needed
                        if (value instanceof Date) {
                            return value.toISOString().length;
                        }

                        return value.toString().length;
                    })
                );

                return { wch: Math.min(maxLength + 2, 40) }; // cap width
            });

            worksheet["!cols"] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Activities");

            XLSX.writeFile(workbook, "activities_export.xlsx");

        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const handleDelete = (activityId) => {
        setConfirmationModal({
            isOpen: true,
            title: "Delete Activity",
            message: ["Are you sure you want to delete this activity?", "This action cannot be undone."],
            onConfirm: () => performDelete(activityId),
            type: "delete",
        });
    };

    const performDelete = async (act_id) => {
        try {
            await api.delete(`/api/activity/deleteActivity/${act_id}`);
            toast.success("Activity deleted successfully!");
            getActivities();
        } catch (err) {
            toast.error("Failed to delete activity.");
            console.error(err);
        }
    };

    const handleEdit = (activity) => {
        setSelectedActivity(activity);
        setIsEditModalOpen(true);
    };

    const toggleType = (type) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    useEffect(() => { getActivities(); }, [page, limit]);
    useEffect(() => { setPage(0); getActivities(); }, [searchTerm, selectedTypes, startDate, endDate]);

    const closeConfirmationModal = () => setConfirmationModal({ isOpen: false, title: "", message: "", onConfirm: null, type: "" });

    return (
        <>
           {/* Header */}
<div className="flex flex-col lg:flex-row px-4 pt-4 gap-4 lg:gap-0 justify-between items-start lg:items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">

    {/* Title */}
    <h1 className="text-xl sm:text-2xl ml-0 lg:ml-10 whitespace-nowrap">
        Activities Page
    </h1>

    {/* Controls */}
    <div className="flex flex-wrap gap-3 lg:gap-x-6 items-center w-full lg:w-auto justify-start lg:justify-end">

        {/* Export */}
        <button
            className="hover:bg-gray-400 dark:hover:bg-gray-500 p-1.5 px-2 text-sm rounded hover:cursor-pointer"
            onClick={handleExport}
        >
            <DownloadIcon className="w-5 h-5 text-gray-700 dark:text-gray-100" />
        </button>

        {/* Add Activity */}
        <button
            className="p-1.5 px-3 text-sm rounded bg-gray-300 hover:bg-gray-400 text-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
            onClick={() => setIsAddActivityModalOpen(true)}
        >
            Add Activity +
        </button>

        {/* Date filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-xs">Start Date :</label>
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 px-2 text-sm rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-xs">End Date :</label>
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 px-2 text-sm rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
        </div>

        {/* Search */}
        <div className="w-full sm:w-64 lg:w-80">
            <input
                type="text"
                placeholder="Search..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 text-sm rounded-md px-3 outline-none border border-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
        </div>

        {/* Pagination */}
        <div className="w-full sm:w-auto">
            <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={limit}
                onRowsPerPageChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                sx={{
                    ".MuiTablePagination-toolbar": {
                        color: "black",
                        ".dark &": { color: "white" },
                    },
                }}
            />
        </div>
    </div>
</div>

            {/* Body */}
            <div className="flex flex-row h-[calc(100vh-13vh)] p-4 gap-3 bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
                <aside className="flex flex-col w-64 p-4 rounded-md border-4 bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                    <fieldset className="space-y-2">
                        <legend className="text-lg font-semibold">Select Activities :</legend>
                        <div className="ml-6 space-y-1">
                            {["Used Library", "Borrowed Item", "Returned Item"].map((type) => (
                                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => toggleType(type)}
                                        className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400"
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </aside>

                <main className="flex-1 overflow-auto rounded-md bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                    <table className="min-w-full border shadow-md overflow-hidden bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                        <thead className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                            <tr>
                                <th className="px-4 py-3 text-center text-sm font-semibold"></th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">STUDENT NUMBER</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">NAME</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">COURSE - YEAR & SECTION</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">ACTIVITY TYPE</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">ITEM ID</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">ITEM NAME</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">TIME & DATE</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {isFetching ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-20">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-6 text-gray-500">
                                        No activities found.
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity, index) => (
                                    <tr key={index} className="hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <td className="px-8 py-2 text-xs text-left whitespace-nowrap">
                                            {index + 1 + page * limit}
                                        </td>
                                        <td className="px-8 py-2 text-xs text-left whitespace-nowrap">
                                            {activity.student_number}
                                        </td>
                                        <td className="px-8 py-2 text-xs text-left whitespace-nowrap">
                                            {activity.name}
                                        </td>
                                        <td className="px-8 py-2 text-xs text-left whitespace-nowrap">
                                            {activity.course} - {activity.year_and_section}
                                        </td>
                                        <td className="px-8 py-2 text-xs text-left whitespace-nowrap">
                                            {activity.activity_type}
                                        </td>
                                        <td className={`px-4 py-3 text-xs text-left whitespace-nowrap ${activity.activity_type === "Used Library" ? 'text-gray-500 italic' : ''}`}>
                                            {activity.activity_type === "Used Library" ? "N/A" : activity.item_id}
                                        </td>
                                        <td className={`px-4 py-3 text-xs text-left whitespace-nowrap ${activity.activity_type === "Used Library" ? 'text-gray-500 italic' : ''}`}>
                                            {activity.activity_type === "Used Library" ? "N/A" : activity.item_name}
                                        </td>
                                        <td className="px-8 py-2 text-xs text-left whitespace-nowrap">
                                            {new Intl.DateTimeFormat("en-PH", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true
                                            }).format(new Date(activity.activity_time))}
                                        </td>
                                        <td className="px-8 py-2 text-left flex gap-2">
                                            <button
                                                className="p-2 rounded-xl transition-all duration-200 hover:bg-yellow-200 dark:hover:bg-yellow-400/20 active:scale-95"
                                                onClick={() => handleEdit(activity)}
                                                title="Edit Activity"
                                            >
                                                <EditIcon className="w-5 h-5 text-gray-700 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 hover:cursor-pointer" />
                                            </button>
                                            <button
                                                className="p-2 rounded-xl transition-all duration-200 hover:bg-red-200 dark:hover:bg-red-900/30 active:scale-95"
                                                onClick={() => handleDelete(activity.act_id)}
                                                title="Delete Item"
                                            >
                                                <DeleteIcon className="w-5 h-5 text-gray-700 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 hover:cursor-pointer" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </main>
            </div>

            <AddActivityModal
                isOpen={isAddActivityModalOpen}
                onClose={() => { setIsAddActivityModalOpen(false); getActivities(); }}
            />
            <EditActivityModal
                isOpen={isEditModalOpen}
                activity={selectedActivity}
                onClose={() => { setIsEditModalOpen(false); setSelectedActivity(null); getActivities(); }}
            />
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title={confirmationModal.title}
                message={confirmationModal.message}
                onConfirm={() => { confirmationModal.onConfirm?.(); closeConfirmationModal(); }}
                onCancel={closeConfirmationModal}
                type={confirmationModal.type}
            />
        </>
    );
}

export default Activities;