import React, { useState, useRef } from "react";
import UserPNG from "../../assets/UserPNG.png";
import { toast } from "react-toastify";
import api from "../../utils/api";

const AddAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    year_and_section: "",
    email: "",
    student_number: "",
    account_type: ""
  });

  const resetForm = () => {
    setFormData({
      name: "",
      course: "",
      year_and_section: "",
      email: "",
      student_number: "",
      account_type: ""
    });

    setSelectedFile(null);
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const form = new FormData();

      Object.entries(formData).forEach(([key, value]) =>
        form.append(key, value)
      );

      if (selectedFile) {
        form.append("profileImage", selectedFile);
      }

      const res = await api.post("/api/accounts/addAccount", form);

      // Axios response data
      const data = res.data;

      if (res.status === 201) {
        resetForm();
        setSelectedFile(null);

        toast.success(data.message || "Account added successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to add account.");
      }
    } catch (err) {
      console.error("Error:", err);

      // IMPORTANT: backend errors land here
      const message =
        err.response?.data?.error || "Something went wrong.";

      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-xs z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-2xl p-8 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white text-center">
          Create New Account
        </h2>

        <div className="flex gap-6 items-start">
          {/* Avatar */}
          <div className="flex flex-col flex-shrink-0 justify-center items-center">
            <div className="w-[100px] h-[100px] rounded-full border-2 border-blue-600 p-1 shadow-md">
              <img
                src={selectedFile ? URL.createObjectURL(selectedFile) : UserPNG}
                alt="User avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <button
              type="button"
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline hover:cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              Add Photo
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
          <div className="flex-1">
            <div className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
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

              <div className="flex gap-4">
                {/* Student Number */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Number</label>
                  <input
                    type="number"
                    name="student_number"
                    value={formData.student_number}
                    onChange={handleChange}
                    placeholder="ID Number"
                    className="form-input-style"
                    required
                  />
                </div>

                {/* Account Type */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
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

              <div className="flex gap-4">
                {/* Course */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
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

                {/* Year & Section */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year & Section</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
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
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            className="w-20 py-1 rounded-lg bg-blue-700 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition shadow-sm cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            className="w-20 py-1 rounded-lg border border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAccountModal;