import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import formatDate from "../../utils/formatDate";
import api from "../../utils/api";

function EditAcademicPaperModal({ isOpen, onClose, academicPaper, onUpdate }) {

    const [formData, setFormData] = useState({
        item_id: "",
        title: "",
        author: "",
        academicYear: "",
        course: "",
        type: "",
        status: "",
        category: "Academic Paper", // Hardcoding the category as "Academic Paper"
    });

    // Populate form data with the existing resource when modal opens
    useEffect(() => {
        if (academicPaper) {
            setFormData({
                item_id: academicPaper.item_id,
                title: academicPaper.title,
                author: academicPaper.author,
                academic_year: academicPaper.academic_year,
                course: academicPaper.course,
                type: academicPaper.type,
                status: academicPaper.status,
                category: "Academic Paper", // Ensure category is set here too
            });
        }
    }, [academicPaper, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleClose = () => {
        onClose();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        console.log("Saving edited academic paper:", formData);

        try {
            // Sending PUT request to update the academic paper details
            const response = await api.put("/api/resources/updateResource", {
                category: "Academic Paper", // Always "Academic Paper" for this modal
                item_id: formData.item_id,
                title: formData.title,
                author: formData.author,
                academic_year: formData.academic_year,
                course: formData.course,
                type: formData.type,
                status: formData.status,
            });

            // If the response is successful, handle the result
            if (response.status === 200) {
                console.log("Academic Paper updated successfully:", response.data);
                toast.success("Resource updated successfully.");
                onUpdate();  // Optionally, refresh the resource list or update the state
                onClose();   // Close the modal after the save
            }
        } catch (error) {
            // Handle error if the PUT request fails
            console.error("Error saving academic paper:", error);
            toast.error(error.response?.data?.error || "An error occurred while updating.");
        }

        // Reset after saving (close the modal)
        setFormData({
            item_id: "",
            title: "",
            author: "",
            academic_year: "",
            course: "",
            type: "",
            status: "",
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-6 rounded-xl shadow-xl w-full max-w-3xl relative">

                <h2 className="text-xl text-center font-semibold mb-6">Edit Resource</h2>

                <form className="space-y-6" onSubmit={handleSave}>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            {/* ID NUMBER */}
                            <div>
                                <label className="text-sm font-medium block mb-1">Item Number:</label>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm">
                                    {formData.item_id || "—"}
                                </div>
                            </div>

                            {/* TITLE INPUT */}
                            <div>
                                <label className="text-sm font-medium block mb-1">Title:</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter title"
                                    className="form-input-style"
                                    required
                                />
                            </div>

                            {/* AUTHOR INPUT */}
                            <div>
                                <label className="text-sm font-medium block mb-1">Author:</label>
                                <input
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    placeholder="Enter author"
                                    className="form-input-style"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {/* ACADEMIC YEAR */}
                            <div>
                                <label className="text-sm font-medium block mb-1">Academic Year:</label>
                                <input
                                    type="text"
                                    name="academic_year"
                                    value={formData.academic_year}
                                    onChange={handleInputChange}
                                    placeholder="Enter academic year"
                                    className="form-input-style"
                                    required
                                />
                            </div>

                            {/* COURSE */}
                            <div>
                                <label className="text-sm font-medium block mb-1">Course:</label>
                                <input
                                    type="text"
                                    name="course"
                                    value={formData.course}
                                    onChange={handleInputChange}
                                    placeholder="Enter course"
                                    className="form-input-style"
                                    required
                                />
                            </div>

                            {/* TYPE */}
                            <div>
                                <label className="text-sm font-medium block mb-1">Type:</label>
                                <input
                                    type="text"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    placeholder="Enter type"
                                    className="form-input-style"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* STATUS SELECT */}
                    <div>
                        <label className="text-sm font-medium block mb-1">Status:</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="form-input-style hover:cursor-pointer"
                            required
                        >
                            <option value="" disabled>Select status</option>
                            <option value="Available">Available</option>
                            <option value="Checked Out">Checked Out</option>
                            <option value="Archived">Archived</option>
                            <option value="Disposed">Disposed</option>
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-4 mt-4">
                        <button
                            type="submit"
                            className="w-24 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition shadow-sm hover:cursor-pointer"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg border border-gray-400 text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition hover:cursor-pointer"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditAcademicPaperModal;