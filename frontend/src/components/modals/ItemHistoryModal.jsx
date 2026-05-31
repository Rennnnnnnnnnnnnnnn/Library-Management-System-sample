import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner'; // make sure path is correct

const ItemHistoryModal = ({ isOpen, onClose, selectedItem, book }) => {
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getStatusColor = (status) => {
        if (!status) return "text-black dark:text-white";

        if (status.includes("Early")) return "text-green-600 dark:text-green-400";
        if (status.includes("On Time")) return "text-blue-600 dark:text-blue-400";
        if (status.includes("Late")) return "text-red-600 dark:text-red-400";
        if (status.includes("Pending")) return "text-yellow-600 dark:text-yellow-400";

        return "text-gray-600 dark:text-gray-300";
    };

    const getTransactionDetails = async (item_id) => {
        setLoading(true);
        setError(null);
        setTransaction(null);

        try {
            const res = await api.get(`/api/transactions/getTransactionByItemId/${item_id}`);

            if (res.data.message) {
                setError(res.data.message);
            } else {
                setTransaction(res.data);
            }

        } catch (err) {
            console.error("Error fetching transaction:", err);
            setError("Failed to load transaction details.");
            toast.error("Failed to load transaction details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && selectedItem?.item_id) {
            getTransactionDetails(selectedItem.item_id);
        } else {
            setTransaction(null);
            setError(null);
            setLoading(false);
        }
    }, [isOpen, selectedItem]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg w-full max-w-6xl mx-auto shadow-lg border border-gray-300 dark:border-gray-700">

                {/* Title */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
                    Item History
                </h2>

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <span className="text-lg font-medium text-blue-500 dark:text-blue-400">
                            {book ? book.title : selectedItem?.title}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                            Item ID : {selectedItem?.item_id}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl transition-colors hover:cursor-pointer"
                    >
                        ×
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-md border border-gray-300 dark:border-gray-700">
                    <table className="min-w-full table-auto border-collapse text-gray-900 dark:text-white">

                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Student Number</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Name</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Course - Year & Section</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Borrow Date</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Due Date</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Return Condition</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-300 dark:divide-gray-700">

                            {/* LOADING */}
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20">
                                        <LoadingSpinner />
                                    </td>
                                </tr>

                            ) : error ? (
                                /* ERROR */
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-gray-700 dark:text-gray-300">
                                        {error}
                                    </td>
                                </tr>

                            ) : transaction ? (
                                /* DATA */
                                <tr className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors">

                                    <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
                                        {transaction.student_number}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-left whitespace-nowrap">
                                        {transaction.name}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-left whitespace-nowrap">
                                        {transaction.course} - {transaction.year_and_section}
                                    </td>

                                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                                        {new Intl.DateTimeFormat("en-PH", {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true
                                        }).format(new Date(transaction.borrow_date))}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
                                        {new Intl.DateTimeFormat("en-PH", {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric"
                                        }).format(new Date(transaction.due_date))}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                            {transaction.status}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-xs text-center whitespace-nowrap italic text-gray-700 dark:text-gray-300">
                                        {transaction.item_condition}
                                    </td>

                                </tr>

                            ) : (
                                /* EMPTY */
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-gray-700 dark:text-gray-300">
                                        No transaction data available for this item.
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default ItemHistoryModal;