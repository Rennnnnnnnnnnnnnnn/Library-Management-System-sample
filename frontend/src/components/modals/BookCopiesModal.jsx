import { useState, useEffect } from "react";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "react-toastify";
import ItemHistoryModal from "./ItemHistoryModal";
import ListIcon from "../../assets/icons/action-icons/ListIcon";
import EditIcon from "../../assets/icons/action-icons/EditIcon";
import DeleteIcon from "../../assets/icons/action-icons/DeleteIcon";
import api from "../../utils/api";
import LoadingSpinner from "../LoadingSpinner";

function BookCopiesModal({ isOpen, onClose, book, onUpdate }) {
    const [copies, setCopies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingCopy, setEditingCopy] = useState(null);

    // Add these state variables
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null
    });

    const fetchCopies = async () => {
        try {
            setLoading(true);
            setError(null); // Reset error state
            const res = await api.get("/api/resources/getBookCopies", {
                params: {
                    title: book.title,
                    author: book.author,
                    type: book.type,
                },
            });
            setCopies(res.data || []);
        } catch (err) {
            if (err.response?.status === 404) {
                // This is the "No more copies" scenario
                setCopies([]);
                setError(null); // Not a real error, just an empty state
            } else {
                setError("Error fetching copies.");
            }
        } finally {
            // This runs no matter what, stopping the "Loading..." state
            setLoading(false);
        }
    };
    const handleView = (copy) => {
        setSelectedItem(copy);
        setIsHistoryModalOpen(true);
    };

    useEffect(() => {
        fetchCopies();

        return () => {
            if (!isOpen) {
                setCopies([]);
                setLoading(false);
                setError(null);
                setEditingCopy(null);
            }
        };
    }, [isOpen, book]);

    if (!isOpen) return null;


    const handleEdit = (copy) => {
        setEditingCopy({
            item_id: copy.item_id,
            title: copy.title || book.title,
            author: copy.author || book.author,
            type: copy.type || book.type,
            status: copy.status,
        });
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
            const res = await api.delete(`/api/resources/books/${item_id}`);

            if (res.status === 200) {
                toast.success("Resource deleted successfully!");

                // 2. Cose the confirmation modal
                setConfirmationModal({ isOpen: false });

                // 3. Silently fetch in the background to ensure sync with DB
                fetchCopies();
                onUpdate();
            }
        } catch (err) {
            console.error("Error deleting resource:", err);
            toast.error("Something went wrong.");
        }
    };

    const handleSave = async () => {
        try {
            const response = await api.put("/api/resources/updateResource", {
                category: "Book",
                item_id: editingCopy.item_id,
                title: editingCopy.title,
                author: editingCopy.author,
                type: editingCopy.type,
                status: editingCopy.status,
            });

            if (response.status === 200) {
                console.log("Copy updated successfully:", response.data);
                setEditingCopy(null);
                // Optionally, refresh the copy list or update state here
                setCopies(copies.map((copy) =>
                    copy.item_id === editingCopy.item_id ? editingCopy : copy
                ));
                fetchCopies();
                onUpdate();
            }
        } catch (err) {
            console.error("Error saving copy:", err);
            setError("Error updating copy.");
        }
        setEditingCopy(null);
    };

    const handleCancel = () => {
        setEditingCopy(null);
    };

    const handleInputChange = (e, field) => {
        setEditingCopy({
            ...editingCopy,
            [field]: e.target.value,
        });
    };

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300">
                <div className="bg-white dark:bg-gray-800 h-auto rounded-2xl shadow-xl w-auto p-10">
                    {/* Close Button */}
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={onClose}
                            className="text-gray-700 dark:text-white hover:cursor-pointer"
                        >
                            ×
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row mb-8 gap-4">
                        {/* Book Details Section */}
                        <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl flex-col shadow-lg w-1/3">
                            <h3 className="font-semibold text-2xl mb-4 text-center text-gray-900 dark:text-white">Book Details</h3>
                            <div className="space-y-4 text-gray-800 dark:text-gray-200">
                                {editingCopy ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <p className="font-semibold text-gray-600 dark:text-gray-300">Copy ID:</p>
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{editingCopy.item_id}</span>
                                        </div>

                                        {/* Title */}
                                        <div className="flex flex-col">
                                            <label className="text-gray-600 dark:text-gray-300 font-semibold" htmlFor="title">Title:</label>
                                            <input
                                                id="title"
                                                type="text"
                                                value={editingCopy.title}
                                                onChange={(e) => handleInputChange(e, "title")}
                                                className="form-input-style"
                                                placeholder="Enter book title"
                                            />
                                        </div>

                                        {/* Author */}
                                        <div className="flex flex-col">
                                            <label className="text-gray-600 dark:text-gray-300 font-semibold" htmlFor="author">Author:</label>
                                            <input
                                                id="author"
                                                type="text"
                                                value={editingCopy.author}
                                                onChange={(e) => handleInputChange(e, "author")}
                                                className="form-input-style"
                                                placeholder="Enter author name"
                                            />
                                        </div>

                                        {/* Type */}
                                        <div className="flex flex-col">
                                            <label className="text-gray-600 dark:text-gray-300 font-semibold" htmlFor="type">Type:</label>
                                            <input
                                                id="type"
                                                type="text"
                                                value={editingCopy.type}
                                                onChange={(e) => handleInputChange(e, "type")}
                                                className="form-input-style"
                                                placeholder="Enter book type"
                                            />
                                        </div>

                                        {/* Status */}
                                        <div className="flex flex-col">
                                            <label className="text-gray-600 dark:text-gray-300 font-semibold" htmlFor="status">Status:</label>
                                            <select
                                                id="status"
                                                value={editingCopy.status}
                                                onChange={(e) => handleInputChange(e, "status")}
                                                className="form-input-style hover:cursor-pointer"
                                            >
                                                <option value="Available" className="bg-gray-100 dark:bg-gray-700">Available</option>
                                                <option value="Checked Out" className="bg-gray-100 dark:bg-gray-700">Checked Out</option>
                                                <option value="Archived" className="bg-gray-100 dark:bg-gray-700">Archived</option>
                                                <option value="Disposed" className="bg-gray-100 dark:bg-gray-700">Disposed</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div><span>Title:</span> {book.title}</div>
                                        <div><span>Author:</span> {book.author}</div>
                                        <div><span>Type:</span> {book.type}</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Copy Details Section */}
                        <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl flex-1 shadow-lg">
                            <h3 className="font-semibold text-2xl mb-4 text-center text-gray-900 dark:text-white">Copy Details</h3>
                            <div className="max-h-full overflow-y-auto">

                                <table className="min-w-full table-auto border-collapse">
                                    <thead className="bg-gray-200 dark:bg-gray-600">
                                        <tr>
                                            <th className="px-4 py-3 w-70 text-left text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Copy Number</th>
                                            <th className="px-4 py-3 w-70 text-left text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Item ID</th>
                                            <th className="px-4 py-3 w-70 text-left text-sm text-gray-700 dark:text-gray-300">Status</th>
                                            <th className="px-4 py-3 w-70 text-left text-sm text-gray-700 dark:text-gray-300"></th>
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

                                        ) : copies.length === 0 ? (
                                            /* EMPTY */
                                            <tr>
                                                <td colSpan="4" className="text-center py-10 text-gray-500 italic">
                                                    No copies found for this title.
                                                </td>
                                            </tr>

                                        ) : (
                                            /* DATA */
                                            copies.map((copy, index) => (
                                                <tr key={copy.item_id} className="border-b hover:bg-gray-200 dark:hover:bg-gray-800">
                                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{index + 1}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{copy.item_id}</td>
                                                    <td className={`px-4 py-3 text-sm whitespace-nowrap 
                                                        ${copy.status === "Available" ? 'text-green-500'
                                                            : copy.status === "Checked Out" ? 'text-red-500'
                                                                : copy.status === "Archived" ? 'text-yellow-500'
                                                                    : copy.status === "Disposed" ? 'text-blue-500'
                                                                        : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {copy.status}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex space-x-3 justify-start">
                                                            {editingCopy?.item_id === copy.item_id ? (
                                                                <>
                                                                    <button
                                                                        onClick={handleSave}
                                                                        className="py-1.5 w-18 rounded-lg bg-blue-700 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition shadow-sm cursor-pointer"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        onClick={handleCancel}
                                                                        className="py-1.5 w-18 rounded-lg border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition cursor-pointer"
                                                                    //  className="px-4 py-2 rounded-lg border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        className="group p-2 rounded-xl transition-all duration-200 hover:bg-blue-400/20 dark:hover:bg-blue-500/20 active:scale-95 cursor-pointer"
                                                                        onClick={() => handleView(copy)}
                                                                        title="View Copy History"
                                                                    >
                                                                        <ListIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" />
                                                                    </button>
                                                                    <button
                                                                        className="group p-2 rounded-xl transition-all duration-200 hover:bg-yellow-400/20 dark:hover:bg-yellow-500/20 active:scale-95 cursor-pointer"
                                                                        onClick={() => handleEdit(copy)}
                                                                        title="Edit Copy"
                                                                    >
                                                                        <EditIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors" />
                                                                    </button>
                                                                    <button
                                                                        className="group p-2 rounded-xl transition-all duration-200 hover:bg-red-900/30 dark:hover:bg-red-700/30 active:scale-95 cursor-pointer"
                                                                        onClick={() => handleDelete(copy.item_id)}
                                                                        title="Delete Copy"
                                                                    >
                                                                        <DeleteIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}

                                    </tbody>


                                </table>

                            </div>
                            <div className="flex text-center mt-4 text-gray-800 dark:text-gray-200 justify-start">
                                {copies.length > 0 && (
                                    <span>
                                        {copies.filter((copy) => copy.status === "Available").length > 1
                                            ? `${copies.filter((copy) => copy.status === "Available").length} / ${copies.length} available copies`
                                            : copies.filter((copy) => copy.status === "Available").length === 0
                                                ? `0 / ${copies.length} No available copy`
                                                : `1 / ${copies.length} Available copy`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title={confirmationModal.title}
                message={confirmationModal.message}
                onConfirm={confirmationModal.onConfirm}
                onCancel={() => setConfirmationModal({ isOpen: false })}
            />

            <ItemHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                selectedItem={selectedItem}
                book={book}
            />

        </>
    );
}

export default BookCopiesModal;