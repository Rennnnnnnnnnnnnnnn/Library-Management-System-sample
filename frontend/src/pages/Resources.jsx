import { useEffect, useState } from "react";
import TablePagination from "@mui/material/TablePagination";
import { toast } from "react-toastify";
import qs from "qs";
import * as XLSX from "xlsx";
import api from "../utils/api";
import formatDate from "../utils/formatDate";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import AddNewResourceModal from "../components/modals/AddNewResourceModal";
import EditAcademicPaperModal from "../components/modals/EditAcademicPaperModal";
import BookCopiesModal from "../components/modals/BookCopiesModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import ItemHistoryModal from "../components/modals/ItemHistoryModal";
import EyeIcon from "../assets/icons/action-icons/EyeIcon";
import ListIcon from "../assets/icons/action-icons/ListIcon";
import EditIcon from "../assets/icons/action-icons/EditIcon";
import DeleteIcon from "../assets/icons/action-icons/DeleteIcon";
import DownloadIcon from "../assets/icons/action-icons/DownloadIcon";

function Resources() {
    // Modal state
    const [isEditAcademicPaperResourceModalOpen, setIsAcademicPaperEditResourceModalOpen] = useState(false);
    const [selectedAcademicPaper, setSelectedAcademicPaper] = useState(null);
    const [isCopiesModalOpen, setIsCopiesModalOpen] = useState(false);
    const [isAddNewResourceModalOpen, setIsAddNewResourceModalOpen] = useState(false);
    const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
    // Confirmation modal state
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        type: ""
    });
    // Selected book and its copies
    const [selectedBook, setSelectedBook] = useState(null);
    const [bookCopies, setBookCopies] = useState([]);
    // Data related to resources (items, book types, paper types)
    const [items, setItems] = useState([]);
    const [bookTypes, setBookTypes] = useState([]);
    const [paperTypes, setPaperTypes] = useState([]);
    const [selectedResource, setSelectedResource] = useState(null);
    // Selection-related state
    const [selectedCategory, setSelectedCategory] = useState("academic-papers");
    const [selectedTypes, setSelectedTypes] = useState([]);
    // Pagination-related state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    // Search-related state
    const [searchTerm, setSearchTerm] = useState("");

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isTypesFetching, setIsTypesFetching] = useState(false);

    const getResources = async () => {
        try {
            setIsFetching(true);
            const res = await api.get("/api/resources", {
                params: {
                    category: selectedCategory,
                    page: page + 1,
                    limit: rowsPerPage,
                    types: selectedTypes,
                    searchTerm
                },
                paramsSerializer: (params) =>
                    qs.stringify(params, { arrayFormat: "repeat" })
            });

            setItems(res.data.rows);
            setTotal(res.data.total_copies);
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const fetchDistinctTypes = async () => {
        if (!selectedCategory) return;
        try {
            setIsTypesFetching(true);
            const res = await api.get("/api/resources/types", {
                params: { category: selectedCategory }
            });

            if (selectedCategory === "books") {
                setBookTypes(res.data);
            } else if (selectedCategory === "academic-papers") {
                setPaperTypes(res.data);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsTypesFetching(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.get("/api/resources/downloadResources", {
                params: {
                    category: selectedCategory,
                    types: selectedTypes,
                    searchTerm
                },
                paramsSerializer: (params) =>
                    qs.stringify(params, { arrayFormat: "repeat" })
            });

            const data = res.data.rows;

            // 🧾 Format date columns BEFORE Excel conversion
            const formattedData = data.map((row) => ({
                ...row,
                academic_year: row.academic_year
                    ? new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    }).format(new Date(row.academic_year))
                    : "",
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);

            // 📏 AUTO-FIT COLUMNS
            const colWidths = Object.keys(formattedData[0] || {}).map((key) => {
                const maxLength = Math.max(
                    key.length,
                    ...formattedData.map((row) =>
                        row[key] ? row[key].toString().length : 0
                    )
                );

                return { wch: Math.min(maxLength + 2, 50) };
            });

            worksheet["!cols"] = colWidths;

            // 🎯 CENTER HEADERS + LEFT ALIGN DATA
            const range = XLSX.utils.decode_range(worksheet["!ref"]);

            for (let C = range.s.c; C <= range.e.c; C++) {
                const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });

                if (!worksheet[headerCell]) continue;

                // header style
                worksheet[headerCell].s = {
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    font: { bold: true },
                };
            }

            // data alignment (left)
            for (let R = 1; R <= range.e.r; R++) {
                for (let C = 0; C <= range.e.c; C++) {
                    const cell = XLSX.utils.encode_cell({ r: R, c: C });

                    if (!worksheet[cell]) continue;

                    worksheet[cell].s = {
                        alignment: {
                            horizontal: "left",
                            vertical: "center",
                        },
                    };
                }
            }

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Resources");

            XLSX.writeFile(workbook, "resources_export.xlsx");
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const handleView = (item) => {
        setSelectedItem(item);
        setIsHistoryModalOpen(true);
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

    const handleViewCopies = (book) => {
        setSelectedBook(book);
        setIsCopiesModalOpen(true);
    };

    const handleCheckboxChange = (type) => {
        setSelectedTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        );
    };

    const handleDelete = (item_id) => {
        setConfirmationModal({
            isOpen: true,
            title: "Delete Resource",
            message: [
                "Are you sure you want to delete this resource?",
                "This action cannot be undone."
            ],
            onConfirm: () => performDelete(item_id),
            type: "delete"
        });
    };

    const performDelete = async (item_id) => {
        try {
            const res = await api.delete(`/api/resources/${selectedCategory}/${item_id}`);
            if (res.status === 200) {
                toast.success("Resource deleted successfully!");
                getResources();
            } else {
                toast.error("Failed to delete resource.");
            }
        } catch (err) {
            console.error("Error deleting resource:", err);
            toast.error("Something went wrong.");
        }
    };

    const handleEdit = (item) => {
        setSelectedResource(item);
        setIsEditBookModalOpen(true);
    };

    const handleChangePage = (e, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    useEffect(() => {
        if (!selectedCategory) return;
        getResources();
    }, [selectedCategory, page, rowsPerPage, selectedTypes, searchTerm]);

    useEffect(() => {
        setPage(0);
    }, [selectedCategory, selectedTypes, searchTerm, rowsPerPage]);

    useEffect(() => {
        fetchDistinctTypes();
    }, [selectedCategory]);

    return (
        <>
            {/* Header */}
            <div className="flex px-4 pt-4 justify-between items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white max-h-[calc(100vh-13vh)] scrollbar-hide">
                <h1 className="text-xl font-semibold ml-10">
                    {selectedCategory
                        ? selectedCategory === "books"
                            ? "Books"
                            : "Academic Papers"
                        : "Please select a category"}
                </h1>
                <div className="flex gap-x-6 justify-end items-center">

                    <button
                        className="hover:bg-gray-400 dark:hover:bg-gray-500 p-1.5 px-2 text-gray-900 dark:text-white text-sm rounded hover:cursor-pointer"
                        onClick={handleExport}
                    >
                        <DownloadIcon className="w-5 h-5 text-gray-700 dark:text-gray-100" />
                    </button>

                    <button
                        className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 p-1.5 px-3 text-gray-900 dark:text-white text-sm rounded hover:cursor-pointer"
                        onClick={() => setIsAddNewResourceModalOpen(true)}
                    >
                        Add Item +
                    </button>

                    <div className="h-8 w-80">
                        <input
                            type="text"
                            placeholder="Search . . ."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-full text-sm rounded-md px-3 outline-none focus:ring-1 focus:ring-green-500/30 border border-gray-400 placeholder-gray-400 focus:border-green-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-white"
                        />
                    </div>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
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
            <div className="main-body flex flex-row gap-x-4 p-4 h-[calc(100vh-13vh)] bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
                {/* Sidebar */}
                <aside className="side-bar bg-white dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-600 rounded-md flex flex-col w-64 p-4">
                    {/* Academic Papers */}
                    <div className="flex flex-col gap-y-2 mt-4">
                        <div className="flex items-center gap-x-2 font-semibold text-gray-900 dark:text-white">
                            <input
                                type="radio"
                                id="academic-papers"
                                name="category"
                                value="academic-papers"
                                checked={selectedCategory === "academic-papers"}
                                onChange={() => {
                                    setSelectedCategory("academic-papers");
                                    setSelectedTypes([]);
                                }}
                            />
                            <label htmlFor="academic-papers" className="hover:cursor-pointer">Academic Papers</label>
                        </div>

                        {selectedCategory === "academic-papers" && (
                            <div className="pl-6 space-y-1">
                                {selectedCategory === "academic-papers" && (
                                    <div className="pl-6 space-y-1">
                                        {isTypesFetching ? (
                                            <div className="py-4">
                                                <LoadingSpinner />
                                            </div>
                                        ) : (
                                            paperTypes.map((type, index) => (
                                                <label
                                                    key={index}
                                                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTypes.includes(type)}
                                                        onChange={() => handleCheckboxChange(type)}
                                                        className="cursor-pointer"
                                                    />
                                                    <span>{type}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Books */}
                    <div className="flex flex-col gap-y-2 mt-4">
                        <div className="flex items-center gap-x-2 font-semibold text-gray-900 dark:text-white">
                            <input
                                type="radio"
                                id="books"
                                name="category"
                                value="books"
                                checked={selectedCategory === "books"}
                                onChange={() => {
                                    setSelectedCategory("books");
                                    setSelectedTypes([]);
                                }}
                            />
                            <label htmlFor="books" className="hover:cursor-pointer">Books</label>
                        </div>

                        {selectedCategory === "books" && (
                            <div className="pl-6 space-y-1">
                                {selectedCategory === "books" && (
                                    <div className="pl-6 space-y-1">
                                        {isTypesFetching ? (
                                            <div className="py-4">
                                                <LoadingSpinner />
                                            </div>
                                        ) : (
                                            bookTypes.map((type, index) => (
                                                <label
                                                    key={index}
                                                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTypes.includes(type)}
                                                        onChange={() => handleCheckboxChange(type)}
                                                        className="cursor-pointer"
                                                    />
                                                    <span>{type}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Table */}
                <main className="flex-1 overflow-auto rounded-md bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                    <div className="overflow-x-auto overflow-y-auto scrollbar-hide">
                        <table className="min-w-full border shadow-md overflow-hidden bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                            <thead className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                                <tr>
                                    {selectedCategory === "books" ? (
                                        <>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap"></th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">TITLE</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">AUTHOR</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">TYPE</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">AVAILABILITY</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap"></th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap"></th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">ITEM ID</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">TITLE</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">AUTHOR</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">TYPE</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">ACADEMIC YEAR</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">COURSE</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">STATUS</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap"></th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {isFetching ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-20">
                                            <LoadingSpinner />
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-10 text-gray-500">
                                            No items to display.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-200 dark:hover:bg-gray-600">
                                            {selectedCategory === "books" ? (
                                                <>
                                                    <td className="px-8 py-2 text-xs whitespace-nowrap">{page * rowsPerPage + index + 1}</td>
                                                    <td className="px-4 py-2 text-xs whitespace-nowrap">{item.title}</td>
                                                    <td className="px-4 py-2 text-xs whitespace-nowrap">{item.author}</td>
                                                    <td className="px-4 py-2 text-xs whitespace-nowrap">{item.type}</td>
                                                    <td className="px-4 py-2 text-xs whitespace-nowrap">
                                                        {item.available_copies > "1"
                                                            ? `${item.available_copies}/${item.total_copies} Available copies`
                                                            : item.available_copies === "0"
                                                                ? `0/${item.total_copies} No available copy`
                                                                : `1/${item.total_copies} Available copy`}
                                                    </td>
                                                    <td className="px-4 py-2 flex gap-2 justify-center items-center whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleViewCopies(item)}
                                                            className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-700/20 active:scale-95 hover:cursor-pointer"
                                                        >
                                                            <EyeIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" />
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-8 py-2 text-xs">{page * rowsPerPage + index + 1}</td>
                                                    <td className="px-8 py-2 text-xs whitespace-nowrap">{item.item_id}</td>
                                                    <td className="px-8 py-2 text-xs whitespace-nowrap">{item.title}</td>
                                                    <td className="px-4 py-2 text-xs whitespace-nowrap">{item.author}</td>
                                                    <td className="px-4 py-2 text-xs whitespace-nowrap">{item.type}</td>
                                                    <td className="px-4 py-2 text-xs whitespace-nowrap">{item.academic_year}</td>
                                                    <td className="px-4 py-2 text-xs whitespace-nowrap">{item.course}</td>
                                                    <td className={`px-4 py-3 text-xs whitespace-nowrap 
                                                            ${item.status === "Available" ? 'text-green-500'
                                                            : item.status === "Checked Out" ? 'text-red-500'
                                                                : item.status === "Archived" ? 'text-yellow-500'
                                                                    : item.status === "Disposed" ? 'text-blue-500'
                                                                        : 'text-gray-500 dark:text-gray-200'}`}>
                                                        {item.status}
                                                    </td>
                                                    <td className="px-4 py-2 flex gap-2 justify-center items-center">
                                                        <button
                                                            className="p-2 rounded-xl transition-all duration-200 hover:bg-blue-400/20 dark:hover:bg-blue-500/20 active:scale-95 cursor-pointer"
                                                            onClick={() => handleView(item)}
                                                            title="View History"
                                                        >
                                                            <ListIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" />
                                                        </button>
                                                        <button
                                                            className="p-2 rounded-xl transition-all duration-200 hover:bg-yellow-400/20 dark:hover:bg-yellow-500/20 active:scale-95 cursor-pointer"
                                                            onClick={() => handleEdit(item)}
                                                            title="Edit Item"
                                                        >
                                                            <EditIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors" />
                                                        </button>
                                                        <button
                                                            className="p-2 rounded-xl transition-all duration-200 hover:bg-red-900/30 dark:hover:bg-red-700/30 active:scale-95 cursor-pointer"
                                                            onClick={() => handleDelete(item.item_id)}
                                                            title="Delete Item"
                                                        >
                                                            <DeleteIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            {/* Modals */}
            <AddNewResourceModal
                isOpen={isAddNewResourceModalOpen}
                onClose={() => setIsAddNewResourceModalOpen(false)}
                onUpdate={() => {
                    getResources();
                    fetchDistinctTypes();
                }}
            />

            <BookCopiesModal
                isOpen={isCopiesModalOpen}
                onClose={() => setIsCopiesModalOpen(false)}
                book={selectedBook}
                onUpdate={() => {
                    getResources();
                    fetchDistinctTypes();
                }}
            />

            <EditAcademicPaperModal
                isOpen={isEditBookModalOpen}
                onClose={() => setIsEditBookModalOpen(false)}
                academicPaper={selectedResource}
                onUpdate={() => {
                    getResources();
                    setIsEditBookModalOpen(false);
                }}
            />

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title={confirmationModal.title}
                message={confirmationModal.message}
                onConfirm={() => {
                    confirmationModal.onConfirm();
                    closeConfirmationModal();
                }}
                onCancel={closeConfirmationModal}
            />

            <ItemHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                selectedItem={selectedItem}
            />
        </>
    );
}

export default Resources;