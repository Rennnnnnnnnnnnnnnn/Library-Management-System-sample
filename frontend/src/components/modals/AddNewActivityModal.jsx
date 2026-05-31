import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";

function AddActivityModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    student_number: "",
    name: "",
    year_and_section: "",
    activity_type: "",
    item_id: "",
    category: "",
    return_status: "",
    item_condition: ""
  });

  const [isFetchingAccount, setIsFetchingAccount] = useState(false);
  const [accountFound, setAccountFound] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);

  const [itemDetails, setItemDetails] = useState(null);
  const [itemFound, setItemFound] = useState(false);
  const [isFetchingItemDetails, setIsFetchingItemDetails] = useState(false);

  const [isFetchingReturnStatus, setIsFetchingReturnStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getStatusColor = (status) => {
    if (!status) return "text-white";
    if (status.includes("Early")) return "text-green-400";
    if (status.includes("On Time")) return "text-blue-400";
    if (status.includes("Late")) return "text-red-400";
    if (status.includes("No transaction")) return "text-red-400";
    return "text-white";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset item details on activity type change
  useEffect(() => {
    setFormData((prev) => ({ ...prev, item_id: "" }));
    setItemDetails(null);
    setItemFound(false);
  }, [formData.activity_type]);

  const fetchAccountDetails = async () => {
    try {
      setIsFetchingAccount(true);
      const { data } = await api.get(`/api/activity/account/${formData.student_number}`);
      if (!data?.name) {
        setAccountFound(false);
        setAccountDetails(null);
        return;
      }
      setAccountDetails(data);
      setAccountFound(true);
      setFormData((prev) => ({ ...prev, name: data.name, year_and_section: data.year_and_section }));
    } catch (error) {
      console.error(error);
      setAccountFound(false);
      setAccountDetails(null);
    } finally {
      setIsFetchingAccount(false);
    }
  };

  const fetchItemDetails = async (itemId) => {
    if (!itemId) return;
    try {
      setIsFetchingItemDetails(true);
      const { data } = await api.get(`/api/activity/item/${itemId}`);
      if (!data || !data.title) {
        setItemFound(false);
        setItemDetails(null);
        return;
      }
      setItemDetails(data);
      setItemFound(true);
      setFormData((prev) => ({ ...prev, category: data.category }));
    } catch (error) {
      console.error(error);
      setItemFound(false);
      setItemDetails(null);
    } finally {
      setIsFetchingItemDetails(false);
    }
  };


  useEffect(() => {
    if (!formData.item_id) return;
    fetchItemDetails(formData.item_id);

  }, [formData.item_id]);

  const fetchReturnedItemStatus = async (item_id) => {
    if (!item_id) return;
    try {
      setIsFetchingReturnStatus(true);
      const { data } = await api.get(`/api/activity/getBorrowedItemDetails/${item_id}`);
      setFormData((prev) => ({ ...prev, return_status: data.return_status }));
    } catch (error) {
      console.error(error);
      setFormData((prev) => ({ ...prev, return_status: "" }));
    } finally {
      setIsFetchingReturnStatus(false);
    }
  };

  useEffect(() => {
    if (formData.activity_type !== "Returned Item" || !formData.item_id) return;
    fetchReturnedItemStatus(formData.item_id);
  }, [formData.item_id, formData.activity_type]);

  useEffect(() => {
    if (!formData.student_number) return;
    fetchAccountDetails();
  }, [formData.student_number]);

  const handleClose = () => {
    setFormData({
      student_number: "",
      name: "",
      year_and_section: "",
      activity_type: "",
      item_id: "",
      category: "",
      return_status: "",
      item_condition: ""
    });
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.post("/api/activity/addActivity", formData);
      toast.success("Activity recorded successfully.");
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-xs z-50 p-4">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-6 rounded-lg relative w-full max-w-xl shadow-lg border border-gray-200 dark:border-gray-700">

        <h2 className="text-xl font-semibold text-center mb-4">
          Add Activity
        </h2>

        <form className="space-y-4" onSubmit={handleSave}>

          {/* Activity Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Activity Type:
            </label>
            <select
              name="activity_type"
              value={formData.activity_type}
              onChange={handleInputChange}
              className="form-input-style"
              required
            >
              <option value="" disabled>Select activity</option>
              <option value="Used Library">Used Library</option>
              <option value="Borrowed Item">Borrowed Item</option>
              <option value="Returned Item">Returned Item</option>
            </select>
          </div>

          {/* Student Number */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Student Number:
            </label>
            <input
              type="text"
              name="student_number"
              value={formData.student_number}
              onChange={handleInputChange}
              className="form-input-style"
              required
            />
          </div>

          {/* Status messages */}
          {isFetchingAccount && (
            <p className="text-xs text-gray-400 text-center">
              Getting account details...
            </p>
          )}

          {!isFetchingAccount && !accountFound && formData.student_number && (
            <p className="text-xs text-red-400 text-center">
              Account not found
            </p>
          )}

          {/* Account details */}
          {formData.student_number && accountFound && (
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
              <p>Name: {accountDetails.name}</p>
              <p>Course - Year & Section: {accountDetails.year_and_section}</p>
            </div>
          )}

          {/* Borrow / Return Section */}
          {(formData.activity_type === "Borrowed Item" ||
            formData.activity_type === "Returned Item") && (
              <div className="flex flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Item ID:
                  </label>
                  <input
                    type="text"
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleInputChange}
                    className="form-input-style"
                    required
                  />
                </div>

                {formData.activity_type === "Returned Item" && (
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Item Return Condition:
                    </label>
                    <input
                      type="text"
                      name="item_condition"
                      value={formData.item_condition}
                      onChange={handleInputChange}
                      className="form-input-style"
                      required
                    />
                  </div>
                )}
              </div>
            )}

          {/* GETTING ITEM DETAILS */}
          {isFetchingItemDetails && (
            <p className="text-xs text-gray-400 text-center">
              Getting item details...
            </p>
          )}

          {/* ITEM NOT FOUND */}
          {!isFetchingItemDetails && !itemFound && formData.item_id && (
            <p className="text-xs text-red-400 text-center">
              Item not found
            </p>
          )}

          {/* ITEM DETAILS */}
          {formData.item_id && itemFound && itemDetails && (
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
              <p>Title: {itemDetails.title}</p>
              <p>Author: {itemDetails.author}</p>

              {itemDetails.category === "Academic Paper" && (
                <>
                  <p>Academic Year: {itemDetails.academic_year}</p>
                  <p>Course: {itemDetails.course}</p>
                  <p>Type: {itemDetails.type}</p>
                </>
              )}
            </div>
          )}

          {/* Return status */}
          {formData.activity_type === "Returned Item" && itemFound && (
            <div className="text-sm">
              {formData.item_id && isFetchingReturnStatus ? (
                <p className="text-gray-400">Checking status...</p>
              ) : formData.return_status ? (
                <p>
                  <span className="text-gray-300">Return Status:</span>{" "}
                  <span
                    className={`ml-2 font-semibold ${getStatusColor(
                      formData.return_status
                    )}`}
                  >
                    {formData.return_status}
                  </span>
                </p>
              ) : (
                <p className="text-red-400">
                  No pending transaction for this item.
                </p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-x-4">
            <button
              type="submit"
              className="w-20 py-1 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition shadow-sm hover:cursor-pointer"
            >
              Save
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition hover:cursor-pointer"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddActivityModal;