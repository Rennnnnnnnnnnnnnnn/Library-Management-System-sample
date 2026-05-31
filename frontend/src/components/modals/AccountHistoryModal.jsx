import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import LoadingSpinner from "../LoadingSpinner";
import UserPNG from "../../assets/UserPNG.png";
const API_URL = import.meta.env.VITE_API_URL;

const AccountHistoryModal = ({ isOpen, onClose, selectedAccount }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && selectedAccount) {
      fetchAccountHistory(selectedAccount.student_number);
    }
  }, [isOpen, selectedAccount]);

  console.log(selectedAccount)

  const fetchAccountHistory = async (student_number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/accounts/transactions/${student_number}`);
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching account history:", err);
      setError("Failed to load account history.");
      toast.error("Failed to load account history.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg w-full max-w-6xl shadow-lg border border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white text-center">Account History</h2>

        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
              <img
                src={
                  selectedAccount?.profile_picture
                    ? selectedAccount.profile_picture
                    : UserPNG
                }
                alt="avatar"
                className="w-full h-full object-cover"
               
              />
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                {selectedAccount.name}
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                {selectedAccount.course} - {selectedAccount.year_and_section}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl hover:cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto rounded-md border border-gray-300 dark:border-gray-700">
          <table className="min-w-full table-auto border-collapse text-gray-800 dark:text-gray-200">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Activity Type</th>
                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Item ID</th>
                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Item Name</th>
                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Time & Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 dark:divide-gray-700">

              {loading ? (
                /* LOADING */
                <tr>
                  <td colSpan="4" className="text-center py-20">
                    <LoadingSpinner />
                  </td>
                </tr>

              ) : error ? (
                /* ERROR */
                <tr>
                  <td colSpan="4" className="text-center py-10 text-red-500">
                    {error}
                  </td>
                </tr>

              ) : history.length === 0 ? (
                /* EMPTY */
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500 italic">
                    No account history found for this account.
                  </td>
                </tr>

              ) : (
                /* DATA */
                history.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors">

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${entry.activity_type === 'Borrowed Item'
                        ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : entry.activity_type === 'Returned Item'
                          ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
                        }`}>
                        {entry.activity_type}
                      </span>
                    </td>

                    <td className={`px-4 py-3 text-center whitespace-nowrap ${entry.activity_type === "Used Library"
                      ? "text-gray-400 italic dark:text-gray-500"
                      : "text-gray-700 dark:text-gray-300"
                      }`}>
                      {entry.activity_type === "Used Library" ? "N/A" : entry.item_id}
                    </td>

                    <td className={`px-4 py-3 text-center whitespace-nowrap ${entry.activity_type === "Used Library"
                      ? "text-gray-400 italic dark:text-gray-500"
                      : "text-gray-700 dark:text-gray-300"
                      }`}>
                      {entry.activity_type === "Used Library" ? "N/A" : entry.title}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap text-gray-600 dark:text-gray-400 text-sm">
                      {new Intl.DateTimeFormat("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                      }).format(new Date(entry.activity_time))}
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountHistoryModal;