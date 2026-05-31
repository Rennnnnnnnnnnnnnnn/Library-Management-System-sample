import React, { useState, useEffect } from "react";

function EditBookModal({
    isOpen,
    onClose,
    selectedResource,
    onSaveConfirmation
}) {
    const [formData, setFormData] = useState({
        Title_Name: "",
        Author_Name: "",
        Type: "",
        Status: "",
        Academic_Year: "",
        Course: ""
    });

    useEffect(() => {
        if (selectedResource) {
            setFormData({
                Title_Name: selectedResource.Title_Name || "",
                Author_Name: selectedResource.Author_Name || "",
                Type: selectedResource.Type || "",
                Status: selectedResource.Status || "",
                Academic_Year: selectedResource.Academic_Year || "",
                Course: selectedResource.Course || ""
            });
        }
    }, [selectedResource]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6">

                <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
                    Edit Resource
                </h2>

                {/* FORM */}
                <div className="flex flex-col space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            name="Title_Name"
                            value={formData.Title_Name}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    {/* Author */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Author</label>
                        <input
                            type="text"
                            name="Author_Name"
                            value={formData.Author_Name}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* Type */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700">Type</label>
                            <input
                                type="text"
                                name="Type"
                                value={formData.Type}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        {/* Status */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <input
                                type="text"
                                name="Status"
                                value={formData.Status}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {/* Academic Year */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700">Academic Year</label>
                            <input
                                type="text"
                                name="Academic_Year"
                                value={formData.Academic_Year}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        {/* Course */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700">Course</label>
                            <input
                                type="text"
                                name="Course"
                                value={formData.Course}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                    </div>

                </div>

                {/* BUTTONS */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => onSaveConfirmation(formData)}
                    >
                        Save Changes
                    </button>

                    <button
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>

            </div>
        </div>
    );
}

export default EditBookModal;