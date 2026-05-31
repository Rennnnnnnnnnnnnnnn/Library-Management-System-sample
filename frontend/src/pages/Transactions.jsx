import { useEffect, useState } from "react";
import TablePagination from "@mui/material/TablePagination";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import { toast } from "react-toastify";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import * as XLSX from "xlsx";
import DownloadIcon from "../assets/icons/action-icons/DownloadIcon";

function Transactions() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    // Filter state
    const [selectedTypes, setSelectedTypes] = useState([]);
    // Pagination
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    // Search
    const [searchTerm, setSearchTerm] = useState("");
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    // Data
    const [transactions, setTransactions] = useState([]);
    // Confirmation modal
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        type: "",
    });

    const getTransactions = async () => {
        try {
            setIsFetching(true);

            const filters = selectedTypes.join(";");
            const res = await api.get("/api/transactions", {
                params: { page, limit, searchTerm, filters, startDate, endDate },
            });

            setTransactions(res.data.rows);
            setTotal(res.data.total);
        } catch (err) {
            console.error("Error fetching transactions:", err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.get("/api/transactions/downloadTransactions", {
                params: {
                    filters: selectedTypes.join(";"),
                    searchTerm,
                    startDate,
                    endDate
                }
            });

            const data = res.data.rows;

            const formattedData = data.map(row => ({
                ...row,
                borrow_date: row.borrow_date
                    ? new Intl.DateTimeFormat("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                    }).format(new Date(row.borrow_date))
                    : "",

                due_date: row.due_date
                    ? new Intl.DateTimeFormat("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    }).format(new Date(row.due_date))
                    : "",
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);

            // AUTO-FIT COLUMNS
            const colWidths = Object.keys(formattedData[0] || {}).map(key => {
                const maxLength = Math.max(
                    key.length,
                    ...formattedData.map(row =>
                        row[key] ? row[key].toString().length : 0
                    )
                );
                return { wch: Math.min(maxLength + 2, 50) };
            });

            worksheet["!cols"] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

            XLSX.writeFile(workbook, "transactions_export.xlsx");

        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const handleDelete = (id) => {
        setConfirmationModal({
            isOpen: true,
            title: "Delete Transaction",
            message: [
                "Are you sure you want to delete this transaction?",
                "This action cannot be undone.",
            ],
            onConfirm: () => performDelete(id),
            type: "delete",
        });
    };

    const performDelete = async (id) => {
        try {
            await api.delete(`/api/transactions/${id}`);
            toast.success("Transaction deleted successfully!");
            getTransactions();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete transaction.");
        }
    };

    const handleEdit = (transaction) => {
        setSelectedTransaction(transaction);
        setIsEditModalOpen(true);
    };

    const handleChangePage = (e, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => {
        setLimit(parseInt(e.target.value, 10));
        setPage(0);
    };

    const toggleType = (type) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    useEffect(() => { getTransactions(); }, [page, limit]);
    useEffect(() => { setPage(0); getTransactions(); }, [searchTerm, selectedTypes, startDate, endDate]);

    const closeConfirmationModal = () => setConfirmationModal({ isOpen: false, title: "", message: "", onConfirm: null, type: "" });

    const getStatusColor = (status) => {
        if (!status) return "text-black dark:text-white";

        if (status.includes("Early")) return "text-green-600 dark:text-green-400";
        if (status.includes("On Time")) return "text-blue-600 dark:text-blue-400";
        if (status.includes("Late")) return "text-red-600 dark:text-red-400";
        if (status.includes("Pending")) return "text-yellow-600 dark:text-yellow-400";
    };

    return (
        <>
         {/* Header */}
<div className="flex flex-col lg:flex-row px-4 pt-4 gap-4 lg:gap-0 justify-between items-start lg:items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">

    {/* Title */}
    <h1 className="text-xl sm:text-2xl ml-0 lg:ml-10 whitespace-nowrap">
        Transactions Page
    </h1>

    {/* Controls */}
    <div className="flex flex-wrap gap-3 lg:gap-x-6 items-center w-full lg:w-auto justify-start lg:justify-end">

        {/* Export button */}
        <button
            className="hover:bg-gray-400 dark:hover:bg-gray-500 p-1.5 px-2 text-sm rounded hover:cursor-pointer"
            onClick={handleExport}
        >
            <DownloadIcon className="w-5 h-5 text-gray-700 dark:text-gray-100" />
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
                onPageChange={handleChangePage}
                rowsPerPage={limit}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                    ".MuiTablePagination-toolbar": {
                        color: "black",
                        ".dark &": { color: "white" }
                    }
                }}
            />
        </div>
    </div>
</div>

            {/* Body */}
            <div className="flex flex-row h-[calc(100vh-13vh)] p-4 gap-4 bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
                {/* Sidebar */}
                <aside className="flex flex-col w-64 p-4 rounded-md border-4 bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                    <fieldset className="space-y-2">
                        <legend className="text-lg font-semibold">Filter Transactions :</legend>
                        <div className="ml-6 space-y-1">
                            {["Pending Return", "Returned Early", "Returned On Time", "Returned Late"].map(type => (
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
                {/* Table */}
                <main className="flex-1 overflow-auto rounded-md bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                    <table className="min-w-full border shadow-md overflow-hidden bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                        <thead className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-semibold"></th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">STUDENT NUMBER</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">NAME</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">COURSE - YEAR & SECTION</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">ITEM ID</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">ITEM NAME</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">BORROW DATE</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">DUE DATE</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">STATUS</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">ITEM RETURN CONDITION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {isFetching ? (
                                <tr>
                                    <td colSpan="10" className="text-center py-20">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="text-center py-10 text-gray-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn, index) => (
                                    <tr key={index} className="hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <td className="px-8 py-4 text-left text-xs whitespace-nowrap">
                                            {index + 1 + page * limit}
                                        </td>
                                        <td className="px-8 py-4 text-left text-xs whitespace-nowrap">
                                            {txn.student_number}
                                        </td>
                                        <td className="px-8 py-4 text-left text-xs whitespace-nowrap">
                                            {txn.account_name}
                                        </td>
                                        <td className="px-8 py-4 text-left text-xs whitespace-nowrap">
                                            {txn.course} - {txn.year_and_section}
                                        </td>
                                        <td className="px-8 py-4 text-left text-xs whitespace-nowrap">
                                            {txn.item_id}
                                        </td>
                                        <td className={`px-8 py-4 text-left text-xs whitespace-nowrap ${!txn.book_title && !txn.paper_title ? 'text-gray-500 italic' : ''}`}>
                                            {txn.book_title || txn.paper_title || "N/A"}
                                        </td>
                                        <td className="px-8 py-2 text-left text-xs whitespace-nowrap">
                                            {new Intl.DateTimeFormat("en-PH", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true
                                            }).format(new Date(txn.borrow_date))}
                                        </td>
                                        <td className="px-8 py-2 text-left text-xs whitespace-nowrap">
                                            {new Intl.DateTimeFormat("en-PH", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric"
                                            }).format(new Date(txn.due_date))}
                                        </td>
                                        <td className={`px-8 py-2 text-left text-xs whitespace-nowrap ${getStatusColor(txn.status)}`}>
                                            {txn.status}
                                        </td>
                                        <td className={`px-8 py-2 text-left text-xs whitespace-nowrap ${txn.item_condition === "N/A" ? 'text-gray-500 italic' : ''}`}>
                                            {txn.item_condition}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </main>
            </div>

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

export default Transactions;