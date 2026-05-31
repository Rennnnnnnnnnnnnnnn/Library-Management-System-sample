import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";

function EditActivityModal({ isOpen, onClose, activity }) {

    const [formData, setFormData] = useState({
        student_number: "",
        name: "",
        year_and_section: "",
        activity_type: "",
        item_id: "",
        category: "",
        item_condition: ""
    });

    const [isFetchingAccount, setIsFetchingAccount] = useState(false);
    const [accountFound, setAccountFound] = useState(false);
    const [accountDetails, setAccountDetails] = useState(null);
    const [itemDetails, setItemDetails] = useState(null);
    const [itemFound, setItemFound] = useState(false);
    const [isFetchingItemDetails, setIsFetchingItemDetails] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingReturnStatus, setIsFetchingReturnStatus] = useState(false);

    const fetchReturnedItemStatus = async (item_id) => {
        if (!item_id) return;

        try {
            setIsFetchingReturnStatus(true);

            const { data } = await api.get(
                `/api/activity/getBorrowedItemDetails/${item_id}`
            );

            setFormData(prev => ({
                ...prev,
                return_status: data.return_status
            }));

        } catch (error) {
            setFormData(prev => ({ ...prev, return_status: "" }));
        } finally {
            setIsFetchingReturnStatus(false);
        }
    };

    useEffect(() => {
        if (!activity) return;

        setFormData({
            student_number: activity.student_number,
            name: activity.name,
            year_and_section: activity.year_and_section,
            activity_type: activity.activity_type,
            item_id: activity.item_id,
            category: activity.category,
            item_condition: activity.item_condition
        });

        console.log("aktibity ", activity)

    }, [activity]);


    useEffect(() => {
        if (
            formData.activity_type !== "Returned Item" ||
            !formData.item_id
        ) return;

        fetchReturnedItemStatus(formData.item_id);
    }, [formData.item_id, formData.activity_type]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

    useEffect(() => {
        if (!formData.student_number) return;
        fetchAccountDetails();
    }, [formData.student_number]);

    const fetchItemDetails = async (item_id) => {
        if (!item_id) return;

        try {
            setIsFetchingItemDetails(true);
            setItemFound(false);

            const { data } = await api.get(`/api/activity/item/${item_id}`);

            setItemDetails(data);
            setItemFound(true);

            setFormData(prev => ({
                ...prev,
                category: data.category
            }));

        } catch (error) {
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

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setIsSaving(true);
            await api.put(`/api/activity/editActivity/${activity.act_id}`, formData);
            toast.success("Activity updated successfully");
            onClose();

        } catch (error) {
            const msg = error.response?.data?.error || "Update failed";
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({
            student_number: "",
            name: "",
            year_and_section: "",
            activity_type: "",
            item_id: "",
            category: "",
            item_condition: ""
        });

        setAccountDetails(null);
        setItemDetails(null);
        setItemFound(false);
        setIsFetchingItemDetails(false);
        setIsFetchingAccount(false);

        onClose();
    };


    useEffect(() => {
        console.log("ACTIVITY PROP:", activity);
    }, [activity]);


    if (!isOpen || !activity) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-50">
            <div className="p-6 rounded-lg w-full max-w-xl border shadow-lg bg-white text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700">
                <h2 className="text-xl font-semibold text-center mb-4">
                    Edit Activity
                </h2>

                <form className="space-y-4" onSubmit={handleSave}>
                    <div>
                        <label className="text-sm text-gray-700 block mb-1 dark:text-gray-300">
                            Student Number:
                        </label>
                        <input
                            name="student_number"
                            type="text"
                            onChange={handleInputChange}
                            value={formData.student_number}
                            className="form-input-style"
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

                    {/* Account Details */}
                    {formData.student_number && accountFound && (
                        <div className="p-3 rounded text-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white">
                            <p>Name: {accountDetails.name}</p>
                            <p>Course & Year - Section: {accountDetails.course} - {accountDetails.year_and_section}</p>
                        </div>
                    )}

                    {/* Activity Type */}
                    <div>
                        <label className="text-sm text-gray-700 block mb-1 dark:text-gray-300">
                            Activity Type:
                        </label>
                        <select
                            name="activity_type"
                            value={formData.activity_type}
                            onChange={handleInputChange}
                            className="form-input-style hover:cursor-pointer"
                        >
                            <option value="Used Library">Used Library</option>
                            <option value="Borrowed Item">Borrowed Item</option>
                            <option value="Returned Item">Returned Item</option>
                        </select>
                    </div>

                    {/* Item Section */}
                    {(formData.activity_type === "Borrowed Item" ||
                        formData.activity_type === "Returned Item") && (
                            <div className="flex gap-4 flex-col sm:flex-row">
                                <div className="flex-1">
                                    <label className="text-sm block mb-1">Item ID:</label>
                                    <input
                                        type="text"
                                        name="item_id"
                                        value={formData.item_id}
                                        onChange={handleInputChange}
                                        className="form-input-style"
                                    />
                                </div>

                                {formData.activity_type === "Returned Item" && (
                                    <div className="flex-1">
                                        <label className="text-sm block mb-1">Condition:</label>
                                        <input
                                            type="text"
                                            name="item_condition"
                                            value={formData.item_condition}
                                            onChange={handleInputChange}
                                            className="form-input-style"
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


                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-24 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition shadow-sm hover:cursor-pointer"
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-24 py-2 rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-200 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-900 transition hover:cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditActivityModal;