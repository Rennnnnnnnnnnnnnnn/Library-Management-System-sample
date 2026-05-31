import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";

function AddNewResourceModal({ isOpen, onClose, onUpdate }) {

    const [formData, setFormData] = useState({
        item_id: "",
        category: "",
        title: "",
        author: "",
        academicYear: "",
        course: "",
        type: "",
        status: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            item_id: "",
            title: "",
            author: "",
            academicYear: "",
            course: "",
            type: "",
            status: "",
        }))
    }, [formData.category]);

    const handleClose = () => {
        setFormData({
            item_id: "",
            category: "",
            title: "",
            author: "",
            academicYear: "",
            course: "",
            type: "",
            status: "",
        })
        onClose();
    }

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            const res = await api.post("/api/resources/addResources", formData);

            toast.success(res.data.message || "Item added successfully.");
            onClose();
            onUpdate();

        } catch (error) {
            console.error("Error:", error);
            toast.error(
                error.response?.data?.error || "Something went wrong"
            );
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-xs z-50 p-4">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-6 rounded-lg relative w-full max-w-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-center mb-4">Add New Resource</h2>
                <form className="space-y-4" onSubmit={handleSave}>
                    {/* CATEGORY SELECT */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                            Category:
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="form-input-style"
                        >
                            <option value="" disabled>Select a category</option>
                            <option value="Academic Paper">Academic Paper</option>
                            <option value="Book">Book</option>
                        </select>
                    </div>

                    {/* Academic Paper Form */}
                    {formData.category === "Academic Paper" && (
                        <>
                            <div className="flex flex-row gap-4">
                                <div className="flex flex-1 flex-col gap-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Item Number:</label>
                                        <input type="text" name="item_id" value={formData.item_id} onChange={handleInputChange} placeholder="Please enter Item Number" className="form-input-style" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Title:</label>
                                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter title" className="form-input-style" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Author:</label>
                                        <input type="text" name="author" value={formData.author} onChange={handleInputChange} placeholder="Please enter author" className="form-input-style" required />
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col gap-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Academic Year:</label>
                                        <input type="text" name="academicYear" value={formData.academicYear} onChange={handleInputChange} placeholder="Please enter academic year" className="form-input-style" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Course:</label>
                                        <input type="text" name="course" value={formData.course} onChange={handleInputChange} placeholder="Please enter the student's course" className="form-input-style" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Type:</label>
                                        <input type="text" name="type" value={formData.type} onChange={handleInputChange} placeholder="Please enter the type" className="form-input-style" required />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Status:</label>
                                <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="form-input-style" required>
                                    <option value="" disabled>Select status</option>
                                    <option value="Available">Available</option>
                                    <option value="Checked Out">Checked Out</option>
                                    <option value="Archived">Archived</option>
                                    <option value="Disposed">Disposed</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Book Form */}
                    {formData.category === "Book" && (
                        <>
                            <div className="flex flex-row gap-4">
                                <div className="flex flex-1 flex-col gap-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Item Number:</label>
                                        <input type="text" name="item_id" value={formData.item_id} onChange={handleInputChange} placeholder="Please enter Item Number" className="form-input-style" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Title:</label>
                                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter title" className="form-input-style" required />
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col gap-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Author:</label>
                                        <input type="text" name="author" value={formData.author} onChange={handleInputChange} placeholder="Please enter author" className="form-input-style" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Type:</label>
                                        <input type="text" name="type" value={formData.type} onChange={handleInputChange} placeholder="Please enter the type" className="form-input-style" required />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Status:</label>
                                <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="form-input-style" required>
                                    <option value="" disabled>Select status</option>
                                    <option value="Available">Available</option>
                                    <option value="Checked Out">Checked Out</option>
                                    <option value="Archived">Archived</option>
                                    <option value="Disposed">Disposed</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Buttons */}
                    <div className="buttons flex justify-end gap-x-4">
                        {formData.category && (
                            <button type="submit" className="w-20 py-1 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition shadow-sm hover:cursor-pointer">
                                Save
                            </button>
                        )}
                        <button onClick={handleClose} className="px-4 py-2 rounded-lg border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddNewResourceModal;