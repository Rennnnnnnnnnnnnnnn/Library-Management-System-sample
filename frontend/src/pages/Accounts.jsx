import { useEffect, useState } from "react";
import TablePagination from '@mui/material/TablePagination';
import SearchBar from "../components/SearchBar";
import AddAccountModal from "../components/modals/AddNewAccountModal";
import EditAccountModal from "../components/modals/EditAccountModal";
import { toast } from "react-toastify";
import AccountHistoryModal from "../components/modals/AccountHistoryModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import DeleteIcon from "../assets/icons/action-icons/DeleteIcon";
import EditIcon from "../assets/icons/action-icons/EditIcon";
import ListIcon from "../assets/icons/action-icons/ListIcon";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import * as XLSX from "xlsx";
import DownloadIcon from "../assets/icons/action-icons/DownloadIcon";

function Accounts() {
    // Selection-related state
    const [selectedAccount, setSelectedAccount] = useState("");
    const [selectedCourses, setSelectedCourses] = useState({});
    // Account History Modal related state
    const [isAccountHistoryModalOpen, setIsAccountHistoryModalOpen] = useState(false); // State to control modal visibility
    // Function to handle opening the account history modal
    const handleViewAccountHistory = (accountId) => {
        setSelectedAccount(accountId);
        setIsAccountHistoryModalOpen(true);
    };
    // Pagination-related state
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    // Search-related state
    const [searchTerm, setSearchTerm] = useState("");
    // Modal-related state
    const [isAddNewAccountModalOpen, setIsAddNewAccountModalOpen] = useState(false);
    const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        type: ""
    });
    // Data-related state
    const [accounts, setAccounts] = useState([]);
    const [courses, setCourses] = useState([]);
    const [pendingEditData, setPendingEditData] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isCoursesFetching, setIsCoursesFetching] = useState(false);

    const handleExport = async () => {
        try {
            const filters = Object.entries(selectedCourses)
                .map(([course, sections]) => {
                    if (sections.length > 0) {
                        return `${course}:${sections.join(",")}`;
                    } else {
                        return course;
                    }
                })
                .join(";");

            const res = await api.get("/api/accounts/downloadAccounts", {
                params: {
                    filters,
                    searchTerm
                }
            });

            const data = res.data.rows;
            const worksheet = XLSX.utils.json_to_sheet(data);

            const colWidths = Object.keys(data[0] || {}).map((key) => {
                const maxLength = Math.max(
                    key.length,
                    ...data.map(row =>
                        row[key] ? row[key].toString().length : 0
                    )
                );

                return { wch: Math.min(maxLength + 2, 40) };
            });

            worksheet["!cols"] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");

            XLSX.writeFile(workbook, "accounts_export.xlsx");

        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const getAccounts = async () => {
        try {
            setIsFetching(true);

            const filters = Object.entries(selectedCourses)
                .map(([course, sections]) => {
                    if (sections.length > 0) {
                        return `${course}:${sections.join(',')}`;
                    } else {
                        return course;
                    }
                })
                .join(';');

            const res = await api.get("/api/accounts/getAccounts", {
                params: {
                    filters,
                    page,
                    limit,
                    searchTerm
                }
            });

            setAccounts(res.data.rows);
            setTotal(res.data.total);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleDelete = (student_Number) => {
        setConfirmationModal({
            isOpen: true,
            title: "Delete Account",
            message: [
                "Are you sure you want to delete this account?",
                "This action cannot be undone."
            ],
            onConfirm: () => performDelete(student_Number),
            type: "delete"
        })
    }

    const performDelete = async (student_number) => {
        try {
            const res = await api.delete(`/api/accounts/${student_number}`);

            toast.success(res.data.message || "Account deleted successfully!");

            getAccounts();
            fetchCourses();

        } catch (err) {
            console.error("Error deleting account:", err);
            toast.error(err.response?.data?.error || "Something went wrong.");
        }
    };

    const handleEdit = (selectedAccount) => {
        setSelectedAccount(selectedAccount);
        setIsEditAccountModalOpen(true);
    }

    const handleSaveConfirmation = (formData, selectedFile) => {
        setPendingEditData({ formData, selectedFile });
        setConfirmationModal({
            isOpen: true,
            title: "Save Changes",
            message: ["Are you sure you want to save these changes?"],
            onConfirm: () => {
                performEditSave(formData, selectedFile)
            }
        })
    }

    const performEditSave = async (formData, selectedFile) => {
        try {
            const form = new FormData();

            form.append("Name", formData.name);
            form.append("Student_Number", formData.student_number);
            form.append("Course", formData.course);
            form.append("Year_And_Section", formData.year_and_section);
            form.append("Email", formData.email);
            form.append("Account_Type", formData.account_type);

            if (selectedFile) {
                form.append("profileImage", selectedFile);
            }

            const res = await api.put(
                `/api/accounts/${selectedAccount.student_number}`,
                form
            );

            const data = res.data;

            toast.success(data.message || "Account updated successfully!");

            getAccounts();
            fetchCourses();
            setIsEditAccountModalOpen(false);

        } catch (err) {
            console.error("Error:", err);
            toast.error(err.response?.data?.error || "Something went wrong.");
        } finally {
            setPendingEditData(null);
        }
    };

    const fetchCourses = async () => {
        try {
            setIsCoursesFetching(true);
            const res = await api.get("/api/accounts/courses-with-sections");
            setCourses(res.data);
        } catch (err) {
            console.error("Error fetching courses:", err);
        } finally {
            setIsCoursesFetching(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        getAccounts();
    }, [page, limit]);

    const handleChangePage = (e, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (e) => {
        setLimit(parseInt(e.target.value, 10));
        setPage(0);
    };

    useEffect(() => {
        setPage(0);
        getAccounts();
    }, [searchTerm, selectedCourses]);

    const toggleSection = (course, section) => {
        setSelectedCourses(prev => {
            const sections = prev[course] || [];
            return {
                ...prev,
                [course]: sections.includes(section)
                    ? sections.filter(s => s !== section)
                    : [...sections, section]
            };
        });
    };

    const toggleCourse = (course) => {
        setSelectedCourses(prev => {
            if (prev[course]) {
                const newState = { ...prev };
                delete newState[course];
                return newState;
            } else {
                return { ...prev, [course]: [] };
            }
        });
    };

    const closeConfirmationModal = () => {
        setConfirmationModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: null,
            type: ""
        });
    };

    return (
        <>
            {/* Header */}
            <div className="flex px-4 pt-4 justify-between items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
                <h1 className="text-2xl ml-10">Accounts Page</h1>

                <div className="flex gap-x-6 justify-end items-center">
                    <button
                        className="hover:bg-gray-400 dark:hover:bg-gray-500 p-1.5 px-2 text-gray-900 dark:text-white text-sm rounded hover:cursor-pointer"
                        onClick={handleExport}
                    >
                        <DownloadIcon className="w-5 h-5 text-gray-700 dark:text-gray-100" />
                    </button>

                    <button
                        className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 p-1.5 px-3 text-gray-900 dark:text-white text-sm rounded hover:cursor-pointer"
                        onClick={() => setIsAddNewAccountModalOpen(true)}
                    >
                        Add Account +
                    </button>

                    <div className="h-8 w-80">
                        <input
                            type="text"
                            placeholder="Search . . ."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-full text-sm rounded-md px-3 outline-none focus:ring-1 focus:ring-green-500/30 border border-gray-400 dark:border-gray-600 placeholder-gray-400 dark:placeholder-white focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

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
                                ".dark &": { color: "white" },
                            },
                        }}
                    />
                </div>
            </div>

            {/* Main Body */}
            <div className="main-body flex flex-row bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white h-[calc(100vh-13vh)] p-4 gap-4">
                {/* Sidebar */}
                <aside className="side-bar bg-white dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-600 rounded-md flex flex-col w-64 p-4 overflow-y-auto scrollbar-hide">
                    <fieldset className="space-y-2 text-gray-900 dark:text-white">
                        <legend className="text-lg font-semibold">Select Courses :</legend>

                        {isCoursesFetching ? (
                            <div className="flex justify-center py-10">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            courses.map((c) => (
                                <div key={c.course} className="pl-5 space-y-1">
                                    <label className="flex items-center space-x-2 hover:cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!selectedCourses[c.course]}
                                            onChange={() => toggleCourse(c.course)}
                                            className="form-checkbox h-4 w-4 text-blue-400 dark:text-blue-500"
                                        />
                                        <span>{c.course}</span>
                                    </label>

                                    {selectedCourses[c.course] && (
                                        <div className="ml-6 space-y-1">
                                            {c.sections.map((section) => (
                                                <label
                                                    key={section}
                                                    className="flex items-center space-x-2 hover:cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCourses[c.course].includes(section)}
                                                        onChange={() => toggleSection(c.course, section)}
                                                        className="form-checkbox h-4 w-4 text-blue-400 dark:text-blue-500"
                                                    />
                                                    <span>{section}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </fieldset>
                </aside>

                {/* Main Table */}
                <main className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 overflow-auto rounded-md">
                    <table className="min-w-full border shadow-md overflow-hidden bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                        <thead className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                            <tr>
                                <th className="px-4 py-3 text-center text-sm font-semibold"></th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">Student Number</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">NAME</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">COURSE - YEAR & SECTION</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">EMAIL</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
                            {isFetching ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-20">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : accounts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500">
                                        No accounts found.
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((account, index) => (
                                    <tr
                                        key={account.student_number}
                                        className="hover:bg-gray-200 dark:hover:bg-gray-600"
                                    >
                                        <td className="px-8 py-2 text-xs whitespace-nowrap">
                                            {index + 1 + page * limit}
                                        </td>
                                        <td className="px-8 py-2 text-xs whitespace-nowrap">
                                            {account.student_number}
                                        </td>
                                        <td className="px-8 py-2 text-xs whitespace-nowrap">
                                            {account.name}
                                        </td>
                                        <td className="px-8 py-2 text-xs whitespace-nowrap">
                                            {account.course} - {account.year_and_section}
                                        </td>
                                        <td className="px-8 py-2 text-xs whitespace-nowrap">
                                            {account.email}
                                        </td>
                                        <td className="flex gap-x-2 justify-center items-center px-1 py-1">
                                            <button
                                                className="p-2 rounded-xl transition-all duration-200 hover:bg-blue-400/20 dark:hover:bg-blue-500/20 active:scale-95 cursor-pointer"
                                                onClick={() => handleViewAccountHistory(account)}
                                                title="View Account History"
                                            >
                                                <ListIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" />
                                            </button>
                                            <button
                                                className="p-2 rounded-xl transition-all duration-200 hover:bg-yellow-400/20 dark:hover:bg-yellow-500/20 active:scale-95 cursor-pointer"
                                                onClick={() => handleEdit(account)}
                                                title="Edit Account"
                                            >
                                                <EditIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors" />
                                            </button>
                                            <button
                                                className="p-2 rounded-xl transition-all duration-200 hover:bg-red-900/30 dark:hover:bg-red-700/30 active:scale-95 cursor-pointer"
                                                onClick={() => handleDelete(account.student_number)}
                                                title="Delete Account"
                                            >
                                                <DeleteIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </main>
            </div >

            {/* Modals */}
            < AddAccountModal
                isOpen={isAddNewAccountModalOpen}
                onClose={() => setIsAddNewAccountModalOpen(false)
                }
                onSuccess={() => {
                    getAccounts();
                    fetchCourses();
                }}
            />

            < EditAccountModal
                isOpen={isEditAccountModalOpen}
                onClose={() => setIsEditAccountModalOpen(false)}
                selectedAccount={selectedAccount}
                onSuccess={() => {
                    getAccounts();
                    fetchCourses();
                }}
                onSaveConfirmation={handleSaveConfirmation}
            />

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title={confirmationModal.title}
                message={confirmationModal.message}
                onConfirm={() => {
                    confirmationModal.onConfirm?.();
                    closeConfirmationModal();
                }}
                onCancel={closeConfirmationModal}
                type={confirmationModal.type}
            />

            <AccountHistoryModal
                isOpen={isAccountHistoryModalOpen}
                onClose={() => setIsAccountHistoryModalOpen(false)}
                selectedAccount={selectedAccount}
            />
        </>
    );
}

export default Accounts;