import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import UserPNG from "../../assets/UserPNG.png";
const API_URL = import.meta.env.VITE_API_URL;

function EditAccountModal({ isOpen, onClose, onSuccess, selectedAccount, onSaveConfirmation }) {
    const [formData, setFormData] = useState({
        name: "",
        course: "",
        year_and_section: "",
        email: "",
        student_number: "",
        account_type: ""
    });

    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (selectedAccount) {
            setFormData({
                name: selectedAccount.name,
                course: selectedAccount.course,
                year_and_section: selectedAccount.year_and_section,
                email: selectedAccount.email,
                student_number: selectedAccount.student_number,
                account_type: selectedAccount.account_type
            });
        }
        setSelectedFile(null);
    }, [selectedAccount]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl shadow-lg w-full max-w-3xl p-8 border border-gray-300 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-center mb-6">Edit Account</h2>

                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-24 h-24 rounded-full border-2 border-blue-600 p-1 shadow-md">
                            <img
                                src={
                                    selectedFile
                                        ? URL.createObjectURL(selectedFile)
                                        : selectedAccount?.profile_picture
                                            ? selectedAccount.profile_picture
                                            : UserPNG
                                }
                                alt="User avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            className="mt-3 text-sm text-blue-400 hover:underline hover:cursor-pointer"
                            onClick={() => fileInputRef.current.click()}
                        >
                            Change Photo
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                className="form-input-style"
                                required
                            />
                        </div>

                        {/* ID and Account Type */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">ID Number</label>
                                <div className="form-input-style bg-gray-100 dark:bg-gray-700 text-gray-400 border border-gray-300 dark:border-gray-600 cursor-not-allowed">
                                    {formData.student_number}
                                </div>
                            </div>

                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">Account Type</label>
                                <select
                                    name="account_type"
                                    value={formData.account_type}
                                    onChange={handleChange}
                                    className="form-input-style hover:cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Select Account Type</option>
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                </select>
                            </div>
                        </div>

                        {/* Course and Year */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">Course</label>
                                <input
                                    type="text"
                                    name="course"
                                    value={formData.course}
                                    onChange={handleChange}
                                    placeholder="BSIT / BSCS"
                                    className="form-input-style"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">Year & Section</label>
                                <input
                                    type="text"
                                    name="year_and_section"
                                    value={formData.year_and_section}
                                    onChange={handleChange}
                                    placeholder="e.g. 3A"
                                    className="form-input-style"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@email.com"
                                className="form-input-style"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        className="w-24 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition shadow-sm hover:cursor-pointer"
                        onClick={() => onSaveConfirmation(formData, selectedFile)}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        className="w-24 py-2 rounded-lg border border-gray-500 text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition hover:cursor-pointer"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditAccountModal;